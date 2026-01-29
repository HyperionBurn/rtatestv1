"""
Multi-Source Data Aggregation Module
Native AI Agent for Traffic Intelligence
"""

import os
import requests
import random
from datetime import datetime
from abc import ABC, abstractmethod
from bs4 import BeautifulSoup
import concurrent.futures
from dotenv import load_dotenv

load_dotenv()

# API Keys from environment
TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")
PREDICTHQ_API_KEY = os.getenv("PREDICTHQ_API_KEY")


class BaseDataSource(ABC):
    """Abstract base class for all data sources"""
    
    @property
    @abstractmethod
    def name(self) -> str:
        pass
    
    @abstractmethod
    def fetch_sync(self) -> dict:
        """Synchronous fetch method"""
        pass


class WeatherSource(BaseDataSource):
    """Fetches real weather from OpenMeteo"""
    
    name = "Weather API"
    
    def fetch_sync(self) -> dict:
        try:
            url = "https://api.open-meteo.com/v1/forecast?latitude=25.2048&longitude=55.2708&current_weather=true"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                current = data.get('current_weather', {})
                code = current.get('weathercode', 0)
                condition = self._get_wmo_description(code)
                
                return {
                    "source": self.name,
                    "status": "live (OpenMeteo)",
                    "condition": condition,
                    "description": f"{condition}, Wind: {current.get('windspeed')} km/h",
                    "temperature": current.get('temperature'),
                    "impact": "high" if code >= 51 else "low"
                }
        except Exception as e:
            print(f"⚠️ Weather fetch failed: {e}")
        
        return {"source": self.name, "status": "simulated", "condition": "Clear", "impact": "low"}
    
    def _get_wmo_description(self, code: int) -> str:
        if code == 0: return "Clear sky"
        if code in [1, 2, 3]: return "Partly cloudy"
        if code in [45, 48]: return "Fog"
        if code in [51, 53, 55]: return "Drizzle"
        if code in [61, 63, 65]: return "Rain"
        if code >= 95: return "Thunderstorm"
        return "Unknown"


class TrafficNewsSource(BaseDataSource):
    """Fetches real traffic news from Google News RSS"""
    
    name = "Traffic News"
    
    def fetch_sync(self) -> dict:
        try:
            url = "https://news.google.com/rss/search?q=Dubai+Traffic+when:1d&hl=en-AE&gl=AE&ceid=AE:en"
            resp = requests.get(url, timeout=10)
            
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.content, 'xml')
                items = soup.find_all('item', limit=3)
                events = [item.title.text for item in items]
                
                if events:
                    return {
                        "source": self.name,
                        "status": "live (Google News)",
                        "events": events,
                        "impact": "medium"
                    }
        except Exception as e:
            print(f"⚠️ News fetch failed: {e}")
            
        return {"source": self.name, "status": "simulated", "events": [], "impact": "none"}


class TomTomTrafficSource(BaseDataSource):
    """
    Fetches real-time traffic flow from TomTom Traffic API
    Free tier: 2,500 requests/day
    """
    
    name = "TomTom Traffic"
    
    def fetch_sync(self) -> dict:
        if not TOMTOM_API_KEY:
            return self._simulate()
        
        try:
            # Downtown Dubai coordinates (Burj Khalifa area)
            lat, lon = 25.1972, 55.2744
            
            # TomTom Traffic Flow API
            url = f"https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point={lat},{lon}&key={TOMTOM_API_KEY}"
            resp = requests.get(url, timeout=10)
            
            if resp.status_code == 200:
                data = resp.json()
                flow = data.get('flowSegmentData', {})
                
                current_speed = flow.get('currentSpeed', 0)
                free_flow_speed = flow.get('freeFlowSpeed', 80)
                congestion = 1 - (current_speed / free_flow_speed) if free_flow_speed > 0 else 0.5
                
                return {
                    "source": self.name,
                    "status": "live (TomTom)",
                    "current_speed_kmh": current_speed,
                    "free_flow_speed_kmh": free_flow_speed,
                    "congestion_level": round(congestion, 2),
                    "road_closure": flow.get('roadClosure', False),
                    "impact": "high" if congestion > 0.5 else "low"
                }
            elif resp.status_code == 403:
                print("⚠️ TomTom API key invalid or quota exceeded")
        except Exception as e:
            print(f"⚠️ TomTom fetch failed: {e}")
        
        return self._simulate()
    
    def _simulate(self) -> dict:
        hour = datetime.now().hour
        is_rush = 7 <= hour <= 9 or 17 <= hour <= 20
        congestion = random.uniform(0.6, 0.9) if is_rush else random.uniform(0.2, 0.4)
        
        return {
            "source": self.name,
            "status": "simulated (no API key)",
            "congestion_level": round(congestion, 2),
            "impact": "high" if congestion > 0.5 else "low"
        }


class PredictHQEventsSource(BaseDataSource):
    """
    Fetches major events from PredictHQ API
    Free tier: 1,000 events/month
    """
    
    name = "PredictHQ Events"
    
    def fetch_sync(self) -> dict:
        if not PREDICTHQ_API_KEY:
            return self._simulate()
        
        try:
            # Dubai bounding box
            url = "https://api.predicthq.com/v1/events/"
            headers = {
                "Authorization": f"Bearer {PREDICTHQ_API_KEY}",
                "Accept": "application/json"
            }
            params = {
                "within": "25km@25.2048,55.2708",  # 25km around Dubai
                "active.gte": datetime.now().strftime("%Y-%m-%d"),
                "category": "concerts,sports,festivals,conferences",
                "limit": 5,
                "sort": "rank"
            }
            
            resp = requests.get(url, headers=headers, params=params, timeout=10)
            
            if resp.status_code == 200:
                data = resp.json()
                events = []
                
                for event in data.get('results', []):
                    events.append({
                        "title": event.get('title'),
                        "category": event.get('category'),
                        "rank": event.get('rank'),
                        "attendance": event.get('phq_attendance')
                    })
                
                if events:
                    top_event = max(events, key=lambda x: x.get('rank', 0))
                    impact = "high" if top_event.get('rank', 0) > 70 else "medium"
                    
                    return {
                        "source": self.name,
                        "status": "live (PredictHQ)",
                        "events_count": len(events),
                        "events": events,
                        "top_event": top_event.get('title'),
                        "impact": impact
                    }
            elif resp.status_code == 401:
                print("⚠️ PredictHQ API key invalid")
        except Exception as e:
            print(f"⚠️ PredictHQ fetch failed: {e}")
        
        return self._simulate()
    
    def _simulate(self) -> dict:
        # Simulate occasional major events
        has_event = random.random() > 0.7
        
        if has_event:
            events = [
                {"title": "Dubai Shopping Festival", "category": "festivals", "rank": 85},
                {"title": "Dubai World Cup", "category": "sports", "rank": 90},
            ]
            event = random.choice(events)
            return {
                "source": self.name,
                "status": "simulated (no API key)",
                "events_count": 1,
                "events": [event],
                "top_event": event["title"],
                "impact": "high"
            }
        
        return {
            "source": self.name,
            "status": "simulated (no API key)",
            "events_count": 0,
            "events": [],
            "impact": "none"
        }


class RTADataSource(BaseDataSource):
    """Simulates RTA data with accurate Dubai rush hour logic"""
    
    name = "RTA Data Feed"
    
    def fetch_sync(self) -> dict:
        hour = datetime.now().hour
        day = datetime.now().weekday()
        is_weekend = day >= 5 
        
        is_morning_rush = 7 <= hour <= 9 and not is_weekend
        is_evening_rush = 17 <= hour <= 20 and not is_weekend
        
        congestion = 0.3
        status_msg = "Free Flow"
        
        if is_morning_rush:
            congestion = random.uniform(0.75, 0.95)
            status_msg = "Heavy Congestion (Morning Rush)"
        elif is_evening_rush:
            congestion = random.uniform(0.80, 0.98)
            status_msg = "Severe Congestion (Evening Rush)"
        elif not is_weekend and 9 < hour < 17:
            congestion = random.uniform(0.4, 0.6)
            status_msg = "Moderate Flow"
            
        return {
            "source": self.name,
            "status": "simulated (logic-enhanced)",
            "network_congestion": round(congestion, 2),
            "description": status_msg,
            "recommendation": "Use Metro" if congestion > 0.7 else "Roads Clear"
        }


class DataSourceAgent:
    """Orchestrates data collection using ThreadPoolExecutor"""
    
    def __init__(self):
        self.sources = [
            WeatherSource(),
            TrafficNewsSource(),
            TomTomTrafficSource(),
            PredictHQEventsSource(),
            RTADataSource()
        ]
    
    def gather_sync(self) -> dict:
        aggregated = {
            "timestamp": datetime.now().isoformat(),
            "sources_queried": len(self.sources),
            "data": {}
        }
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            future_to_source = {executor.submit(s.fetch_sync): s for s in self.sources}
            
            for future in concurrent.futures.as_completed(future_to_source):
                source = future_to_source[future]
                try:
                    data = future.result(timeout=15)
                    aggregated["data"][source.name] = data
                except Exception as e:
                    aggregated["data"][source.name] = {"source": source.name, "status": "error", "error": str(e)}
                    
        return aggregated

def get_external_data() -> dict:
    return DataSourceAgent().gather_sync()

if __name__ == "__main__":
    import json
    print(json.dumps(get_external_data(), indent=2))
