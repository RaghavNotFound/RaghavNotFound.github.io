import React, { useState } from 'react';

export default function GlobalControls({
  portfolioMode,
  setPortfolioMode,
  reducedMotion,
  setReducedMotion,
  f3Open,
  setF3Open,
  activeSection,
  navigateTo,
  handleQuitGame,
  systemSpecs
}) {

  const handleModeToggle = () => {
    setPortfolioMode(prev => (prev === 'recruiter' ? 'developer' : 'recruiter'));
  };

  const handleMotionToggle = () => {
    setReducedMotion(prev => !prev);
  };

  return (
    <>
      {/* TOP-RIGHT CONTROLS HUD */}
      <div className="global-hud-top-right">
        <button 
          className="mc-hud-btn" 
          onClick={handleModeToggle}
          title="Toggle between recruiter-focused summary and technical deep dive copy"
        >
          Mode: <span className="highlight-gold">{portfolioMode === 'recruiter' ? 'Recruiter' : 'Developer'}</span>
        </button>
        <button 
          className="mc-hud-btn" 
          onClick={handleMotionToggle}
          title="Enable/disable transitions and rotating animations"
        >
          Motion: <span className="highlight-gold">{reducedMotion ? 'Reduced' : 'Normal'}</span>
        </button>
        <button 
          className="mc-hud-btn f3-toggle-hud" 
          onClick={() => setF3Open(prev => !prev)}
          title="Toggle the sitemap / F3 debug menu"
        >
          F3 Sitemap
        </button>
      </div>

      {/* F3 SITEMAP DEBUG OVERLAY */}
      {f3Open && (
        <div className="f3-overlay" role="dialog" aria-modal="true" aria-labelledby="f3-title">
          {/* Debug info text (Dynamic System Specs) */}
          <div className="f3-debug-left">
            <div>Minecraft 1.21.8-portfolio (<span className="highlight-gold">Raghavnotfound</span>)</div>
            <div>&nbsp;</div>
            <div>Client: <span className="highlight-gold">{systemSpecs.browser}</span></div>
            <div>OS: {systemSpecs.os} ({systemSpecs.platform})</div>
            <div>CPU: {systemSpecs.cores} logical threads</div>
            <div>Memory: {systemSpecs.memory}</div>
            <div>DPR: {systemSpecs.dpr}</div>
            <div>Screen: {systemSpecs.screenRes} ({systemSpecs.aspectRatio})</div>
            <div>Color Depth: {systemSpecs.colorDepth}</div>
            <div>Orientation: {systemSpecs.orientation}</div>
            <div>Viewport: {systemSpecs.viewportRes}</div>
            <div>&nbsp;</div>
            <div>IP Address: <span className="highlight-green">{systemSpecs.ip}</span></div>
            <div>ISP: {systemSpecs.isp}</div>
            <div>Location: {systemSpecs.location}</div>
            <div>Coords (Lat/Lon): {systemSpecs.coords}</div>
            <div>Postal Code: {systemSpecs.postal}</div>
            <div>Local Currency: {systemSpecs.currency}</div>
            <div>&nbsp;</div>
            <div>Visit Count: <span className="highlight-gold">{systemSpecs.visitCount}</span></div>
            <div>First Visit: {systemSpecs.firstVisit}</div>
            <div>Last Visit: {systemSpecs.lastVisit}</div>
            <div>Session Time: <span className="highlight-green">{systemSpecs.sessionTime}</span></div>
            <div>Referrer: {systemSpecs.referrer}</div>
          </div>

          <div className="f3-debug-right">
            <div>GPU Vendor: {systemSpecs.gpuVendor}</div>
            <div>GPU Renderer: {systemSpecs.gpuRenderer}</div>
            <div>GL Version: {systemSpecs.glVersion}</div>
            <div>GLSL Version: {systemSpecs.glslVersion}</div>
            <div>Max Texture Size: {systemSpecs.maxTextureSize} px</div>
            <div>&nbsp;</div>
            <div>Connection: {systemSpecs.connection}</div>
            <div>Latency (RTT): {systemSpecs.rtt}</div>
            <div>Network: {systemSpecs.online}</div>
            <div>Storage Quota: {systemSpecs.storage}</div>
            <div>Battery: {systemSpecs.battery}</div>
            <div>&nbsp;</div>
            <div>Page Load: {systemSpecs.pageLoadTime}</div>
            <div>DOM Nodes: {systemSpecs.domNodes}</div>
            <div>JS Heap: {systemSpecs.jsHeapSize}</div>
            <div>&nbsp;</div>
            <div>Touch Support: {systemSpecs.touch}</div>
            <div>Do Not Track: {systemSpecs.dnt}</div>
            <div>Theme: {systemSpecs.colorScheme}</div>
            <div>Language: {systemSpecs.language}</div>
            <div>All Languages: {systemSpecs.allLanguages}</div>
            <div>ServiceWorker: {systemSpecs.serviceWorker}</div>
            <div>WebAssembly: {systemSpecs.webAssembly}</div>
            <div>WebRTC: {systemSpecs.webrtc}</div>
            <div>PDF Viewer: {systemSpecs.pdfViewer}</div>
            <div>Gamepad API: {systemSpecs.gamepad}</div>
            <div>Notifications: {systemSpecs.notifications}</div>
            <div>&nbsp;</div>
            <div>Timezone: {systemSpecs.timezone}</div>
            <div>Local Time: {systemSpecs.localTime}</div>
          </div>

          {/* Central Sitemap Navigation */}
          <div className="f3-sitemap-center">
            <h2 id="f3-title" className="f3-heading">DEBUG SITEMAP & FAST-TRAVEL</h2>
            <nav className="f3-nav">
              <ul>
                <li>
                  <span className="sitemap-slot">Slot 1:</span>
                  <a href="#profile" className="f3-link" onClick={() => { setF3Open(false); navigateTo('profile'); }}>
                    Singleplayer <span className="arrow-text">&rarr;</span> <span className="highlight-green">About / Profile</span>
                  </a>
                </li>
                <li>
                  <span className="sitemap-slot">Slot 2:</span>
                  <a href="#projects" className="f3-link" onClick={() => { setF3Open(false); navigateTo('projects'); }}>
                    Multiplayer <span className="arrow-text">&rarr;</span> <span className="highlight-green">Projects List</span>
                  </a>
                </li>
                <li>
                  <span className="sitemap-slot">Slot 3:</span>
                  <a href="#skills" className="f3-link" onClick={() => { setF3Open(false); navigateTo('skills'); }}>
                    Achievements <span className="arrow-text">&rarr;</span> <span className="highlight-green">Skills Stack</span>
                  </a>
                </li>
                <li>
                  <span className="sitemap-slot">Slot 4:</span>
                  <a href="#contact" className="f3-link" onClick={() => { setF3Open(false); navigateTo('contact'); }}>
                    Options <span className="arrow-text">&rarr;</span> <span className="highlight-green">Contact Options</span>
                  </a>
                </li>
                <li>
                  <span className="sitemap-slot">Slot 5:</span>
                  <a 
                    href="#accessibility" 
                    className="f3-link" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setF3Open(false); 
                      alert("Accessibility options are decorative in this portfolio."); 
                    }}
                  >
                    Accessibility Options <span className="arrow-text">&rarr;</span> <span className="highlight-green">Decorative Info</span>
                  </a>
                </li>
                <li>
                  <span className="sitemap-slot">Slot 6:</span>
                  <a 
                    href="#quit" 
                    className="f3-link highlight-red-hover" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setF3Open(false); 
                      handleQuitGame(); 
                    }}
                  >
                    Quit Game <span className="arrow-text">&rarr;</span> <span className="highlight-red">Trigger Jumpscare</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <button className="mc-btn f3-close-btn" onClick={() => setF3Open(false)}>
            <span className="mc-btn-inner">Close Debug Overlay (ESC)</span>
          </button>
        </div>
      )}
    </>
  );
}
