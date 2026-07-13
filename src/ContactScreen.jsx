/**
 * ContactScreen Component ("Options" and "Share to LAN")
 */

import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';

export default function ContactScreen({
  navigateTo,
  musicVolume,
  setMusicVolume,
  buttonVolume,
  setButtonVolume,
  textScale,
  setTextScale,
  skyboxSpeed,
  setSkyboxSpeed,
  reducedMotion,
  setReducedMotion,
  portfolioMode,
  setPortfolioMode
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [fov, setFov] = useState(() => Math.round(textScale * 70));
  const [difficulty, setDifficulty] = useState('Peaceful');
  const [status, setStatus] = useState('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errors, setErrors] = useState({ name: '', email: '', message: '' });
  const [showLanForm, setShowLanForm] = useState(false);
  const [optionsMenu, setOptionsMenu] = useState('main');

  const lastSubmitTimeRef = useRef(0);

  useEffect(() => {
    document.documentElement.style.setProperty('--fov', fov);
  }, [fov]);

  const handleFovChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setFov(val);
  };

  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setMusicVolume(val);
  };

  const handleSkyboxSpeedChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setSkyboxSpeed(val);
  };

  const cycleDifficulty = () => {
    const diffs = ['Peaceful', 'Easy', 'Normal', 'Hard'];
    setDifficulty(diffs[(diffs.indexOf(difficulty) + 1) % diffs.length]);
  };

  const handleDownloadResume = () => {
    const link = document.createElement('a');
    link.href = '/assets/resume.pdf'; 
    link.download = 'Raghav_Singhal_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateEmail = (mail) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrors({ name: '', email: '', message: '' });
    setStatus('idle');
    setFeedbackMsg('');

    let hasError = false;
    const tempErrors = { name: '', email: '', message: '' };

    if (!name.trim()) { tempErrors.name = 'Name is required.'; hasError = true; }
    if (!email.trim()) { tempErrors.email = 'Email is required.'; hasError = true; } 
    else if (!validateEmail(email)) { tempErrors.email = 'Invalid email address.'; hasError = true; }
    if (!message.trim()) { tempErrors.message = 'Message is required.'; hasError = true; }

    if (hasError) {
      setErrors(tempErrors);
      setStatus('error');
      setFeedbackMsg('Connection failed: Some fields contain errors.');
      return;
    }

    if (Date.now() - lastSubmitTimeRef.current < 30000) {
      setStatus('error');
      setFeedbackMsg('Rate limit active: Please wait 30 seconds.');
      return;
    }

    setStatus('submitting');

    if (honeypot) {
      setTimeout(() => {
        setStatus('success');
        setName(''); setEmail(''); setSubject(''); setMessage('');
      }, 1500);
      return;
    }

    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        console.warn('EmailJS environment variables are missing! Simulating success for testing.');
        await new Promise(resolve => setTimeout(resolve, 1000));
        lastSubmitTimeRef.current = Date.now();
        setStatus('success');
        setName(''); setEmail(''); setSubject(''); setMessage('');
        return;
      }

      const templateParams = {
        name, email, subject, message,
        difficulty: portfolioMode === 'recruiter' ? difficulty : undefined,
        fov_setting: portfolioMode === 'recruiter' ? fov : undefined
      };

      const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
      if (response.status === 200) {
        lastSubmitTimeRef.current = Date.now();
        setStatus('success');
        setName(''); setEmail(''); setSubject(''); setMessage('');
      } else {
        throw new Error('EmailJS rejected form submission.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setFeedbackMsg('Failed to connect to LAN. Please check your connection or email directly.');
    }
  };

  const getFovLabel = () => fov === 70 ? 'FOV: Normal' : fov === 110 ? 'FOV: Quake Pro' : `FOV: ${fov}`;
  const getVolumeLabel = () => musicVolume === 0 ? 'Music Volume: OFF' : `Music Volume: ${musicVolume}%`;
  const getSkyboxSpeedLabel = () => skyboxSpeed === 0 ? 'Rotation: OFF' : skyboxSpeed === 100 ? 'Rotation: Normal' : `Rotation: ${skyboxSpeed}%`;

  // ═══════════════════════════════════════════════════════
  // SHARED: "SHARE TO LAN" FORM (Used natively by Recruiter Mode, and as sub-screen in Dev Mode)
  // ═══════════════════════════════════════════════════════
  const renderLanForm = (title, showSettings) => (
    <div className="gui-screen">
      <div className="gui-title" id="share-lan-title">{title}</div>

      {status === 'success' ? (
        <div className="contact-content-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="form-success-toast">
            <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}>
              <rect x="2" y="8" width="2" height="2" fill="#80FF20" />
              <rect x="4" y="10" width="2" height="2" fill="#80FF20" />
              <rect x="6" y="12" width="2" height="2" fill="#80FF20" />
              <rect x="8" y="10" width="2" height="2" fill="#80FF20" />
              <rect x="10" y="8" width="2" height="2" fill="#80FF20" />
              <rect x="12" y="6" width="2" height="2" fill="#80FF20" />
              <rect x="14" y="4" width="2" height="2" fill="#80FF20" />
            </svg>
            <h3 className="toast-header">Connection Established!</h3>
            <p className="toast-message">Message sent to LAN successfully.</p>
            <button className="mc-btn" style={{ width: 'calc(60 * var(--mu))', marginTop: 'calc(4 * var(--mu))' }} onClick={() => setStatus('idle')}>
              <span className="mc-btn-inner">Send Another</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="contact-content-wrapper">
          <p className="bio-text" style={{ textAlign: 'center', color: '#ffaa00', marginBottom: 'calc(4 * var(--mu))', textShadow: 'calc(1 * var(--mu)) calc(1 * var(--mu)) 0 #3f3f00' }}>
            Set up settings for your connection to RaghavNotFound.
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, height: 0, width: 0, overflow: 'hidden' }}>
              <input id="contact-honeypot" type="text" tabIndex="-1" autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'calc(4 * var(--mu))' }}>
              <div className="mc-input-group">
                <label htmlFor="contact-name" className="mc-label">Name</label>
                <input id="contact-name" type="text" className="mc-input" value={name} onChange={(e) => setName(e.target.value)} disabled={status === 'submitting'} required />
                {errors.name && <span className="validation-error" role="alert">{errors.name}</span>}
              </div>
              <div className="mc-input-group">
                <label htmlFor="contact-email" className="mc-label">Email</label>
                <input id="contact-email" type="email" className="mc-input" value={email} onChange={(e) => setEmail(e.target.value)} disabled={status === 'submitting'} required />
                {errors.email && <span className="validation-error" role="alert">{errors.email}</span>}
              </div>
            </div>

            <div className="mc-input-group" style={{ marginTop: 'calc(3 * var(--mu))' }}>
              <label htmlFor="contact-subject" className="mc-label">Subject</label>
              <input id="contact-subject" type="text" className="mc-input" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={status === 'submitting'} />
            </div>

            <div className="mc-input-group" style={{ marginTop: 'calc(3 * var(--mu))' }}>
              <label htmlFor="contact-message" className="mc-label">Message</label>
              <textarea id="contact-message" className="mc-textarea" value={message} onChange={(e) => setMessage(e.target.value)} disabled={status === 'submitting'} required />
              {errors.message && <span className="validation-error" role="alert">{errors.message}</span>}
            </div>

            {showSettings && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'calc(4 * var(--mu))', marginTop: 'calc(4 * var(--mu))' }}>
                  <div className="mc-slider-container">
                    <div className="mc-slider-wrapper">
                      <span className="mc-slider-label">{getVolumeLabel()}</span>
                      <div className="mc-slider-custom-track">
                        <div className="mc-slider-custom-thumb" style={{ left: `${musicVolume}%` }} />
                      </div>
                      <input type="range" min="0" max="100" className="mc-slider-native" value={musicVolume} onChange={handleVolumeChange} disabled={status === 'submitting'} />
                    </div>
                  </div>
                  <button type="button" className="mc-btn" onClick={cycleDifficulty} disabled={status === 'submitting'}>
                    <span className="mc-btn-inner">Difficulty: {difficulty}</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'calc(4 * var(--mu))', marginTop: 'calc(4 * var(--mu))' }}>
                  <div className="mc-slider-container">
                    <div className="mc-slider-wrapper">
                      <span className="mc-slider-label">{getFovLabel()}</span>
                      <div className="mc-slider-custom-track">
                        <div className="mc-slider-custom-thumb" style={{ left: `${((fov - 30) / 80) * 100}%` }} />
                      </div>
                      <input type="range" min="30" max="110" className="mc-slider-native" value={fov} onChange={handleFovChange} disabled={status === 'submitting'} />
                    </div>
                  </div>
                  <div className="mc-slider-container">
                    <div className="mc-slider-wrapper">
                      <span className="mc-slider-label">{getSkyboxSpeedLabel()}</span>
                      <div className="mc-slider-custom-track">
                        <div className="mc-slider-custom-thumb" style={{ left: `${skyboxSpeed / 2}%` }} />
                      </div>
                      <input type="range" min="0" max="200" className="mc-slider-native" value={skyboxSpeed} onChange={handleSkyboxSpeedChange} disabled={status === 'submitting'} />
                    </div>
                  </div>
                </div>

                <div className="resource-pack-card" style={{ marginTop: 'calc(4 * var(--mu))' }}>
                  <div className="pack-icon">
                    <svg width="32" height="32" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}>
                      <rect x="3" y="1" width="10" height="14" fill="#5c5c5c" />
                      <rect x="4" y="2" width="8" height="12" fill="#E2E2E2" />
                      <rect x="10" y="2" width="2" height="2" fill="#a0a0a0" />
                      <rect x="5" y="5" width="6" height="1" fill="#c24444" />
                      <rect x="5" y="7" width="5" height="1" fill="#707070" />
                      <rect x="5" y="9" width="6" height="1" fill="#707070" />
                      <rect x="5" y="11" width="4" height="1" fill="#707070" />
                    </svg>
                  </div>
                  <div className="pack-details">
                    <div className="pack-name">Raghav_Singhal_Resume.zip</div>
                    <div className="pack-desc">Installs Raghav's full stack developer experience. Recommended resource pack.</div>
                  </div>
                  <button type="button" className="mc-btn pack-action-btn" onClick={handleDownloadResume} disabled={status === 'submitting'}>
                    <span className="mc-btn-inner">Install</span>
                  </button>
                </div>
              </>
            )}

            {feedbackMsg && <p className="form-feedback-error" role="alert" style={{ marginTop: 'calc(2 * var(--mu))' }}>{feedbackMsg}</p>}
            
            <div className="fallback-mailto-container">
              <span className="mc-label" style={{ fontSize: 'calc(5.2 * var(--font-mu))' }}>Or connect directly: </span>{' '}
              <a href={`mailto:raghavsinghal638@gmail.com?subject=LAN%20Connection%20Request&body=Hi%20Raghav...`} className="fallback-mailto-link">
                raghavsinghal638@gmail.com
              </a>
            </div>
          </form>

          <div style={{ marginTop: 'calc(4 * var(--mu))', borderTop: 'calc(1 * var(--mu)) dashed #3a3a3a', paddingTop: 'calc(4 * var(--mu))', width: '100%' }}>
            <span className="mc-label" style={{ display: 'block', marginBottom: 'calc(2 * var(--mu))' }}>Social Servers:</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'calc(4 * var(--mu))' }}>
              <a href="https://github.com/RaghavNotFound" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div className="server-item" style={{ margin: 0 }}>
                  <div className="server-icon" style={{ backgroundColor: '#2b3137', color: '#fff', fontSize: 'calc(7 * var(--font-mu))' }}>GH</div>
                  <div className="server-details">
                    <div className="server-name">GitHub Server</div>
                    <div className="server-desc">Open Source projects repository</div>
                  </div>
                  <div className="server-status" style={{ fontSize: 'calc(5 * var(--font-mu))' }}>online</div>
                </div>
              </a>
              <a href="https://linkedin.com/in/raghav-singhal" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div className="server-item" style={{ margin: 0 }}>
                  <div className="server-icon" style={{ backgroundColor: '#0077b5', color: '#fff', fontSize: 'calc(7 * var(--font-mu))' }}>IN</div>
                  <div className="server-details">
                    <div className="server-name">LinkedIn Network</div>
                    <div className="server-desc">Professional developer LAN</div>
                  </div>
                  <div className="server-status" style={{ fontSize: 'calc(5 * var(--font-mu))' }}>online</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {status !== 'success' && (
        <div className="gui-row">
          <button type="button" className="mc-btn" disabled={status === 'submitting'} onClick={handleSubmit}>
            <span className="mc-btn-inner">
              {status === 'submitting' && <span className={reducedMotion ? "" : "mc-spinner"}>{reducedMotion ? "[Connecting...] " : ""}</span>}
              {status === 'submitting' && !reducedMotion ? 'Connecting...' : 'Connect'}
            </span>
          </button>
          <button type="button" className="mc-btn" onClick={() => (portfolioMode === 'developer' ? setShowLanForm(false) : navigateTo('menu'))} disabled={status === 'submitting'}>
            <span className="mc-btn-inner">Cancel</span>
          </button>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════
  // NEW DEVELOPER MODE OPTIONS GRID
  // ═══════════════════════════════════════════════════════
  const renderOptionsGrid = () => {
    if (optionsMenu === 'music') {
      return (
        <div className="gui-screen">
          <div className="gui-title" style={{ marginBottom: 'calc(4 * var(--mu))' }}>Music & Sound Options</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(4 * var(--mu))', width: '100%', maxWidth: 'calc(304 * var(--mu))', margin: '0 auto' }}>
            
            <div style={{ display: 'flex', gap: 'calc(4 * var(--mu))', marginBottom: 'calc(4 * var(--mu))' }}>
              <div className="mc-slider-container" style={{ flex: 1, margin: 0 }}>
                <div className="mc-slider-wrapper">
                  <span className="mc-slider-label">{musicVolume === 0 ? 'Music: OFF' : `Music: ${musicVolume}%`}</span>
                  <div className="mc-slider-custom-track">
                    <div className="mc-slider-custom-thumb" style={{ left: `${musicVolume}%` }} />
                  </div>
                  <input type="range" min="0" max="100" className="mc-slider-native" value={musicVolume} onChange={(e) => setMusicVolume(parseInt(e.target.value))} />
                </div>
              </div>
              <div className="mc-slider-container" style={{ flex: 1, margin: 0 }}>
                <div className="mc-slider-wrapper">
                  <span className="mc-slider-label">{buttonVolume === 0 ? 'UI: OFF' : `UI: ${buttonVolume}%`}</span>
                  <div className="mc-slider-custom-track">
                    <div className="mc-slider-custom-thumb" style={{ left: `${buttonVolume}%` }} />
                  </div>
                  <input type="range" min="0" max="100" className="mc-slider-native" value={buttonVolume} onChange={(e) => setButtonVolume(parseInt(e.target.value))} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'calc(4 * var(--mu))' }}>
              <button type="button" className="mc-btn" style={{ width: 'calc(150 * var(--mu))' }} onClick={() => setOptionsMenu('main')}>
                <span className="mc-btn-inner">Done</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="gui-screen">
        <div className="gui-title" style={{ marginBottom: 'calc(4 * var(--mu))' }}>Options</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(4 * var(--mu))', width: '100%', maxWidth: 'calc(304 * var(--mu))', margin: '0 auto' }}>
          
          {/* Top Row */}
          <div style={{ display: 'flex', gap: 'calc(4 * var(--mu))' }}>
            <div className="mc-slider-container" style={{ flex: 1, margin: 0 }}>
              <div className="mc-slider-wrapper">
                <span className="mc-slider-label">{getFovLabel()}</span>
                <div className="mc-slider-custom-track">
                  <div className="mc-slider-custom-thumb" style={{ left: `${((fov - 30) / 80) * 100}%` }} />
                </div>
                <input type="range" min="30" max="110" className="mc-slider-native" value={fov} onChange={handleFovChange} />
              </div>
            </div>
            <button type="button" className="mc-btn" style={{ flex: 1, margin: 0 }} onClick={() => setShowLanForm(true)}>
              <span className="mc-btn-inner">Connect to LAN...</span>
            </button>
          </div>

          {/* Options Grid */}
          <div style={{ display: 'flex', gap: 'calc(4 * var(--mu))', marginBottom: 'calc(4 * var(--mu))' }}>
            <button type="button" className="mc-btn" style={{ flex: 1, margin: 0 }}>
              <span className="mc-btn-inner">Skin Customization...</span>
            </button>
            <button type="button" className="mc-btn" style={{ flex: 1, margin: 0 }} onClick={() => setOptionsMenu('music')}>
              <span className="mc-btn-inner">Music & Sounds...</span>
            </button>
          </div>

        {/* Dynamic Grid Rows */}
        {[
          [ 
            { label: 'Video Settings...', action: null }, 
            { label: 'Controls...', action: null } 
          ],
          [ 
            { label: 'Language...', action: null }, 
            { label: 'Chat Settings...', action: null } 
          ],
          [ 
            { label: 'Resource Packs...', action: handleDownloadResume }, 
            { label: `Accessibility Settings: ${reducedMotion ? 'Reduced' : 'Normal'}`, action: () => setReducedMotion(!reducedMotion) } 
          ]
        ].map((row, i) => (
          <div key={`opt-row-${i}`} style={{ display: 'flex', gap: 'calc(4 * var(--mu))', marginBottom: 'calc(4 * var(--mu))' }}>
            <button type="button" className="mc-btn" style={{ flex: 1, margin: 0 }} onClick={row[0].action}>
              <span className="mc-btn-inner">{row[0].label}</span>
            </button>
            <button type="button" className="mc-btn" style={{ flex: 1, margin: 0 }} onClick={row[1].action}>
              <span className="mc-btn-inner">{row[1].label}</span>
            </button>
          </div>
        ))}

        {/* Bottom Row (Telemetry / Rotation Speed) */}
        <div style={{ display: 'flex', gap: 'calc(4 * var(--mu))' }}>
          <div className="mc-slider-container" style={{ flex: 1, margin: 0 }}>
            <div className="mc-slider-wrapper">
              <span className="mc-slider-label">{getSkyboxSpeedLabel()}</span>
              <div className="mc-slider-custom-track">
                <div className="mc-slider-custom-thumb" style={{ left: `${skyboxSpeed / 2}%` }} />
              </div>
              <input type="range" min="0" max="200" className="mc-slider-native" value={skyboxSpeed} onChange={handleSkyboxSpeedChange} />
            </div>
          </div>
          <button type="button" className="mc-btn" style={{ flex: 1, margin: 0 }}>
            <span className="mc-btn-inner">Credits & Attribution...</span>
          </button>
        </div>
      </div>

      <div className="gui-row" style={{ marginTop: 'calc(8 * var(--mu))', justifyContent: 'center' }}>
        <button type="button" className="mc-btn" style={{ width: 'calc(200 * var(--mu))' }} onClick={() => navigateTo('menu')}>
          <span className="mc-btn-inner">Done</span>
        </button>
      </div>
    </div>
  );
};

  // ═══════════════════════════════════════════════════════
  // MAIN RENDER LOGIC
  // ═══════════════════════════════════════════════════════
  if (portfolioMode === 'recruiter') {
    // Recruiter Mode now uses the Share to LAN template, but shows all settings inline
    return renderLanForm("Options & Contact", true);
  }

  if (portfolioMode === 'developer') {
    // Developer Mode defaults to Options Grid, but can route into Connect to LAN (without inline settings)
    if (showLanForm) {
      return renderLanForm("Connect to LAN", false);
    }
    return renderOptionsGrid();
  }

  return null;
}
