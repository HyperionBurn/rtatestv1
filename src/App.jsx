import { useState, useEffect, useRef } from 'react'
import Dashboard from './components/Dashboard'

// Icons
const IconTraffic = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 17h11" /><path d="M6 20h12" /><path d="M6 7h12" /><path d="M6 4h12" /><rect x="2" y="2" width="20" height="20" rx="2" /></svg>
)
const IconBrain = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" /></svg>
)
const IconWifi = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>
)
const IconLeaf = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.77 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>
)
const IconCar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>
)
const IconCode = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
)

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // Scroll Reveal Logic
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    const revealedElements = document.querySelectorAll('.scroll-reveal');
    revealedElements.forEach(el => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      revealedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  // Demo Logic
  const [demoState, setDemoState] = useState('idle'); // idle, loading, done
  const [loadingProgress, setLoadingProgress] = useState(0);

  const startDemo = () => {
    if (demoState === 'loading') return;
    setDemoState('loading');
    setLoadingProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setLoadingProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setDemoState('done');
        setTimeout(() => {
          setDemoState('idle');
          setLoadingProgress(0);
        }, 3000);
      }
    }, 30);
  };

  return (
    <div className="app">
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'glass' : ''}`} style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: scrolled ? '1rem 0' : '2rem 0',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em', cursor: 'pointer' }} onClick={() => setShowDashboard(false)}>
            UTC-UX <span className="text-gradient">Fusion</span>
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            {!showDashboard ? (
              <>
                <a href="#vision" className="hide-mobile glow-underline" style={{ fontWeight: 500 }}>Vision</a>
                <a href="#features" className="hide-mobile glow-underline" style={{ fontWeight: 500 }}>Technology</a>
                <a href="#impact" className="hide-mobile glow-underline" style={{ fontWeight: 500 }}>Impact</a>
                <button
                  className="btn btn-primary btn-ripple pulse-glow"
                  onClick={() => setShowDashboard(true)}
                >
                  Launch Live System
                </button>
              </>
            ) : (
              <button
                className="btn btn-outline"
                onClick={() => setShowDashboard(false)}
              >
                Back to Home
              </button>
            )}
          </div>
        </div>
      </nav>

      {showDashboard ? <Dashboard /> : (
        <>
          {/* Hero Section */}
          <header style={{
            position: 'relative',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            paddingTop: '80px',
            overflow: 'hidden'
          }}>
            {/* Background Blob 1 */}
            <div style={{
              position: 'absolute', top: '-10%', left: '-10%', width: '800px', height: '800px',
              background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 60%)',
              filter: 'blur(80px)', zIndex: -1
            }} />
            {/* Background Blob 2 */}
            <div style={{
              position: 'absolute', bottom: '-10%', right: '-10%', width: '600px', height: '600px',
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 60%)',
              filter: 'blur(80px)', zIndex: -1
            }} />

            <div className="container" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '4rem', alignItems: 'center' }}>

                {/* Hero Text */}
                <div className="scroll-reveal">
                  <div className="animate-float" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '99px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    marginBottom: '1.5rem',
                    color: '#a5b4fc',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}>
                    <span style={{ width: 8, height: 8, background: '#00f0ff', borderRadius: '50%', boxShadow: '0 0 10px #00f0ff' }}></span>
                    Debuting H1 2026
                  </div>

                  <h1 style={{
                    fontSize: 'clamp(3.5rem, 6vw, 5.5rem)',
                    marginBottom: '1.5rem',
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em'
                  }}>
                    Dubai's Intelligent <br />
                    <span className="shimmer-text">Traffic Revolution</span>
                  </h1>

                  <p style={{ fontSize: '1.35rem', marginBottom: '2.5rem', maxWidth: '600px', color: 'var(--text-muted)' }}>
                    Introducing <strong>UTC-UX Fusion</strong>. A next-generation traffic control system powered by AI and Digital Twin technologies to eliminate congestion and drive sustainability.
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary btn-ripple" onClick={() => setShowDashboard(true)}>
                      Discover the Future <span style={{ marginLeft: '0.5rem' }}>→</span>
                    </button>
                    <button className="btn btn-outline btn-ripple">Read the Report</button>
                  </div>
                </div>

                {/* Hero Graphic / Interactive Demo Mockup */}
                <div className="glass scroll-reveal delay-200 glow-border" style={{
                  borderRadius: '24px',
                  padding: '2rem',
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Decorative Grids */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '30px 30px', zIndex: -1 }}></div>

                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>AI Traffic Simulation</div>
                    <div className="text-gradient" style={{ fontSize: '2rem', fontWeight: 700 }}>
                      {demoState === 'idle' ? 'Ready to Optimize' : demoState === 'loading' ? 'Analyzing Traffic...' : 'Optimization Complete'}
                    </div>
                  </div>

                  <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {demoState === 'idle' && (
                      <div style={{ transform: 'scale(2)', color: 'var(--text-muted)', transition: 'all 0.5s' }}><IconCar /></div>
                    )}

                    {demoState === 'loading' && (
                      <div style={{ position: 'relative' }}>
                        <div style={{ transform: 'scale(2)', opacity: 0.5, filter: 'blur(2px)' }}><IconCar /></div>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                          <div style={{ width: '60px', height: '60px', border: '3px solid transparent', borderTopColor: '#00f0ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                        </div>
                      </div>
                    )}

                    {demoState === 'done' && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ transform: 'scale(2)', color: '#10b981', filter: 'drop-shadow(0 0 15px rgba(16,185,129,0.5))', transition: 'all 0.5s' }}><IconTraffic /></div>
                        <div style={{ marginTop: '1rem', color: '#10b981', fontWeight: 600 }}>Traffic Flow +20%</div>
                      </div>
                    )}
                  </div>

                  <div className="loader-bar-container">
                    <div className="loader-bar-fill" style={{ width: `${loadingProgress}%` }}></div>
                  </div>

                  <button
                    className="btn btn-outline"
                    style={{ marginTop: '2rem', width: '100%', borderColor: demoState === 'loading' ? 'transparent' : '' }}
                    disabled={demoState === 'loading'}
                    onClick={startDemo}
                  >
                    {demoState === 'idle' ? 'Run AI Simulation' : demoState === 'loading' ? 'Processing...' : 'Reset Demo'}
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Stats Bar */}
          <section className="scroll-reveal" style={{ marginTop: '-4rem', position: 'relative', zIndex: 10, paddingBottom: '6rem' }}>
            <div className="container">
              <div className="glass" style={{ padding: '2rem 3rem', borderRadius: '20px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem' }}>
                {[
                  { label: 'Congestion Reduction', value: '20%', color: '#00f0ff' },
                  { label: 'Launch Date', value: '2026', color: '#bd00ff' },
                  { label: 'Key Crossings', value: '100%', color: '#10b981' }
                ].map((stat, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: stat.color, marginBottom: '0rem' }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>


          {/* Features - Bento Grid */}
          <section id="features" className="section-padding">
            <div className="container">
              <div className="scroll-reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Powered by <span className="text-gradient">Next-Gen Tech</span></h2>
                <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem' }}>
                  The UTC-UX Fusion system integrates cutting-edge technologies for a seamless, responsive, and sustainable transportation network.
                </p>
              </div>

              <div className="bento-grid">
                {/* Feature 1 - Large */}
                <div className="bento-item glass glass-hover tilt-card icon-bounce scroll-reveal delay-100" style={{ gridColumn: 'span 2', padding: '3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', height: '100%' }}>
                    <div style={{ maxWidth: '60%' }}>
                      <div style={{
                        width: '50px', height: '50px', borderRadius: '12px',
                        background: 'rgba(79, 70, 229, 0.2)', color: '#a5b4fc',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '1.5rem'
                      }}>
                        <IconBrain />
                      </div>
                      <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>AI & Predictive Analytics</h3>
                      <p>Optimizes signal timings dynamically in anticipation of expected traffic movements, reducing delays before they happen.</p>
                    </div>
                    {/* Abstract viz */}
                    <div style={{ width: '30%', height: '100%', background: 'linear-gradient(45deg, transparent, rgba(79,70,229,0.1))', borderRadius: '12px' }}></div>
                  </div>
                </div>

                {/* Feature 2 - Vertical */}
                <div className="bento-item glass glass-hover tilt-card icon-bounce scroll-reveal delay-200" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{
                      width: '50px', height: '50px', borderRadius: '12px',
                      background: 'rgba(6, 182, 212, 0.2)', color: '#00f0ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '1.5rem'
                    }}>
                      <IconTraffic />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Digital Twin</h3>
                    <p>Simulates and evaluates signal modifications virtually before real-world implementation.</p>
                  </div>
                  <div style={{ marginTop: '2rem', height: '4px', width: '100%', background: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '60%', background: '#00f0ff' }}></div>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="bento-item glass glass-hover tilt-card icon-bounce scroll-reveal delay-100" style={{ padding: '2.5rem' }}>
                  <div style={{
                    width: '50px', height: '50px', borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.2)', color: '#10b981',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1.5rem'
                  }}>
                    <IconLeaf />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Eco Friendly</h3>
                  <p>Reduces vehicle emissions by minimizing idle durations and unnecessary stops.</p>
                </div>

                {/* Feature 4 - Large */}
                <div className="bento-item glass glass-hover tilt-card icon-bounce scroll-reveal delay-200" style={{ gridColumn: 'span 2', padding: '3rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{
                      width: '50px', height: '50px', borderRadius: '12px',
                      background: 'rgba(6, 182, 212, 0.2)', color: '#00f0ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '1.5rem'
                    }}>
                      <IconWifi />
                    </div>
                    <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>C-ITS / V2X Communication</h3>
                    <p style={{ maxWidth: '500px' }}>Enables smart vehicles to communicate with traffic lights for seamless, uninterrupted flow.</p>
                  </div>
                  <div style={{
                    position: 'absolute', bottom: '-20%', right: '-10%',
                    fontSize: '15rem', opacity: 0.05, fontWeight: 900,
                    zIndex: 1
                  }}>
                    V2X
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action / Quote */}
          <section id="impact" className="section-padding scroll-reveal">
            <div className="container" style={{ textAlign: 'center' }}>
              <div className="glass" style={{ padding: '5rem 2rem', borderRadius: '32px', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.2), transparent 70%)',
                  zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '4rem', color: 'rgba(255,255,255,0.1)', fontFamily: 'serif', lineHeight: 1 }}>"</div>
                  <p style={{ fontSize: '1.5rem', fontStyle: 'italic', maxWidth: '800px', margin: '0 auto 2rem', lineHeight: 1.8 }}>
                    This system aims to boost the travel experiences of drivers, public transportation riders, cyclists, and pedestrians alongside emergency vehicles.
                  </p>
                  <div style={{ fontWeight: 700, color: 'white' }}>Hussain Al Banna</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--neon-blue)' }}>Traffic and Roads Agency, RTA</div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer style={{ borderTop: '1px solid var(--bg-card-border)', padding: '4rem 0', marginTop: '3rem' }}>
            <div className="container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1.5rem' }}>
                  UTC-UX <span className="text-gradient">Fusion</span>
                </div>
                <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <a href="#">Privacy</a>
                  <a href="#">Contact</a>
                  <a href="#">RTA Official Site</a>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  © 2026 Dubai Roads and Transport Authority
                </div>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}

export default App
