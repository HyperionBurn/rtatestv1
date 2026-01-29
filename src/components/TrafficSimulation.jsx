import React, { useState, useEffect, useRef } from 'react';

// Traffic Logic Constants
const LANE_LENGTH = 100; // % of container
const CAR_SPEED = 0.5; // % per tick
const MIN_GREEN_TIME = 2000; // Minimum time a light must stay green

// Algorithm Parameters (User defined)
const WEIGHTS = {
    car: 1.0,
    bus: 2.5,
    truck: 3.0,
    ambulance: 50.0 // Super high priority
};

const TrafficSimulation = ({ onStatUpdate }) => {
    // State for lights: 'NS' (North-South) or 'EW' (East-West) green
    const [greenLight, setGreenLight] = useState('NS');
    const [pressure, setPressure] = useState({ NS: 0, EW: 0 }); // Live algorithm values

    // Cars: { id, axis, position, direction, stopped, type, weight }
    const [cars, setCars] = useState([]);

    // Refs for animation loop and logic
    const requestRef = useRef();
    const carsRef = useRef([]);
    const lastLightSwitch = useRef(Date.now());
    const lightStateRef = useRef('NS'); // Ref to track light state inside loop without dependency issues

    // --- Car Spawning ---
    useEffect(() => {
        const spawnCar = () => {
            const axis = Math.random() > 0.5 ? 'NS' : 'EW';
            const direction = Math.random() > 0.5 ? 1 : -1;

            // Determine Vehicle Type based on probability
            const rand = Math.random();
            let type = 'car';
            if (rand > 0.98) type = 'ambulance';
            else if (rand > 0.90) type = 'truck';
            else if (rand > 0.80) type = 'bus';

            const newCar = {
                id: Date.now() + Math.random(),
                axis,
                direction,
                position: direction === 1 ? -15 : 115, // Start further out for larger vehicles
                stopped: false,
                type,
                weight: WEIGHTS[type],
                speedMod: type === 'ambulance' ? 1.5 : (type === 'truck' ? 0.8 : 1.0)
            };

            carsRef.current = [...carsRef.current, newCar];
        };

        const interval = setInterval(spawnCar, 1200); // Slightly slower spawn to manage density
        return () => clearInterval(interval);
    }, []);

    // --- AI Agent Logic (Real Remote API) ---
    const lastAIRequest = useRef(0);
    const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'online', 'offline', 'connecting'

    useEffect(() => {
        const checkAI = async () => {
            const now = Date.now();
            if (now - lastAIRequest.current < 6000) return; // Throttle 6s (Rate Limit Protection)
            lastAIRequest.current = now;

            // Prepare Payload
            // We need to calculate state snapshot
            const nsCars = carsRef.current.filter(c => c.axis === 'NS' && (c.stopped || (c.position > 20 && c.position < 80)));
            const ewCars = carsRef.current.filter(c => c.axis === 'EW' && (c.stopped || (c.position > 20 && c.position < 80)));
            const pressureNS = Math.round(nsCars.reduce((sum, c) => sum + c.weight, 0));
            const pressureEW = Math.round(ewCars.reduce((sum, c) => sum + c.weight, 0));

            // Detect special vehicles
            const specialVehicles = [...new Set(carsRef.current.map(c => c.type !== 'car' ? c.type : null).filter(Boolean))];

            const payload = {
                current_green: lightStateRef.current,
                ns_pressure: pressureNS,
                ew_pressure: pressureEW,
                special_vehicles: specialVehicles
            };

            try {
                const res = await fetch('http://localhost:8000/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error("API Error");

                const data = await res.json();
                setConnectionStatus('online');

                // AI Decision Execution
                if (data.should_switch) {
                    // Check if minimum time elapsed (double check safety)
                    if (Date.now() - lastLightSwitch.current > MIN_GREEN_TIME) {
                        const nextLight = lightStateRef.current === 'NS' ? 'EW' : 'NS';
                        switchLight(nextLight);
                    }
                }

                // Log propagation
                if (data.reason) {
                    latestAILog.current = data.reason;
                }

                // Store insights data for Dashboard
                if (data.data_sources) {
                    latestDataSources.current = data.data_sources;
                }
                if (data.insights) {
                    latestInsights.current = data.insights;
                }

            } catch (e) {
                console.error("Fetch failed", e);
                setConnectionStatus('offline');
            }
        };

        const interval = setInterval(checkAI, 1000);
        return () => clearInterval(interval);
    }, []);

    const latestAILog = useRef(null);
    const latestDataSources = useRef([]);
    const latestInsights = useRef([]);

    // --- Physics & Algorithm Loop ---
    const updatePhysics = () => {
        // 1. Move Cars & Detect Stops
        carsRef.current = carsRef.current.map(car => {
            let isMoving = true;
            let effectiveSpeed = CAR_SPEED * car.speedMod;

            // Stop Line Logic
            const stopLineApproaching =
                (car.direction === 1 && car.position > 35 && car.position < 40) ||
                (car.direction === -1 && car.position < 65 && car.position > 60);

            if (stopLineApproaching) {
                if (lightStateRef.current !== car.axis) { // Check against Ref, not State
                    isMoving = false; // Red light
                }
            }

            // Collision Detection (Simple)
            const carAhead = carsRef.current.find(other =>
                other.id !== car.id &&
                other.axis === car.axis &&
                other.direction === car.direction &&
                (
                    (car.direction === 1 && other.position > car.position && other.position < car.position + 18) ||
                    (car.direction === -1 && other.position < car.position && other.position > car.position - 18)
                )
            );

            if (carAhead && (!carAhead.isMoving && carAhead.stopped)) {
                isMoving = false;
            }

            if (isMoving) {
                car.position += (car.direction * effectiveSpeed);
            }

            car.stopped = !isMoving;
            return car;
        }).filter(car => car.position > -30 && car.position < 130);

        setCars([...carsRef.current]);

        // 2. Max-Pressure Algorithm Calculation
        // Pressure = Sum of weights of STOPPED or QUEUED vehicles
        // We strictly count vehicles that are waiting or approaching a red light
        const nsCars = carsRef.current.filter(c => c.axis === 'NS' && (c.stopped || (c.position > 20 && c.position < 80)));
        const ewCars = carsRef.current.filter(c => c.axis === 'EW' && (c.stopped || (c.position > 20 && c.position < 80)));

        const pressureNS = nsCars.reduce((sum, c) => sum + c.weight, 0);
        const pressureEW = ewCars.reduce((sum, c) => sum + c.weight, 0);

        // Update visuals strictly for feedback
        setPressure({ NS: Math.round(pressureNS), EW: Math.round(pressureEW) });

        // 3. Adaptive Control Logic
        const timeSinceSwitch = Date.now() - lastLightSwitch.current;

        if (timeSinceSwitch > MIN_GREEN_TIME) {
            // Max-Pressure Rule: Switch if the OTHER lane has significantly higher pressure
            // We add a small hysteresis (threshold) to prevent jitter when pressures are equal
            const THRESHOLD = 3.0;

            if (lightStateRef.current === 'NS') {
                if (pressureEW > pressureNS + THRESHOLD) {
                    switchLight('EW');
                }
            } else {
                if (pressureNS > pressureEW + THRESHOLD) {
                    switchLight('NS');
                }
            }
        }

        // Report stats back to parent (throttled)
        const now = Date.now();
        if (now - lastStatUpdate.current > 500) {
            const stoppedCount = carsRef.current.filter(c => c.stopped).length;
            const totalCount = carsRef.current.length;

            // Extract and clear log if present
            const log = latestAILog.current;
            if (log) latestAILog.current = null; // Clear after sending

            // Get latest insights data
            const dataSources = latestDataSources.current || [];
            const insights = latestInsights.current || [];

            if (onStatUpdate) onStatUpdate({
                stoppedCount,
                totalCount,
                pressureNS,
                pressureEW,
                aiLog: log,
                connectionStatus,
                dataSources,
                insights
            });
            lastStatUpdate.current = now;
        }

        requestRef.current = requestAnimationFrame(updatePhysics);
    };

    const switchLight = (newAxis) => {
        setGreenLight(newAxis);
        lightStateRef.current = newAxis;
        lastLightSwitch.current = Date.now();
    };

    const lastStatUpdate = useRef(0);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);


    // --- Render Helpers ---
    const getCarStyle = (car) => {
        const isVertical = car.axis === 'NS';
        // Position logic
        const left = isVertical ? '50%' : `${car.position}%`;
        const top = isVertical ? `${car.position}%` : '50%';

        // Offset for lanes (if moving South (dir 1), be on left side of road? Or right? let's stick to Right Hand Drive logic implies)
        // Vertical Road: Southbound (dir 1) -> Left side of screen (Local view)? 
        // Let's just create separate lanes via transform translate.

        let xOffset = 0;
        let yOffset = 0;
        const laneWidth = 20; // px

        if (isVertical) {
            xOffset = car.direction === 1 ? -laneWidth : laneWidth;
            // car.direction 1 = moving down (South). Right hand drive -> should be on Left of screen (Local view)? 
            // Let's just stick to: Dir 1 (Down) -> offset -10px (Left lane)
        } else {
            yOffset = car.direction === 1 ? laneWidth : -laneWidth;
        }

        return {
            left,
            top,
            transform: `translate(calc(-50% + ${xOffset}px), calc(-50% + ${yOffset}px)) rotate(${isVertical ? (car.direction === 1 ? 180 : 0) : (car.direction === 1 ? 90 : 270)}deg)`,
            position: 'absolute',
            transition: 'left 0.1s linear, top 0.1s linear', // Smoother simple animation
            zIndex: 20
        };
    };

    const getCarVisuals = (type, stopped) => {
        let color = stopped ? '#ef4444' : '#3b82f6';
        let width = '24px';

        if (type === 'bus') { color = '#f59e0b'; width = '40px'; }
        if (type === 'truck') { color = '#6366f1'; width = '45px'; }
        if (type === 'ambulance') { color = '#fff'; width = '28px'; } // Flashing logic handled in render maybe?

        return { color, width };
    };

    return (
        <div className="simulation-container glass" style={{
            width: '100%',
            height: '500px',
            position: 'relative',
            overflow: 'hidden',
            background: '#111',
            borderRadius: '16px',
            border: '1px solid #333'
        }}>
            {/* Background Grid */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                opacity: 0.3
            }} />

            {/* Roads */}
            {/* Vertical Road */}
            <div style={{
                position: 'absolute', left: '50%', top: 0, bottom: 0, width: '80px',
                background: '#1a1a1a', transform: 'translateX(-50%)',
                borderLeft: '2px solid #555', borderRight: '2px solid #555',
                display: 'flex', justifyContent: 'center'
            }}>
                <div style={{ width: '2px', height: '100%', background: 'dashed #444', borderRight: '2px dashed #666' }}></div>
            </div>

            {/* Horizontal Road */}
            <div style={{
                position: 'absolute', top: '50%', left: 0, right: 0, height: '80px',
                background: '#1a1a1a', transform: 'translateY(-50%)',
                borderTop: '2px solid #555', borderBottom: '2px solid #555',
                display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'center'
            }}>
                <div style={{ height: '2px', width: '100%', borderBottom: '2px dashed #666' }}></div>
            </div>

            {/* Intersection Glow */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', width: '80px', height: '80px',
                transform: 'translate(-50%, -50%)',
                background: greenLight === 'NS' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                boxShadow: `0 0 50px ${greenLight === 'NS' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                transition: 'all 0.5s ease'
            }} />

            {/* Algorithm Debug Visualization */}
            <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '80px', pointerEvents: 'none' }}>
                <div style={{ textAlign: 'center', opacity: 0.8 }}>
                    <div style={{ fontSize: '0.7em', color: '#888' }}>PRESSURE (NS)</div>
                    <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: pressure.NS > pressure.EW ? '#4ade80' : '#fff' }}>{pressure.NS.toFixed(1)}</div>
                </div>
                <div style={{ textAlign: 'center', opacity: 0.8 }}>
                    <div style={{ fontSize: '0.7em', color: '#888' }}>PRESSURE (EW)</div>
                    <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: pressure.EW > pressure.NS ? '#4ade80' : '#fff' }}>{pressure.EW.toFixed(1)}</div>
                </div>
            </div>


            {/* Traffic Lights Visuals */}
            {/* North Light */}
            <TrafficLight color={greenLight === 'NS' ? 'green' : 'red'} style={{ top: 'calc(50% - 60px)', left: 'calc(50% - 20px)' }} />
            {/* South Light */}
            <TrafficLight color={greenLight === 'NS' ? 'green' : 'red'} style={{ bottom: 'calc(50% - 60px)', right: 'calc(50% - 20px)' }} />
            {/* West Light */}
            <TrafficLight color={greenLight === 'EW' ? 'green' : 'red'} style={{ left: 'calc(50% - 60px)', bottom: 'calc(50% - 20px)' }} />
            {/* East Light */}
            <TrafficLight color={greenLight === 'EW' ? 'green' : 'red'} style={{ right: 'calc(50% - 60px)', top: 'calc(50% - 20px)' }} />

            {/* Cars */}
            {cars.map(car => (
                <div key={car.id} style={getCarStyle(car)}>
                    {/* Car Body */}
                    <div style={{
                        width: '24px', height: '12px',
                        background: car.stopped ? '#ef4444' : '#3b82f6',
                        borderRadius: '2px',
                        boxShadow: `0 0 10px ${car.stopped ? '#ef4444' : '#3b82f6'}`,
                        position: 'relative'
                    }}>
                        {/* Headlights */}
                        <div style={{ position: 'absolute', right: -2, top: 0, width: 2, height: 4, background: '#fff', boxShadow: '0 0 5px #fff' }} />
                        <div style={{ position: 'absolute', right: -2, bottom: 0, width: 2, height: 4, background: '#fff', boxShadow: '0 0 5px #fff' }} />
                    </div>
                </div>
            ))}

            {/* Overlay UI */}
            <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: '0.8rem', color: '#666', fontFamily: 'monospace' }}>
                ALGORITHM: MAX-PRESSURE ADAPTIVE | UTC-UX LIVE
            </div>
        </div>
    );
};

const TrafficLight = ({ color, style }) => (
    <div style={{
        position: 'absolute', width: '12px', height: '12px', borderRadius: '50%',
        background: color,
        boxShadow: `0 0 15px ${color} `,
        transition: 'background 0.3s',
        zIndex: 10,
        ...style
    }} />
);

export default TrafficSimulation;
