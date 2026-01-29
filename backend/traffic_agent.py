"""
Native AI Traffic Agent
Multi-source data aggregation with Groq/Llama intelligence
"""

import os
import json
import asyncio
from groq import Groq, RateLimitError
from dotenv import load_dotenv
from data_sources import DataSourceAgent

load_dotenv(override=True)

# Configure Groq Client
api_key = os.getenv("GROQ_API_KEY")
client = None

if not api_key:
    print("❌ ERROR: GROQ_API_KEY not found in .env file.")
else:
    api_key = api_key.strip()
    print(f"✅ GROQ_API_KEY loaded: {api_key[:4]}...{api_key[-4:]}")
    try:
        client = Groq(api_key=api_key)
    except Exception as e:
        print(f"❌ Error initializing Groq Client: {e}")

MODEL_ID = 'llama-3.3-70b-versatile'

# Initialize Data Source Agent
data_agent = DataSourceAgent()
print("✅ Multi-Source Data Agent initialized")

SYSTEM_PROMPT = """
You are the AI Brain of the Dubai RTA UTC-UX Fusion Traffic System.
Your job is to analyze real-time intersection data combined with external intelligence to make optimal control decisions.

Goal: Minimize waiting time (pressure), prioritize emergency vehicles, and factor in external conditions.

Algorithm Context:
The system runs a "Max-Pressure" algorithm enhanced with external data.
- Pressure = sum of weights of waiting vehicles.
- Weights: Car=1, Bus=2.5, Truck=3, Ambulance=50.
- External factors: Weather, traffic incidents, RTA network status.

Input Data:
You will receive JSON data with:
- current_green: 'NS' or 'EW'
- ns_pressure: Total pressure on North-South road.
- ew_pressure: Total pressure on East-West road.
- special_vehicles: List of special vehicle types present (e.g., ['ambulance', 'bus']).
- external_data: Object containing weather, news, and RTA network data.

Output:
Return a JSON object ONLY:
{
  "should_switch": boolean, 
  "reason": "Short, professional log message explaining why, mentioning relevant external factors.",
  "confidence": float (0-1),
  "insights": ["Array of 1-2 brief insights based on external data"]
}

Decision Rules:
1. If an Ambulance is waiting on the RED light axis -> SWITCH IMMEDIATELY (emergency priority).
2. If weather has "high" impact (rain, dust storm) -> Be more conservative, avoid frequent switches.
3. If pressure on RED light axis is > 20% higher than GREEN light axis -> SWITCH.
4. If RTA network congestion > 0.7 -> Factor into reasoning.
5. Otherwise -> HOLD.

Tone: Technical, professional, efficient. Reference data sources when relevant.
"""


def analyze_traffic(data: dict) -> dict:
    """
    Analyzes traffic state using:
    1. Multi-source external data aggregation
    2. Groq/Llama AI for intelligent synthesis
    """
    
    # 1. Gather external data from all sources
    try:
        external_data = data_agent.gather_sync()
        print(f"📊 Gathered data from {external_data['sources_queried']} sources")
    except Exception as e:
        print(f"⚠️ External data fetch error: {e}")
        external_data = {"error": str(e), "data": {}}
    
    # 2. Prepare enhanced payload for AI
    enhanced_data = {
        **data,
        "external_data": external_data.get("data", {})
    }
    
    # 3. Use Groq/Llama for intelligent analysis
    if not client:
        return _fallback_logic(data, external_data)
    
    try:
        user_msg = f"""
Current State:
- Green Light Axis: {data.get('current_green')}
- NS Pressure: {data.get('ns_pressure')}
- EW Pressure: {data.get('ew_pressure')}
- Special Vehicles Detected: {data.get('special_vehicles', [])}

External Intelligence:
{json.dumps(external_data.get('data', {}), indent=2)}

Analyze and decide. Return JSON only.
"""
        
        completion = client.chat.completions.create(
            model=MODEL_ID,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_msg}
            ],
            temperature=0.3,
            max_tokens=300,
            response_format={"type": "json_object"}
        )
        
        content = completion.choices[0].message.content
        result = json.loads(content)
        
        # Add metadata
        result["data_sources"] = list(external_data.get("data", {}).keys())
        result["ai_model"] = MODEL_ID
        
        return result
    
    except RateLimitError as e:
        print(f"⚠️ Rate Limit Hit: {e}")
        return _fallback_logic(data, external_data, "Rate limited - using local logic")
    
    except Exception as e:
        print(f"AI Error: {e}")
        return _fallback_logic(data, external_data, f"AI Error: {str(e)}")


def _fallback_logic(data: dict, external_data: dict, error_msg: str = None) -> dict:
    """
    Fallback local logic when AI is unavailable.
    Implements basic Max-Pressure algorithm with weather consideration.
    """
    current_green = data.get('current_green', 'NS')
    ns_pressure = data.get('ns_pressure', 0)
    ew_pressure = data.get('ew_pressure', 0)
    special_vehicles = data.get('special_vehicles', [])
    
    # Check for emergency vehicles
    if 'ambulance' in special_vehicles:
        red_axis = 'EW' if current_green == 'NS' else 'NS'
        return {
            "should_switch": True,
            "reason": f"🚨 EMERGENCY: Ambulance detected on {red_axis} axis - immediate switch",
            "confidence": 1.0,
            "insights": ["Emergency vehicle priority activated"],
            "data_sources": list(external_data.get("data", {}).keys()),
            "fallback": True
        }
    
    # Get weather impact
    weather_data = external_data.get("data", {}).get("Weather API", {})
    weather_impact = weather_data.get("impact", "low")
    
    # Adjust threshold based on weather
    threshold = 5.0 if weather_impact == "high" else 3.0
    
    # Max-Pressure decision
    should_switch = False
    reason = "Holding current phase - balanced pressure"
    
    if current_green == 'NS' and ew_pressure > ns_pressure + threshold:
        should_switch = True
        reason = f"EW pressure ({ew_pressure}) exceeds NS ({ns_pressure}) by threshold"
    elif current_green == 'EW' and ns_pressure > ew_pressure + threshold:
        should_switch = True
        reason = f"NS pressure ({ns_pressure}) exceeds EW ({ew_pressure}) by threshold"
    
    # Add weather context
    if weather_impact == "high":
        reason += f" | Weather: {weather_data.get('condition', 'Unknown')} (conservative mode)"
    
    insights = []
    if weather_impact != "low":
        insights.append(f"Weather impact: {weather_impact} - {weather_data.get('description', '')}")
    
    rta_data = external_data.get("data", {}).get("RTA Data Feed", {})
    if rta_data.get("network_congestion", 0) > 0.6:
        insights.append(f"Network congestion: {rta_data.get('network_congestion', 0)*100:.0f}%")
    
    if error_msg:
        reason = f"[Fallback] {reason}"
    
    return {
        "should_switch": should_switch,
        "reason": reason,
        "confidence": 0.7,
        "insights": insights or ["Operating in local mode"],
        "data_sources": list(external_data.get("data", {}).keys()),
        "fallback": True
    }


if __name__ == "__main__":
    # Test the agent
    test_data = {
        "current_green": "NS",
        "ns_pressure": 5,
        "ew_pressure": 12,
        "special_vehicles": []
    }
    
    print("\n🧪 Testing Traffic Agent...")
    result = analyze_traffic(test_data)
    print(json.dumps(result, indent=2))
