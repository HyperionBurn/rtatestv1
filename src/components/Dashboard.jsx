import React, { useState, useEffect } from 'react';
import TrafficSimulation from './TrafficSimulation';

const Dashboard = () => {
    const [stats, setStats] = useState({ stoppedCount: 0, totalCount: 0 });
    const [logs, setLogs] = useState([]);
    const [efficiency, setEfficiency] = useState(85);
    const [aiInsights, setAiInsights] = useState({ dataSources: [], insights: [] });

    // Update logs when real AI data arrives
    useEffect(() => {
        if (stats.aiLog) {
            const time = new Date().toLocaleTimeString([], { hour12: false });
            setLogs(prev => [`[${time}] ${stats.aiLog}`, ...prev.slice(0, 6)]);
        }
        // Update AI insights if available
        if (stats.dataSources) {
            setAiInsights(prev => ({
                dataSources: stats.dataSources || prev.dataSources,
                insights: stats.insights || prev.insights
            }));
        }
    }, [stats.aiLog, stats.dataSources, stats.insights]);

    // Update efficiency based on "stopped" cars
    useEffect(() => {
        if (stats.totalCount > 0) {
            const stoppedRatio = stats.stoppedCount / stats.totalCount;
            const targetEff = Math.max(0, 100 - (stoppedRatio * 100));
            setEfficiency(prev => prev + (targetEff - prev) * 0.1);
        }
    }, [stats]);

    return (
        <div className="section-padding" id="dashboard" style={{ paddingTop: '100px', minHeight: '100vh' }}>
            <div className="container">
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Live System <span className="text-gradient">Monitor</span></h2>
                    <p>Real-time digital twin feed from Intersection #4201 (Downtown Node)</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }}>
                    {/* Main Sim Area */}
                    <div style={{ position: 'relative' }}>
                        <TrafficSimulation onStatUpdate={setStats} />
                        <div style={{
                            position: 'absolute', top: '1rem', right: '1rem',
                            background: 'rgba(0,0,0,0.6)', padding: '0.5rem 1rem',
                            borderRadius: '8px', border: '1px solid #333',
                            backdropFilter: 'blur(4px)'
                        }}>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>CURRENT PHASE</div>
                            <div style={{ fontWeight: 'bold', color: '#4ade80' }}>ADAPTIVE CONTROL</div>
                        </div>

                        {/* Backend Status Badge */}
                        <div style={{
                            position: 'absolute', bottom: '1rem', right: '1rem',
                            background: 'rgba(0,0,0,0.8)', padding: '0.5rem 1rem',
                            borderRadius: '8px', border: '1px solid #333',
                            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: stats.connectionStatus === 'online' ? '#4ade80' : (stats.connectionStatus === 'offline' ? '#ef4444' : '#fbbf24'),
                                boxShadow: `0 0 10px ${stats.connectionStatus === 'online' ? '#4ade80' : (stats.connectionStatus === 'offline' ? '#ef4444' : '#fbbf24')}`
                            }} />
                            <div style={{ fontSize: '0.8rem', color: '#fff' }}>
                                AI BRAIN: <span style={{ textTransform: 'uppercase' }}>{stats.connectionStatus || 'WAITING'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Side Panel: Stats & Logs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Efficiency Card */}
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                            <div style={{ fontSize: '0.9rem', color: '#bbb', marginBottom: '0.5rem' }}>TRAFFIC FLOW EFFICIENCY</div>
                            <div style={{ display: 'flex', alignItems: 'end', gap: '0.5rem' }}>
                                <span className="text-gradient" style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>{Math.round(efficiency)}%</span>
                                <span style={{ color: efficiency > 80 ? '#4ade80' : '#f43f5e', marginBottom: '8px' }}>
                                    {efficiency > 80 ? '▲ Optimal' : '▼ High Load'}
                                </span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: '#333', marginTop: '1rem', borderRadius: '2px' }}>
                                <div style={{ width: `${efficiency}%`, height: '100%', background: 'var(--gradient-main)', borderRadius: '2px', transition: 'width 0.5s' }} />
                            </div>
                        </div>

                        {/* Network Stats */}
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#888' }}>ACTIVE VEHICLES</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.totalCount}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#888' }}>CO2 SAVED (kg)</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{(stats.totalCount * 0.42).toFixed(1)}</div>
                            </div>
                        </div>

                        {/* AI Insights Panel - NEW */}
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                            <div style={{ fontSize: '0.9rem', color: '#bbb', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>🧠 AI INSIGHTS</span>
                                <span style={{ fontSize: '0.7rem', color: '#666' }}>Multi-Source Intelligence</span>
                            </div>

                            {/* Data Sources */}
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>ACTIVE SOURCES</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {(aiInsights.dataSources.length > 0 ? aiInsights.dataSources : ['Weather API', 'Traffic News', 'RTA Data Feed']).map((source, i) => (
                                        <span key={i} style={{
                                            padding: '0.25rem 0.5rem',
                                            background: 'rgba(79, 70, 229, 0.2)',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem',
                                            color: '#a5b4fc',
                                            border: '1px solid rgba(79, 70, 229, 0.3)'
                                        }}>
                                            {source}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Insights */}
                            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {aiInsights.insights.length > 0 ? (
                                    aiInsights.insights.map((insight, i) => (
                                        <div key={i} style={{
                                            marginBottom: '0.5rem',
                                            padding: '0.5rem',
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            borderRadius: '4px',
                                            borderLeft: '2px solid #10b981',
                                            color: '#6ee7b7'
                                        }}>
                                            💡 {insight}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#666', fontStyle: 'italic' }}>
                                        Gathering intelligence from data sources...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Agent Logs */}
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '0.9rem', color: '#bbb', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>AI DECISION LOG</span>
                                <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px #22c55e' }}></span>
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', overflow: 'hidden' }}>
                                {logs.map((log, i) => (
                                    <div key={i} style={{ marginBottom: '0.5rem', opacity: 1 - (i * 0.15), borderLeft: '2px solid rgba(79, 70, 229, 0.5)', paddingLeft: '8px' }}>
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Legend / Info */}
                <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem', justifyContent: 'center', opacity: 0.6, fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '2px' }}></div> Moving
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px' }}></div> Stopped
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%' }}></div> Signal Green
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
