import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import GlobalControls from './GlobalControls';
import ContactScreen from './ContactScreen';
import MainMenu from './MainMenu';
import MojangLoader from './MojangLoader';
import projectsData from './projects.json';
import skillsData from './skills.json';
import { 
  PLAYLIST, 
  KEEP_MUSIC_NOTIFICATION_ALWAYS_ACTIVE,
  MUSIC_TOAST_WIDTH,
  MUSIC_TOAST_HEIGHT,
  MUSIC_TOAST_BORDER_WIDTH,
  MUSIC_TOAST_BORDER_RADIUS,
  MUSIC_TOAST_X,
  MUSIC_TOAST_Y,
  MUSIC_TOAST_ICON_SIZE,
  MUSIC_TOAST_ICON_MARGIN,
  MUSIC_TOAST_BOUNCE_SPEED,
  MUSIC_TOAST_BOUNCE_DELAY
} from './config';

function getBrowserInfo() {
  const ua = navigator.userAgent;
  let tem;
  let M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if (/trident/i.test(M[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return 'IE ' + (tem[1] || '');
  }
  if (M[1] === 'Chrome') {
    tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
    if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
  }
  M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
  if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
  return M.join(' ');
}

function getOSInfo() {
  const ua = navigator.userAgent;
  if (ua.indexOf("Win") !== -1) return "Windows";
  if (ua.indexOf("Mac") !== -1) return "macOS";
  if (ua.indexOf("X11") !== -1) return "UNIX";
  if (ua.indexOf("Linux") !== -1) return "Linux";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  return "Unknown OS";
}

export default function App() {
  const [activeSection, setActiveSection] = useState('menu'); // menu, profile, projects, contact
  const [isHorror, setIsHorror] = useState(false);
  const [isQuitJumpscare, setIsQuitJumpscare] = useState(false);
  const [selectedBtnId, setSelectedBtnId] = useState(null);
  const [arrowActive, setArrowActive] = useState(false);
  const [keyActive, setKeyActive] = useState(false);
  const [isStalkerMode, setIsStalkerMode] = useState(false);
  const stalkerCanvasRef = useRef(null);
  const [musicVolume, setMusicVolume] = useState(50);
  const [buttonVolume, setButtonVolume] = useState(100);
  const [textScale, setTextScale] = useState(1.0);
  const [skyboxSpeed, setSkyboxSpeed] = useState(50); // Default to 50% speed
  const [currentSongName, setCurrentSongName] = useState('');
  const [showSongNotification, setShowSongNotification] = useState(false);

  // Authentic Minecraft Mojang Red Page Loader states
  const [loaderProgress, setLoaderProgress] = useState(15);
  const [loaderFading, setLoaderFading] = useState(false);
  const [loaderComplete, setLoaderComplete] = useState(false);

  // Progressive loading simulation synced with page and asset readiness
  useEffect(() => {
    let currentPct = 15;
    const interval = setInterval(() => {
      currentPct += Math.random() * 12 + 6;
      if (currentPct >= 88) {
        currentPct = 88;
        clearInterval(interval);
      }
      setLoaderProgress(prev => Math.max(prev, Math.min(88, currentPct)));
    }, 110);

    const finishLoading = () => {
      clearInterval(interval);
      setLoaderProgress(100);
      setTimeout(() => {
        setLoaderFading(true);
        setTimeout(() => {
          setLoaderComplete(true);
        }, 650);
      }, 300);
    };

    // Ensure authentic Mojang splash screen display duration (~1.2s minimum)
    const minTimer = setTimeout(() => {
      if (document.readyState === 'complete') {
        finishLoading();
      } else {
        window.addEventListener('load', finishLoading, { once: true });
      }
    }, 1200);

    return () => {
      clearInterval(interval);
      clearTimeout(minTimer);
      window.removeEventListener('load', finishLoading);
    };
  }, []);

  // Global states for Mode, Reduced Motion, and F3 Overlay (persisted in localStorage)
  const [portfolioMode, setPortfolioMode] = useState(() => {
    return localStorage.getItem('steve-portfolio-mode') || 'recruiter';
  });
  const [reducedMotion, setReducedMotion] = useState(() => {
    const saved = localStorage.getItem('steve-reduced-motion');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Sync skybox speed to CSS variable for the WebGL render loop
  useEffect(() => {
    document.documentElement.style.setProperty('--skybox-speed', skyboxSpeed);
  }, [skyboxSpeed]);

  const [f3Open, setF3Open] = useState(false);
  const [expandedWorld, setExpandedWorld] = useState(null);
  const [playingWorld, setPlayingWorld] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectFilter, setProjectFilter] = useState('All');

  const [systemSpecs, setSystemSpecs] = useState({
    browser: 'Loading...',
    os: 'Loading...',
    platform: 'N/A',
    cores: 'N/A',
    memory: 'N/A',
    screenRes: 'N/A',
    viewportRes: 'N/A',
    aspectRatio: 'N/A',
    colorDepth: 'N/A',
    orientation: 'N/A',
    dpr: 'N/A',
    connection: 'N/A',
    gpuVendor: 'Loading...',
    gpuRenderer: 'Loading...',
    glVersion: 'Loading...',
    glslVersion: 'Loading...',
    maxTextureSize: 'N/A',
    language: 'N/A',
    allLanguages: 'N/A',
    cookies: 'N/A',
    online: 'N/A',
    timezone: 'N/A',
    localTime: 'N/A',
    ip: 'Fetching...',
    location: 'Fetching...',
    isp: 'Fetching...',
    coords: 'Fetching...',
    postal: 'Fetching...',
    currency: 'Fetching...',
    battery: 'N/A',
    storage: 'Querying...',
    touch: 'N/A',
    rtt: 'N/A',
    colorScheme: 'N/A',
    dnt: 'N/A',
    supportedApis: 'N/A',
    // Visit tracking
    visitCount: '1',
    firstVisit: 'Now',
    lastVisit: 'Now',
    sessionTime: '0s',
    // Performance
    pageLoadTime: 'Measuring...',
    domNodes: 'N/A',
    jsHeapSize: 'N/A',
    referrer: 'N/A',
    // Capabilities
    serviceWorker: 'N/A',
    webAssembly: 'N/A',
    notifications: 'N/A',
    pdfViewer: 'N/A',
    webrtc: 'N/A',
    gamepad: 'N/A'
  });

  // Session start timestamp ref (doesn't re-render)
  const sessionStartRef = useRef(Date.now());

  useEffect(() => {
    // ── 0. Visit Tracking (localStorage) ──
    const VISIT_KEY = 'raghav-portfolio-visits';
    const FIRST_VISIT_KEY = 'raghav-portfolio-first-visit';
    const LAST_VISIT_KEY = 'raghav-portfolio-last-visit';
    const TOTAL_TIME_KEY = 'raghav-portfolio-total-time';

    let visitCount = 1;
    let firstVisitStr = new Date().toLocaleDateString();
    try {
      const stored = localStorage.getItem(VISIT_KEY);
      if (stored) {
        visitCount = parseInt(stored, 10) + 1;
      }
      localStorage.setItem(VISIT_KEY, visitCount.toString());

      const storedFirst = localStorage.getItem(FIRST_VISIT_KEY);
      if (storedFirst) {
        firstVisitStr = storedFirst;
      } else {
        localStorage.setItem(FIRST_VISIT_KEY, firstVisitStr);
      }

      localStorage.setItem(LAST_VISIT_KEY, new Date().toLocaleString());
    } catch (e) { /* Private browsing */ }

    const lastVisitStr = localStorage.getItem(LAST_VISIT_KEY) || 'Now';

    // ── 1. Calculate Screen Aspect Ratio ──
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const screenW = window.screen.width || 1;
    const screenH = window.screen.height || 1;
    const divisor = gcd(screenW, screenH);
    const aspect = `${screenW / divisor}:${screenH / divisor}`;

    // ── 2. Query Storage APIs Support ──
    const storageApisList = [
      window.localStorage ? 'LocalStorage' : '',
      window.sessionStorage ? 'SessionStorage' : '',
      window.indexedDB ? 'IndexedDB' : ''
    ].filter(Boolean).join(', ');

    // ── 3. Network and Touch ──
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const connInfo = conn ? `${conn.effectiveType || 'unknown'} (${conn.downlink || '?'} Mbps)` : 'N/A';
    const rttVal = conn ? `${conn.rtt || '?'} ms` : 'N/A';
    const touchVal = navigator.maxTouchPoints > 0 ? `Yes (${navigator.maxTouchPoints} points)` : 'No';
    const schemeVal = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light';
    const dntVal = navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes' ? 'Enabled' : 'Disabled / Unspecified';

    // ── 4. Extract WebGL and GPU parameters ──
    let gpuV = window._gpuVendor || 'Gathering...';
    let gpuR = window._gpuRenderer || 'Gathering...';
    let glVer = 'N/A';
    let glslVer = 'N/A';
    let maxTexSize = 'N/A';

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          gpuV = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          gpuR = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
        glVer = gl.getParameter(gl.VERSION) || 'WebGL 1.0';
        glslVer = gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || 'N/A';
        maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 'N/A';
      }
    } catch (e) {
      gpuV = 'Blocked/Unsupported';
      gpuR = 'Blocked/Unsupported';
    }

    // ── 5. Performance metrics ──
    let pageLoad = 'Measuring...';
    try {
      const perf = performance.getEntriesByType('navigation')[0];
      if (perf) {
        pageLoad = `${Math.round(perf.loadEventEnd - perf.startTime)} ms`;
      }
    } catch (e) {}

    const domNodes = document.querySelectorAll('*').length;

    let heapStr = 'N/A';
    if (performance.memory) {
      const usedMB = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
      const totalMB = (performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(1);
      heapStr = `${usedMB} / ${totalMB} MB`;
    }

    // ── 6. Orientation ──
    const orientStr = screen.orientation ? screen.orientation.type.replace('-primary', '').replace('-secondary', ' (sec)') : 'N/A';

    // ── 7. Capabilities ──
    const swSupport = 'serviceWorker' in navigator ? 'Supported' : 'Not Supported';
    const wasmSupport = typeof WebAssembly === 'object' ? 'Supported' : 'Not Supported';
    const notifPerm = typeof Notification !== 'undefined' ? Notification.permission : 'N/A';
    const pdfSupport = navigator.pdfViewerEnabled !== undefined ? (navigator.pdfViewerEnabled ? 'Yes' : 'No') : 'Unknown';
    const rtcSupport = typeof RTCPeerConnection !== 'undefined' ? 'Supported' : 'Not Supported';
    const gamepadSupport = 'getGamepads' in navigator ? 'Supported' : 'Not Supported';

    // ── 8. Referrer ──
    const refStr = document.referrer || 'Direct / None';

    setSystemSpecs({
      browser: getBrowserInfo(),
      os: getOSInfo(),
      platform: navigator.platform || navigator.userAgentData?.platform || 'Unknown',
      cores: navigator.hardwareConcurrency || 'N/A',
      memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'N/A',
      screenRes: `${window.screen.width}x${window.screen.height}`,
      viewportRes: `${window.innerWidth}x${window.innerHeight}`,
      aspectRatio: aspect,
      colorDepth: `${window.screen.colorDepth || 24}-bit`,
      orientation: orientStr,
      dpr: window.devicePixelRatio || 1,
      connection: connInfo,
      gpuVendor: gpuV,
      gpuRenderer: gpuR,
      glVersion: glVer,
      glslVersion: glslVer,
      maxTextureSize: maxTexSize,
      language: navigator.language || 'en',
      allLanguages: (navigator.languages || []).join(', ') || navigator.language || 'en',
      cookies: navigator.cookieEnabled ? 'Enabled' : 'Disabled',
      online: navigator.onLine ? 'Online' : 'Offline',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'N/A',
      localTime: new Date().toLocaleTimeString(),
      ip: 'Fetching...',
      location: 'Fetching...',
      isp: 'Fetching...',
      coords: 'Fetching...',
      postal: 'Fetching...',
      currency: 'Fetching...',
      battery: 'N/A',
      storage: 'Querying...',
      touch: touchVal,
      rtt: rttVal,
      colorScheme: schemeVal,
      dnt: dntVal,
      supportedApis: storageApisList || 'None',
      visitCount: visitCount.toString(),
      firstVisit: firstVisitStr,
      lastVisit: lastVisitStr,
      sessionTime: '0s',
      pageLoadTime: pageLoad,
      domNodes: domNodes.toString(),
      jsHeapSize: heapStr,
      referrer: refStr,
      serviceWorker: swSupport,
      webAssembly: wasmSupport,
      notifications: notifPerm,
      pdfViewer: pdfSupport,
      webrtc: rtcSupport,
      gamepad: gamepadSupport
    });

    // ── 9. Query GeoIP & Location Details ──
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        setSystemSpecs(prev => ({
          ...prev,
          ip: data.ip || 'N/A',
          location: `${data.city || '?'}, ${data.region || '?'}, ${data.country_name || '?'}`,
          isp: data.org || 'N/A',
          coords: `${data.latitude || '?'}, ${data.longitude || '?'}`,
          postal: data.postal || 'N/A',
          currency: `${data.currency || 'N/A'} (${data.currency_name || '?'})`
        }));
      })
      .catch(() => {
        fetch('https://api.ipify.org?format=json')
          .then(res => res.json())
          .then(data => {
            setSystemSpecs(prev => ({ 
              ...prev, 
              ip: data.ip || 'N/A', 
              location: 'Blocked / Timeout', 
              isp: 'Unknown',
              coords: 'N/A',
              postal: 'N/A',
              currency: 'N/A'
            }));
          })
          .catch(() => {
            setSystemSpecs(prev => ({ 
              ...prev, 
              ip: 'Query Failed', 
              location: 'Query Failed', 
              isp: 'Query Failed',
              coords: 'N/A',
              postal: 'N/A',
              currency: 'N/A'
            }));
          });
      });

    // ── 10. Query Battery Status ──
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        const updateBattery = () => {
          setSystemSpecs(prev => ({
            ...prev,
            battery: `${Math.round(battery.level * 100)}% (${battery.charging ? 'Charging' : 'Discharging'})`
          }));
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }

    // ── 11. Query Storage Estimate ──
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        const quotaGB = (estimate.quota / (1024 * 1024 * 1024)).toFixed(1);
        const usageMB = (estimate.usage / (1024 * 1024)).toFixed(1);
        setSystemSpecs(prev => ({
          ...prev,
          storage: `${usageMB} MB used / ${quotaGB} GB quota`
        }));
      }).catch(() => {});
    }

    // ── 12. Live ticker: session time, local time, viewport, DOM nodes, heap ──
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      const hrs = Math.floor(elapsed / 3600);
      const mins = Math.floor((elapsed % 3600) / 60);
      const secs = elapsed % 60;
      const sessionStr = hrs > 0 ? `${hrs}h ${mins}m ${secs}s` : mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

      // Save cumulative time
      try {
        const prev = parseInt(localStorage.getItem(TOTAL_TIME_KEY) || '0', 10);
        localStorage.setItem(TOTAL_TIME_KEY, (prev + 1).toString());
      } catch (e) {}

      let liveHeap = 'N/A';
      if (performance.memory) {
        liveHeap = `${(performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)} / ${(performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(1)} MB`;
      }

      setSystemSpecs(prev => ({
        ...prev,
        localTime: new Date().toLocaleTimeString(),
        viewportRes: `${window.innerWidth}x${window.innerHeight}`,
        sessionTime: sessionStr,
        domNodes: document.querySelectorAll('*').length.toString(),
        jsHeapSize: liveHeap,
        online: navigator.onLine ? 'Online' : 'Offline'
      }));
    }, 1000);

    // ── 13. Save time on page unload ──
    const handleUnload = () => {
      try {
        const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
        const prev = parseInt(localStorage.getItem(TOTAL_TIME_KEY) || '0', 10);
        localStorage.setItem(TOTAL_TIME_KEY, (prev + elapsed).toString());
      } catch (e) {}
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  const skyboxCanvasRef = useRef(null);
  const steveCanvasRef = useRef(null);
  
  // Refs for sharing mouse coordinate changes between React and Three.js loop
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Handle background music playing and volume controls
  const audioRef = useRef(null);
  const fadeOutIntervalRef = useRef(null);
  const musicVolumeRef = useRef(musicVolume);

  // Sync state to ref for use inside closures like onended
  useEffect(() => {
    musicVolumeRef.current = musicVolume;
  }, [musicVolume]);

  const notificationTimeoutRef = useRef(null);

  const playRandomMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const randomTrack = PLAYLIST[Math.floor(Math.random() * PLAYLIST.length)];
    audioRef.current = new Audio(randomTrack);
    audioRef.current.volume = musicVolumeRef.current / 100;
    
    const songName = randomTrack.replace('/music/', '').replace('.mp3', '');
    setCurrentSongName(songName);

    const triggerNotification = () => {
      setShowSongNotification(true);
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
      if (!KEEP_MUSIC_NOTIFICATION_ALWAYS_ACTIVE) {
        notificationTimeoutRef.current = setTimeout(() => {
          setShowSongNotification(false);
        }, 5000);
      }
    };

    audioRef.current.onended = () => {
      playRandomMusic();
    };

    audioRef.current.play().then(() => {
      triggerNotification();
    }).catch((err) => {
      console.warn("Audio play blocked until user interaction:", err);
      const unlockAudio = () => {
        if (audioRef.current && musicVolumeRef.current > 0) {
          audioRef.current.play().then(triggerNotification).catch(e => console.warn(e));
        }
        window.removeEventListener('click', unlockAudio);
      };
      window.addEventListener('click', unlockAudio);
    });
  }, []); // playlist is constant

  useEffect(() => {
    if (musicVolume > 0) {
      // User turned music ON
      if (fadeOutIntervalRef.current) {
        clearInterval(fadeOutIntervalRef.current);
        fadeOutIntervalRef.current = null;
      }

      if (!audioRef.current || audioRef.current.paused) {
        // If there's no music playing right now, play a random track
        playRandomMusic();
      } else {
        // If music is already playing, just update its volume instantly
        audioRef.current.volume = musicVolume / 100;
      }
    } else if (musicVolume === 0 && audioRef.current && !audioRef.current.paused) {
      // User turned music OFF: Fade out to 0 over 10 seconds
      const initialVolume = audioRef.current.volume;
      const steps = 100; // 100 updates
      const volumeStep = initialVolume / steps;
      let currentStep = 0;

      if (fadeOutIntervalRef.current) {
        clearInterval(fadeOutIntervalRef.current);
      }

      fadeOutIntervalRef.current = setInterval(() => {
        currentStep++;
        if (audioRef.current) {
          const newVol = Math.max(0, initialVolume - (volumeStep * currentStep));
          audioRef.current.volume = newVol;
          
          if (currentStep >= steps || newVol === 0) {
            // Fade out complete (10 secs)
            clearInterval(fadeOutIntervalRef.current);
            fadeOutIntervalRef.current = null;
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null; // Reset player
          }
        } else {
          clearInterval(fadeOutIntervalRef.current);
        }
      }, 100); // 100ms * 100 steps = 10 seconds
    }

    return () => {
      if (fadeOutIntervalRef.current) clearInterval(fadeOutIntervalRef.current);
    };
  }, [musicVolume, playRandomMusic]);

  // Clean up completely on app unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Sync text scale accessibility settings to CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', textScale.toString());
  }, [textScale]);

  // 0. Auto GUI Scaler (Replicates Java Edition GUI Scale Auto)
  useEffect(() => {
    function updateScale() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      let scale = Math.min(Math.floor(w / 320), Math.floor(h / 240));
      scale = Math.max(1, scale);
      document.documentElement.style.setProperty('--gui-scale', scale);
    }
    window.addEventListener('resize', updateScale);
    updateScale();
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Sync mode and reduced-motion states with localStorage & body classes
  useEffect(() => {
    localStorage.setItem('steve-portfolio-mode', portfolioMode);
    if (portfolioMode === 'developer') {
      document.body.classList.add('developer-mode');
      document.body.classList.remove('recruiter-mode');
    } else {
      document.body.classList.add('recruiter-mode');
      document.body.classList.remove('developer-mode');
    }
  }, [portfolioMode]);

  useEffect(() => {
    localStorage.setItem('steve-reduced-motion', reducedMotion.toString());
    if (reducedMotion) {
      document.body.classList.add('reduced-motion-active');
    } else {
      document.body.classList.remove('reduced-motion-active');
    }
  }, [reducedMotion]);

  // Sync activeSection with URL path for standard routing
  useEffect(() => {
    function handlePopState() {
      const path = window.location.pathname;
      if (path === '/singleplayer') setActiveSection('profile');
      else if (path === '/multiplayer') setActiveSection('projects');
      else if (path === '/achievements') setActiveSection('skills');
      else if (path === '/options') setActiveSection('contact');
      else setActiveSection('menu');
    }
    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Run initial check
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (section) => {
    let path = '/';
    if (section === 'profile') path = '/singleplayer';
    else if (section === 'projects') path = '/multiplayer';
    else if (section === 'skills') path = '/achievements';
    else if (section === 'contact') path = '/options';

    // Only push state if the path actually changed
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setActiveSection(section);
  };

  // Global click sound effect
  const clickAudioRef = useRef(null);
  useEffect(() => {
    clickAudioRef.current = new Audio('/Click.ogg');
    
    const handleGlobalClick = (e) => {
      // Check if clicked element or its parent is a button or slider
      const isButton = e.target.closest('.mc-button') || 
                       e.target.closest('button') || 
                       e.target.closest('input[type="range"]');
      if (isButton && clickAudioRef.current) {
        clickAudioRef.current.volume = buttonVolume / 100;
        clickAudioRef.current.currentTime = 0;
        clickAudioRef.current.play().catch(err => console.warn('Audio play blocked:', err));
      }
    };
    document.addEventListener('click', handleGlobalClick, true);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [buttonVolume]);

  // 30-Second Inactivity Stalker Mode
  useEffect(() => {
    let inactivityTimer;
    
    const resetTimer = () => {
      if (isStalkerMode) setIsStalkerMode(false);
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setIsStalkerMode(true);
      }, 30000); // 30 seconds
    };

    // Attach listeners
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    // Initial start
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [isStalkerMode]);

  // Esc key navigation back to menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeSection !== 'menu') {
          navigateTo('menu');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection]);

  // F3 Monospace Sitemap key listeners & Escape listener
  useEffect(() => {
    const handleKeyDownGlobal = (e) => {
      if (e.key === 'F3') {
        setF3Open(prev => !prev);
        e.preventDefault();
      } else if (e.key === 'Escape' && f3Open) {
        setF3Open(false);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDownGlobal);
    return () => window.removeEventListener('keydown', handleKeyDownGlobal);
  }, [f3Open]);

  // Mobile fast-travel default trigger
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setF3Open(true);
    }
  }, []);

  // 1. WebGL Skybox Three.js Instance
  useEffect(() => {
    const container = skyboxCanvasRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.id = 'skyboxCanvas';
    container.appendChild(renderer.domElement);

    // Load the 6 Panorama textures
    const textureLoader = new THREE.TextureLoader();
    const faces = [
      { url: '/assets/skybox/right.png' },
      { url: '/assets/skybox/left.png' },
      { url: '/assets/skybox/top.png' },
      { url: '/assets/skybox/bottom.png' },
      { url: '/assets/skybox/front.png' },
      { url: '/assets/skybox/back.png' }
    ];

    const materials = faces.map(face => {
      const texture = textureLoader.load(face.url);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      return new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,
        depthWrite: false
      });
    });

    const skyboxGeo = new THREE.BoxGeometry(10, 10, 10);
    const skybox = new THREE.Mesh(skyboxGeo, materials);
    scene.add(skybox);
    skybox.rotation.x = -8.5 * Math.PI / 180; // Official tilt

    const rotSpeed = (2 * Math.PI) / (120 * 60); // 120s rotation (base speed = 100%)
    let frameId;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      const hasReducedMotion = document.body.classList.contains('reduced-motion-active');
      if (!hasReducedMotion) {
        // Read dynamic skybox speed multiplier (0-100)
        const speedVal = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--skybox-speed'));
        const multiplier = isNaN(speedVal) ? 0.5 : speedVal / 100;
        skybox.rotation.y += rotSpeed * multiplier;
      }

      // Read dynamic FOV
      const fovVal = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fov'));
      const targetFov = isNaN(fovVal) ? 70 : fovVal;
      if (camera.fov !== targetFov) {
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
      }
      
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      skyboxGeo.dispose();
      materials.forEach(mat => {
        if (mat.map) mat.map.dispose();
        mat.dispose();
      });
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 2. 3D Steve Character Three.js Instance (Tied to horror status state)
  useEffect(() => {
    const container = steveCanvasRef.current;
    if (!container) return;

    const parent = container.parentElement;
    const scene = new THREE.Scene();
    
    // Arrays to collect resources for unified garbage collection disposal on unmount
    const geometries = [];
    const materials = [];
    const steveMaterials = []; // Specifically for Steve's body part materials to manipulate during horror mode
    const camera = new THREE.PerspectiveCamera(32, parent.clientWidth / parent.clientHeight, 0.1, 100);
    camera.position.set(0, -0.2, 13.3);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(parent.clientWidth, parent.clientHeight);
    renderer.domElement.id = 'steveCanvas';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.45);
    sunLight.position.set(4, 7, 5);
    scene.add(sunLight);

    // Texture
    const textureLoader = new THREE.TextureLoader();
    const skinTexture = textureLoader.load('/assets/steve.png');
    skinTexture.colorSpace = THREE.SRGBColorSpace;
    skinTexture.magFilter = THREE.NearestFilter;
    skinTexture.minFilter = THREE.NearestFilter;

    // UV Mapper Helper
    function applyCubeUVs(geometry, u, v, w, h, d) {
      const uvs = geometry.attributes.uv.array;
      const texW = 64, texH = 64;
      
      function setFaceUVs(faceIdx, x, y, faceW, faceH) {
        const start = faceIdx * 8;
        const eps = 0.05; // tiny inset to prevent seam bleed from adjacent transparent pixels
        const u1 = (x + eps) / texW;
        const v1 = 1 - (y + faceH - eps) / texH;
        const u2 = (x + faceW - eps) / texW;
        const v2 = 1 - (y + eps) / texH;
        
        uvs[start]     = u1; uvs[start + 1] = v2;
        uvs[start + 2] = u2; uvs[start + 3] = v2;
        uvs[start + 4] = u1; uvs[start + 5] = v1;
        uvs[start + 6] = u2; uvs[start + 7] = v1;
      }
      
      setFaceUVs(0, u + d + w, v + d, d, h);
      setFaceUVs(1, u, v + d, d, h);
      setFaceUVs(2, u + d, v, w, d);
      setFaceUVs(3, u + d + w, v, w, d);
      setFaceUVs(4, u + d, v + d, w, h);
      setFaceUVs(5, u + d + w + d, v + d, w, h);
      geometry.attributes.uv.needsUpdate = true;
    }

    function createVoxelLimb(w, h, d, u, v, hasOuter = false, ou = 0, ov = 0) {
      const group = new THREE.Group();
      
      const innerGeo = new THREE.BoxGeometry(w, h, d);
      applyCubeUVs(innerGeo, u, v, Math.round(w * 10), Math.round(h * 10), Math.round(d * 10));
      const innerMat = new THREE.MeshBasicMaterial({ map: skinTexture });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      group.add(innerMesh);

      geometries.push(innerGeo);
      materials.push(innerMat);
      steveMaterials.push(innerMat);

      if (hasOuter) {
        const outerGeo = new THREE.BoxGeometry(w * 1.03, h * 1.03, d * 1.03);
        applyCubeUVs(outerGeo, ou, ov, Math.round(w * 10), Math.round(h * 10), Math.round(d * 10));
        const outerMat = new THREE.MeshBasicMaterial({
          map: skinTexture,
          transparent: true,
          alphaTest: 0.5,
          side: THREE.DoubleSide
        });
        const outerMesh = new THREE.Mesh(outerGeo, outerMat);
        group.add(outerMesh);

        geometries.push(outerGeo);
        materials.push(outerMat);
        steveMaterials.push(outerMat);
      }
      return { group };
    }

    // Rigging
    const steveGroup = new THREE.Group();
    scene.add(steveGroup);
    steveGroup.rotation.y = -22 * Math.PI / 180;
    steveGroup.position.y = -0.3;

    // Apply custom scale from CSS layout variables
    const style = getComputedStyle(document.documentElement);
    const steveScale = parseFloat(style.getPropertyValue('--steve-scale')) || 1.0;
    steveGroup.scale.setScalar(steveScale);

    const torso = createVoxelLimb(0.8, 1.2, 0.4, 16, 16, true, 16, 32);
    steveGroup.add(torso.group);

    const headJoint = new THREE.Group();
    headJoint.position.set(0, 0.6, 0);
    steveGroup.add(headJoint);
    const head = createVoxelLimb(0.8, 0.8, 0.8, 0, 0, false, 32, 0);
    head.group.position.set(0, 0.4, 0);
    headJoint.add(head.group);

    const rightArmJoint = new THREE.Group();
    rightArmJoint.position.set(-0.6, 0.5, 0);
    steveGroup.add(rightArmJoint);
    const rightArm = createVoxelLimb(0.4, 1.2, 0.4, 40, 16, true, 40, 32);
    rightArm.group.position.set(0, -0.5, 0);
    rightArmJoint.add(rightArm.group);

    const leftArmJoint = new THREE.Group();
    leftArmJoint.position.set(0.6, 0.5, 0);
    steveGroup.add(leftArmJoint);
    const leftArm = createVoxelLimb(0.4, 1.2, 0.4, 32, 48, true, 48, 48);
    leftArm.group.position.set(0, -0.5, 0);
    leftArmJoint.add(leftArm.group);

    const rightLegJoint = new THREE.Group();
    rightLegJoint.position.set(-0.206, -0.6, 0);
    steveGroup.add(rightLegJoint);
    const rightLeg = createVoxelLimb(0.4, 1.2, 0.4, 0, 16, true, 0, 32);
    rightLeg.group.position.set(0, -0.6, 0);
    rightLegJoint.add(rightLeg.group);

    const leftLegJoint = new THREE.Group();
    leftLegJoint.position.set(0.206, -0.6, 0);
    steveGroup.add(leftLegJoint);
    const leftLeg = createVoxelLimb(0.4, 1.2, 0.4, 16, 48, true, 0, 48);
    leftLeg.group.position.set(0, -0.6, 0);
    leftLegJoint.add(leftLeg.group);

    // 3D Gun (nested inside Right Arm)
    const gunGroup = new THREE.Group();
    gunGroup.position.set(0, -0.88, 0.08); 
    gunGroup.rotation.x = -Math.PI / 2; // Resting: barrel hangs along arm
    rightArm.group.add(gunGroup);

    // Build 3D gun from pixel data — each visible pixel becomes a colored voxel cube
    const gunImg = new Image();
    gunImg.src = '/assets/gun.png';
    gunImg.onload = () => {
      const RES = 32;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = RES;
      tempCanvas.height = RES;
      const ctx = tempCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(gunImg, 0, 0, RES, RES);
      const imgData = ctx.getImageData(0, 0, RES, RES).data;

      // Find bounding box of non-magenta pixels
      let minX = RES, maxX = 0, minY = RES, maxY = 0;
      let hasPixels = false;
      for (let y = 0; y < RES; y++) {
        for (let x = 0; x < RES; x++) {
          const idx = (y * RES + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          const a = imgData[idx + 3];

          // Check if pixel is close to magenta (Chroma key)
          const isChromaPink = r > g + 25 && b > g + 25;
          if (a > 128 && !isChromaPink) {
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            hasPixels = true;
          }
        }
      }
      if (!hasPixels) return;

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const voxelSize = 0.75 / Math.max(maxX - minX + 1, maxY - minY + 1);
      const depth = voxelSize * 3; // Item thickness

      // Cache materials by color to reuse
      const matCache = {};
      const getVoxelMat = (r, g, b) => {
        const hex = (r << 16) | (g << 8) | b;
        if (!matCache[hex]) {
          const mat = new THREE.MeshBasicMaterial({ color: hex });
          matCache[hex] = mat;
          materials.push(mat);
        }
        return matCache[hex];
      };

      // Shared geometry for all cubes
      const sharedGeo = new THREE.BoxGeometry(depth, voxelSize, voxelSize);
      geometries.push(sharedGeo);

      for (let y = 0; y < RES; y++) {
        for (let x = 0; x < RES; x++) {
          const idx = (y * RES + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          const a = imgData[idx + 3];

          const isChromaPink = r > g + 25 && b > g + 25;
          if (a > 128 && !isChromaPink) {
            const voxelMesh = new THREE.Mesh(sharedGeo, getVoxelMat(r, g, b));

            // Y = gun height (image Y), Z = barrel direction (image X)
            // barrel tip = left of image (small x) = +Z
            const localZ = (centerX - x) * voxelSize;
            const localY = (centerY - y) * voxelSize;

            voxelMesh.position.set(0, localY, localZ);
            gunGroup.add(voxelMesh);
          }
        }
      }
    };

    gunGroup.visible = false;

    // Tracking variables
    let frameId;
    let time = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      const hasReducedMotion = document.body.classList.contains('reduced-motion-active');
      if (!hasReducedMotion) {
        time += 0.035;
      }

      // Access isHorror dynamically from reactive body class to bypass react closure stale state
      const horrorModeActive = document.body.classList.contains('horror-active');

      if (horrorModeActive) {
        steveMaterials.forEach(mat => mat.color.setHex(0xff7777)); // Creepy red tint
      } else {
        steveMaterials.forEach(mat => mat.color.setHex(0xffffff)); // Normal
      }

      // Dynamically sync Steve's size scale: swells to 1.5 when hovering over Quit Game (horrorModeActive), otherwise baseScale
      const baseScale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--steve-scale')) || 0.7;
      const targetScale = horrorModeActive ? 1.5 : baseScale;
      const lerpFactor = hasReducedMotion ? 1.0 : 0.12;
      const nextScale = steveGroup.scale.x + (targetScale - steveGroup.scale.x) * lerpFactor;
      steveGroup.scale.setScalar(nextScale);

      // Dynamically position the name tag relative to Steve's head scale and bobbing
      const nametag = parent.querySelector('.steve-nametag');
      if (nametag) {
        // Base bobbing offset is Math.sin(time * 2) * 0.015 * scale in 3D, which is about Math.sin(time * 2) * 2 * scale in pixels
        const bobbingOffset = Math.sin(time * 2) * 2.3 * nextScale;
        const nametagTop = 132 - 60 * nextScale - bobbingOffset;
        nametag.style.top = `calc(${nametagTop} * var(--mu))`;
      }



      if (horrorModeActive) {
        // Snap head directly forward
        headJoint.rotation.y += (22 * Math.PI / 180 - headJoint.rotation.y) * 0.2;
        headJoint.rotation.x += (0 - headJoint.rotation.x) * 0.2;

        // Raise arm forward
        rightArmJoint.rotation.x += (-Math.PI / 2 - rightArmJoint.rotation.x) * 0.2;
        rightArmJoint.rotation.y += (15 * Math.PI / 180 - rightArmJoint.rotation.y) * 0.2;
        rightArmJoint.rotation.z += (-0.08 - rightArmJoint.rotation.z) * 0.2;

        gunGroup.visible = true;
        gunGroup.rotation.x += (Math.PI / 2 - gunGroup.rotation.x) * 0.2;

        leftArmJoint.rotation.x += (0.25 - leftArmJoint.rotation.x) * 0.15;
        leftArmJoint.rotation.z += (0.08 - leftArmJoint.rotation.z) * 0.15;
        rightLegJoint.rotation.x += (0 - rightLegJoint.rotation.x) * 0.15;
        leftLegJoint.rotation.x += (0 - leftLegJoint.rotation.x) * 0.15;
        steveGroup.position.y += (-0.3 - steveGroup.position.y) * 0.15;
      } else {
        // Normal look tracking & walk sways
        let mouseX = mouseRef.current.x;
        let mouseY = mouseRef.current.y;

        // Sync Steve's head focus to the keyboard-selected button if one exists
        const selectedBtn = parent.querySelector('.selected-btn');
        if (selectedBtn) {
          const btnText = selectedBtn.textContent.trim().toLowerCase();
          if (btnText.includes('singleplayer')) {
            mouseX = -1.2; mouseY = 0.55;
          } else if (btnText.includes('multiplayer')) {
            mouseX = -1.2; mouseY = 0.15;
          } else if (btnText.includes('realms')) {
            mouseX = -1.2; mouseY = -0.25;
          } else if (selectedBtn.classList.contains('lang')) {
            mouseX = -1.3; mouseY = -0.65;
          } else if (btnText.includes('options')) {
            mouseX = -0.8; mouseY = -0.65;
          } else if (selectedBtn.classList.contains('btn-quit')) {
            mouseX = 0.0; mouseY = 0.0;
          } else { // Accessibility icon button
            mouseX = 0.2; mouseY = -0.65;
          }
        }

        const targetHeadY = mouseX * 0.7;
        const targetHeadX = -mouseY * 0.45;

        headJoint.rotation.y += (targetHeadY - headJoint.rotation.y) * 0.12;
        headJoint.rotation.x += (targetHeadX - headJoint.rotation.x) * 0.12;

        rightArmJoint.rotation.x = Math.sin(time) * 0.18;
        rightArmJoint.rotation.y = 0;
        rightArmJoint.rotation.z = -Math.cos(time * 0.5) * 0.02 - 0.06;

        leftArmJoint.rotation.x = -Math.sin(time) * 0.18;
        leftArmJoint.rotation.z = Math.cos(time * 0.5) * 0.02 + 0.06;

        rightLegJoint.rotation.x = -Math.sin(time) * 0.15;
        leftLegJoint.rotation.x = Math.sin(time) * 0.15;

        steveGroup.position.y = -0.3 + Math.sin(time * 2) * 0.015;

        gunGroup.visible = false;
        gunGroup.rotation.x = -Math.PI / 2;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleMouseMove = (e) => {
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      
      // Prevent wild mouse vector tracking when display: none sets rect coordinates to 0,0
      if (rect.width === 0 && rect.height === 0) return;

      // Steve's head center is roughly centered horizontally and 20% down from the container top
      const steveCenterX = rect.left + rect.width / 2;
      const steveCenterY = rect.top + rect.height * 0.2;

      // Calculate pixel distance from Steve's head to mouse cursor
      const dx = e.clientX - steveCenterX;
      const dy = e.clientY - steveCenterY;

      // Normalize relative to screen size for consistent tracking speed
      mouseRef.current.x = dx / (window.innerWidth / 2);
      mouseRef.current.y = -dy / (window.innerHeight / 2);
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      camera.aspect = parent.clientWidth / parent.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(parent.clientWidth, parent.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      // Prevent caching bug during hot-reloads by not disposing the loaded texture
      // skinTexture.dispose();

      // Clean up all loaded geometries and materials
      geometries.forEach(geo => geo.dispose());
      materials.forEach(mat => mat.dispose());

      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      // Dispose the WebGL renderer to free GPU resources
      renderer.dispose();
    };
  }, []);

  // 2.5 Shadow Stalker Steve (Triggers on 30s inactivity)
  useEffect(() => {
    if (!isStalkerMode) return;
    const container = stalkerCanvasRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const stalkerGroup = new THREE.Group();

    // Reusable voxel builder for the shadow
    const createShadowLimb = (w, h, d) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshBasicMaterial({ color: 0x050505 }); // Near black shadow
      const mesh = new THREE.Mesh(geo, mat);
      const group = new THREE.Group();
      group.add(mesh);
      return { group, geo, mat };
    };

    const head = createShadowLimb(2, 2, 2);
    head.group.position.y = 3;
    stalkerGroup.add(head.group);

    const body = createShadowLimb(2, 3, 1);
    body.group.position.y = 0.5;
    stalkerGroup.add(body.group);

    const rArm = createShadowLimb(1, 3, 1);
    rArm.group.position.set(-1.5, 0.5, 0);
    stalkerGroup.add(rArm.group);

    const lArm = createShadowLimb(1, 3, 1);
    lArm.group.position.set(1.5, 0.5, 0);
    stalkerGroup.add(lArm.group);

    scene.add(stalkerGroup);

    let frameId;
    let time = 0;
    const mouse = { x: 0, y: 0 };

    const handleMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.05;

      // Float around randomly but smoothly using sine waves
      stalkerGroup.position.x = Math.sin(time * 0.5) * 5 + Math.cos(time * 0.3) * 2;
      stalkerGroup.position.y = Math.cos(time * 0.4) * 3 + Math.sin(time * 0.2) * 2;
      
      // Make the entire body face the cursor
      const targetX = mouse.x * 10;
      const targetY = mouse.y * 10;
      stalkerGroup.lookAt(targetX, targetY, 5); // Look slightly forward

      // Animate limbs to look like a creepy hover
      rArm.group.rotation.x = Math.sin(time) * 0.2 - 0.5;
      lArm.group.rotation.x = Math.cos(time) * 0.2 - 0.5;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      head.geo.dispose(); head.mat.dispose();
      body.geo.dispose(); body.mat.dispose();
      rArm.geo.dispose(); rArm.mat.dispose();
      lArm.geo.dispose(); lArm.mat.dispose();
      
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isStalkerMode]);

  // 3. Document body class synchronizer (React state -> body DOM class)
  useEffect(() => {
    if (isHorror || selectedBtnId === 'quit') {
      document.body.classList.add('horror-active');
    } else {
      document.body.classList.remove('horror-active');
    }
  }, [isHorror, selectedBtnId]);

  // 4. Keyboard Navigation Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeSection !== 'menu') return;

      const key = e.key;

      // Handle Key Visualizer Lighting Up
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        setArrowActive(true);
        setTimeout(() => setArrowActive(false), 120);
      } else {
        setKeyActive(true);
        setTimeout(() => setKeyActive(false), 120);
      }

      // Default Navigation rules if no key is currently selected
      if (selectedBtnId === null) {
        if (key === 'ArrowUp') {
          setSelectedBtnId('accessibility');
          e.preventDefault();
        } else if (key === 'ArrowDown') {
          setSelectedBtnId('singleplayer');
          e.preventDefault();
        } else if (key === 'ArrowRight') {
          setSelectedBtnId('lang');
          e.preventDefault();
        } else if (key === 'ArrowLeft') {
          setSelectedBtnId('quit');
          e.preventDefault();
        }
        return;
      }

      // Normal directional navigation (no looping/wrapping at boundaries)
      let nextId = selectedBtnId;
      if (key === 'ArrowUp') {
        if (selectedBtnId === 'multiplayer') nextId = 'singleplayer';
        else if (selectedBtnId === 'realms') nextId = 'multiplayer';
        else if (['lang', 'options', 'quit', 'accessibility'].includes(selectedBtnId)) {
          nextId = 'realms';
        }
        e.preventDefault();
      } else if (key === 'ArrowDown') {
        if (selectedBtnId === 'singleplayer') nextId = 'multiplayer';
        else if (selectedBtnId === 'multiplayer') nextId = 'realms';
        else if (selectedBtnId === 'realms') nextId = 'options';
        e.preventDefault();
      } else if (key === 'ArrowLeft') {
        if (selectedBtnId === 'options') nextId = 'lang';
        else if (selectedBtnId === 'quit') nextId = 'options';
        else if (selectedBtnId === 'accessibility') nextId = 'quit';
        e.preventDefault();
      } else if (key === 'ArrowRight') {
        if (selectedBtnId === 'lang') nextId = 'options';
        else if (selectedBtnId === 'options') nextId = 'quit';
        else if (selectedBtnId === 'quit') nextId = 'accessibility';
        e.preventDefault();
      } else if (key === 'Enter' || key === ' ') {
        const btn = document.querySelector(`.menu-buttons .selected-btn`);
        if (btn) {
          btn.click();
        }
        e.preventDefault();
      } else if (key === 'Escape') {
        setSelectedBtnId(null);
      }

      if (nextId !== selectedBtnId) {
        setSelectedBtnId(nextId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBtnId, activeSection]);

  // 5. Clear Keyboard Selection on Mouse Movement (with movement threshold to prevent jitter reset)
  useEffect(() => {
    const handleMouseMove = (e) => {
      const deltaX = Math.abs(e.clientX - lastMousePosRef.current.x);
      const deltaY = Math.abs(e.clientY - lastMousePosRef.current.y);

      if (deltaX > 3 || deltaY > 3) {
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        if (selectedBtnId !== null) {
          setSelectedBtnId(null);
        }
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [selectedBtnId]);

  // Handle Quit Jumpscare Action
  const handleQuitGame = () => {
    setIsQuitJumpscare(true);
    // Play jumpscare sound or simple custom effect
    setTimeout(() => {
      setIsQuitJumpscare(false);
      setIsHorror(false);
    }, 4000);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      
      {/* Authentic Minecraft Mojang Red Page Loader */}
      {!loaderComplete && (
        <MojangLoader 
          progress={loaderProgress}
          isFading={loaderFading}
          isComplete={loaderComplete}
        />
      )}
      
      {/* Dynamic Fullscreen Skybox canvas */}
      <div id="skyboxCanvasContainer" ref={skyboxCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}></div>
      
      {/* Screen Vignette Overlay */}
      <div className="vignette"></div>
      {/* 3D Steve Character canvas viewport container — always mounted, hidden when not on menu */}
      <div className="steve-container" style={{ display: activeSection === 'menu' ? 'flex' : 'none' }}>
        <div className="steve-nametag">RaghavNotFound</div>
        <div id="steveCanvasContainer" ref={steveCanvasRef} style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}></div>
      </div>


          {/* JUMPSCARE OVERLAY */}
      {isQuitJumpscare && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000',
          color: '#ff0000',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Minecraft', sans-serif",
          animation: 'guiFadeIn 0.1s ease-in'
        }}>
          <h1 style={{ fontSize: 'calc(14 * var(--mu))', textShadow: '0 0 calc(8 * var(--mu)) #7f0000', marginBottom: 'calc(6 * var(--mu))' }}>
            YOU DIED!
          </h1>
          <p style={{ fontSize: 'calc(6 * var(--mu))', color: '#ffaaaa' }}>
            RaghavNotFound shot you point blank.
          </p>
        </div>
      )}

        {/* MAIN INTERFACE OVERLAY */}
      <div className="overlay">
        
        {/* SHADOW STEVE STALKER CANVAS (rendered above all UI) */}
        {isStalkerMode && (
          <div 
            ref={stalkerCanvasRef} 
            style={{ 
              position: 'fixed', 
              top: 0, left: 0, 
              width: '100vw', height: '100vh', 
              zIndex: 9999, 
              pointerEvents: 'none' 
            }} 
          />
        )}

        {/* Temporary Dev Mode Toggle Button */}
        <button 
          className="mc-btn"
          style={{ position: 'absolute', top: 'calc(4 * var(--mu))', right: 'calc(4 * var(--mu))', width: 'auto', padding: '0 calc(4 * var(--mu))', zIndex: 1000, pointerEvents: 'auto' }}
          onClick={() => setPortfolioMode(prev => prev === 'recruiter' ? 'developer' : 'recruiter')}
        >
          <span className="mc-btn-inner">Mode: {portfolioMode === 'recruiter' ? 'Recruiter' : 'Dev'}</span>
        </button>

        {/* Dynamic Section Renderer */}
        {activeSection === 'menu' && (
          <MainMenu 
            navigateTo={navigateTo} 
            musicVolume={musicVolume} 
            handleQuitGame={handleQuitGame} 
            setIsHorror={setIsHorror}
          />
        )}

        {/* SINGLEPLAYER / ABOUT SCREEN */}
        {activeSection === 'profile' && (
          <div className="gui-screen" style={{ justifyContent: 'flex-start', padding: 0 }}>
            {/* Title */}
            <div className="gui-title" style={{ marginTop: 'calc(4 * var(--mu))', marginBottom: 'calc(3 * var(--mu))' }}>
              {portfolioMode === 'recruiter' ? 'About Me' : 'Select World'}
            </div>

            {/* Search bar */}
            <div style={{ margin: '0 auto calc(3 * var(--mu))', width: 'calc(304 * var(--mu))', border: 'calc(1 * var(--mu)) solid #a0a0a0', background: '#000', padding: 'calc(2 * var(--mu))', color: '#fff', textAlign: 'left', height: 'calc(10 * var(--mu))', display: 'flex', alignItems: 'center', fontFamily: "'Minecraft', sans-serif", fontSize: 'calc(5 * var(--font-mu))' }}>
              <span style={{ opacity: 0.5 }}>_</span>
            </div>

            {/* World List — dark scrollable strip */}
            <div className="mc-list-container">
              {[
                { id: 'origins', name: portfolioMode === 'recruiter' ? 'Education' : 'Origins World', filename: portfolioMode === 'recruiter' ? 'UPES University — B.Tech CS, Cybersecurity' : 'Origins World (08/21/21, 10:00 am)', desc: portfolioMode === 'recruiter' ? 'Computer Science · Cybersecurity Specialization' : 'Creative Mode, Version: Aug 2021', iconText: portfolioMode === 'recruiter' ? 'ED' : 'OW', color1: '#749938', color2: '#8b5a36', details: 'Computer Science major at UPES University. Explored core database architectures, hardware interrupts, and low-level compilation structures. Focus area: Cybersecurity and Web Architectures.' },
                { id: 'current', name: portfolioMode === 'recruiter' ? 'Current Focus' : 'Current Save', filename: portfolioMode === 'recruiter' ? 'Full-Stack & 3D Web Engineering' : 'Current Save (01/24/24, 8:00 am)', desc: portfolioMode === 'recruiter' ? 'React · Three.js · Node.js · Performance' : 'Survival Mode, Version: Jan 2024', iconText: portfolioMode === 'recruiter' ? 'CF' : 'CS', color1: '#ffff55', color2: '#55aa55', details: 'Engineering deep interactive web client platforms. Mastering performance auditing, memory allocation optimization, three-dimensional scene graph structures, and secure client-side form connections.' },
                { id: 'hardcore', name: portfolioMode === 'recruiter' ? 'Interests & Strengths' : 'Hardcore Mode', filename: portfolioMode === 'recruiter' ? 'Problem Solver · Security · Low-level Systems' : 'Hardcore Mode (02/20/20, 11:30 am)', desc: portfolioMode === 'recruiter' ? 'Debugging · Reverse Engineering · Firewalls' : 'Hardcore Mode, Version: Feb 2020', iconText: portfolioMode === 'recruiter' ? 'IS' : 'HM', color1: '#ff5555', color2: '#aa0000', details: 'Relentless problem solver. Enjoys diving into unknown source code bases, manually parsing raw byte streams, configuring custom firewalls, and exploring voxelized game mechanics.' },
                { id: 'achievements', name: portfolioMode === 'recruiter' ? 'Certifications' : 'Achievements', filename: portfolioMode === 'recruiter' ? 'TryHackMe · Secure Full-Stack Dev · Networking' : 'Achievements (Ongoing)', desc: portfolioMode === 'recruiter' ? 'Ongoing Professional Development' : 'Creative Mode, Version: Ongoing', iconText: 'AC', color1: '#ffaa00', color2: '#aa5500', details: 'Completed extensive labs on TryHackMe, certified in secure full-stack development patterns, and built multi-threaded network tooling.' }
              ].map(world => (
                <div 
                  key={world.id}
                  onClick={() => setExpandedWorld(world.id)}
                  onDoubleClick={() => setPlayingWorld(world)}
                  className={`mc-list-item ${expandedWorld === world.id ? 'selected' : ''}`}
                >
                  {/* World Icon */}
                  <div style={{ width: 'calc(16 * var(--mu))', height: 'calc(16 * var(--mu))', background: `linear-gradient(to bottom, ${world.color1} 40%, ${world.color2} 40%)`, marginRight: 'calc(4 * var(--mu))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textShadow: 'calc(1 * var(--mu)) calc(1 * var(--mu)) 0 #000', fontSize: 'calc(5.5 * var(--font-mu))', border: 'calc(1 * var(--mu)) solid #000', flexShrink: 0, imageRendering: 'pixelated' }}>
                    {world.iconText}
                  </div>
                  {/* Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(0.5 * var(--mu))' }}>
                    <div style={{ color: '#fff', fontSize: 'calc(5 * var(--font-mu))', textShadow: 'calc(1 * var(--mu)) calc(1 * var(--mu)) 0 #3f3f3f' }}>{world.name}</div>
                    <div style={{ color: '#aaa', fontSize: 'calc(4 * var(--font-mu))', textShadow: 'calc(1 * var(--mu)) calc(1 * var(--mu)) 0 #3f3f3f' }}>{world.filename}</div>
                    <div style={{ color: '#aaa', fontSize: 'calc(4 * var(--font-mu))', textShadow: 'calc(1 * var(--mu)) calc(1 * var(--mu)) 0 #3f3f3f' }}>{world.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Buttons — exactly like the screenshot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'calc(4 * var(--mu))', marginTop: 'calc(3 * var(--mu))', paddingBottom: 'calc(4 * var(--mu))' }}>
              {/* Row 1: Play Selected World | Create New World */}
              <div style={{ display: 'flex', gap: 'calc(4 * var(--mu))', width: 'calc(304 * var(--mu))' }}>
                <button className={`mc-btn ${expandedWorld ? '' : 'disabled'}`} style={{ width: '50%' }} onClick={() => {
                  if (expandedWorld) {
                    const worlds = [
                      { id: 'origins', name: portfolioMode === 'recruiter' ? 'Education' : 'Origins World', details: 'Computer Science major at UPES University. Explored core database architectures, hardware interrupts, and low-level compilation structures. Focus area: Cybersecurity and Web Architectures.' },
                      { id: 'current', name: portfolioMode === 'recruiter' ? 'Current Focus' : 'Current Save', details: 'Engineering deep interactive web client platforms. Mastering performance auditing, memory allocation optimization, three-dimensional scene graph structures, and secure client-side form connections.' },
                      { id: 'hardcore', name: portfolioMode === 'recruiter' ? 'Interests & Strengths' : 'Hardcore Mode', details: 'Relentless problem solver. Enjoys diving into unknown source code bases, manually parsing raw byte streams, configuring custom firewalls, and exploring voxelized game mechanics.' },
                      { id: 'achievements', name: portfolioMode === 'recruiter' ? 'Certifications' : 'Achievements', details: 'Completed extensive labs on TryHackMe, certified in secure full-stack development patterns, and built multi-threaded network tooling.' }
                    ];
                    const w = worlds.find(x => x.id === expandedWorld);
                    if (w) setPlayingWorld(w);
                  }
                }}>
                  <span className="mc-btn-inner">{portfolioMode === 'recruiter' ? 'View Details' : 'Play Selected World'}</span>
                </button>
                <button className="mc-btn" style={{ width: '50%' }} onClick={() => navigateTo('projects')}>
                  <span className="mc-btn-inner">{portfolioMode === 'recruiter' ? 'View Projects' : 'Create New World'}</span>
                </button>
              </div>
              {/* Row 2: Edit | Delete | Re-Create | Cancel */}
              <div style={{ display: 'flex', gap: 'calc(4 * var(--mu))', width: 'calc(304 * var(--mu))' }}>
                <button className="mc-btn" style={{ width: '25%' }} onClick={() => window.open('https://github.com/RaghavNotFound', '_blank')}>
                  <span className="mc-btn-inner">{portfolioMode === 'recruiter' ? 'GitHub' : 'Edit'}</span>
                </button>
                <button className="mc-btn" style={{ width: '25%' }} onClick={() => window.open('https://linkedin.com', '_blank')}>
                  <span className="mc-btn-inner">{portfolioMode === 'recruiter' ? 'LinkedIn' : 'Delete'}</span>
                </button>
                <button className="mc-btn" style={{ width: '25%' }} onClick={() => navigateTo('contact')}>
                  <span className="mc-btn-inner">{portfolioMode === 'recruiter' ? 'Contact' : 'Re-Create'}</span>
                </button>
                <button className="mc-btn" style={{ width: '25%' }} onClick={() => navigateTo('menu')}>
                  <span className="mc-btn-inner">Back</span>
                </button>
              </div>
            </div>

            {/* "Play" Modal Overlay */}
            {playingWorld && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(0,0,0,0.7)', border: 'calc(1 * var(--mu)) solid #555', padding: 'calc(6 * var(--mu))', width: '60%', maxWidth: 'calc(240 * var(--mu))', color: '#fff', fontFamily: "'Minecraft', sans-serif", fontSize: 'calc(5 * var(--font-mu))', textShadow: 'calc(1 * var(--mu)) calc(1 * var(--mu)) 0 #3f3f3f', display: 'flex', flexDirection: 'column', gap: 'calc(4 * var(--mu))' }}>
                  <div style={{ fontSize: 'calc(7 * var(--font-mu))', textAlign: 'center', color: '#ffff55' }}>{playingWorld.name}</div>
                  <div style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#ddd' }}>{playingWorld.details}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'calc(2 * var(--mu))' }}>
                    <button className="mc-btn" style={{ width: 'calc(100 * var(--mu))' }} onClick={() => setPlayingWorld(null)}>
                      <span className="mc-btn-inner">Done</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MULTIPLAYER / PROJECTS SCREEN */}
        {activeSection === 'projects' && (
          <div className="gui-screen" style={{ justifyContent: 'flex-start', padding: 0 }}>
            {/* Title */}
            <div className="gui-title" style={{ marginTop: 'calc(4 * var(--mu))', marginBottom: 'calc(3 * var(--mu))' }}>
              {portfolioMode === 'recruiter' ? 'Projects' : 'Play Multiplayer'}
            </div>

            {/* Server/Project List — dark scrollable strip */}
            <div className="mc-list-container">
              {projectsData.projects.map(project => (
                <div 
                  key={project.id}
                  onClick={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}
                  className={`mc-list-item ${selectedProject?.id === project.id ? 'selected' : ''}`}
                  style={{ justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {/* Server Icon */}
                    <div style={{ width: 'calc(16 * var(--mu))', height: 'calc(16 * var(--mu))', background: '#333', marginRight: 'calc(4 * var(--mu))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 'calc(6 * var(--font-mu))', border: 'calc(1 * var(--mu)) solid #555', flexShrink: 0 }}>
                      {project.icon}
                    </div>
                    {/* Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(0.5 * var(--mu))' }}>
                      <div style={{ color: '#fff', fontSize: 'calc(5 * var(--font-mu))', textShadow: 'calc(1 * var(--mu)) calc(1 * var(--mu)) 0 #3f3f3f' }}>{project.name}</div>
                      <div style={{ color: '#aaa', fontSize: 'calc(4 * var(--font-mu))', textShadow: 'calc(1 * var(--mu)) calc(1 * var(--mu)) 0 #3f3f3f' }}>{project.tagline}</div>
                      <div style={{ color: '#55ffff', fontSize: 'calc(3.5 * var(--font-mu))', textShadow: 'calc(1 * var(--mu)) calc(1 * var(--mu)) 0 #3f3f3f' }}>{project.stack.join(' · ')}</div>
                    </div>
                  </div>
                  {/* Ping bars */}
                  <div style={{ display: 'flex', gap: 'calc(0.5 * var(--mu))', alignItems: 'flex-end', height: 'calc(8 * var(--mu))' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{ width: 'calc(1 * var(--mu))', height: `calc(${i * 1.5} * var(--mu))`, background: i <= project.complexity ? '#55ff55' : '#555' }} />
                    ))}
                  </div>
                </div>
              ))}
              {/* Scanning text */}
              <div style={{ color: '#aaa', fontSize: 'calc(4 * var(--font-mu))', fontFamily: "'Minecraft', sans-serif", textShadow: 'calc(1 * var(--mu)) calc(1 * var(--mu)) 0 #3f3f3f', marginTop: 'calc(4 * var(--mu))' }}>
                {portfolioMode === 'recruiter' ? 'Showing all projects' : 'Scanning for games on your local network'}
              </div>
            </div>

            {/* Footer Buttons — matching screenshot 2 */}
            {/* Footer Buttons — matching screenshot 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'calc(4 * var(--mu))', marginTop: 'calc(3 * var(--mu))', paddingBottom: 'calc(4 * var(--mu))' }}>
              {/* Row 1: Join Server | Direct Connection | Add Server */}
              <div style={{ display: 'flex', gap: 'calc(4 * var(--mu))', width: 'calc(304 * var(--mu))' }}>
                <button className={`mc-btn ${selectedProject ? '' : 'disabled'}`} style={{ width: '33.33%' }} onClick={() => {
                  if (selectedProject) window.open(selectedProject.live, '_blank');
                }}>
                  <span className="mc-btn-inner">{portfolioMode === 'recruiter' ? 'Live Demo' : 'Join Server'}</span>
                </button>
                <button className={`mc-btn ${selectedProject ? '' : 'disabled'}`} style={{ width: '33.33%' }} onClick={() => {
                  if (selectedProject) window.open(selectedProject.github, '_blank');
                }}>
                  <span className="mc-btn-inner">{portfolioMode === 'recruiter' ? 'GitHub' : 'Direct Connection'}</span>
                </button>
                <button className="mc-btn" style={{ width: '33.33%' }} onClick={() => navigateTo('contact')}>
                  <span className="mc-btn-inner">{portfolioMode === 'recruiter' ? 'Contact Me' : 'Add Server'}</span>
                </button>
              </div>
              {/* Row 2: Edit | Delete | Refresh | Back */}
              <div style={{ display: 'flex', gap: 'calc(4 * var(--mu))', width: 'calc(304 * var(--mu))' }}>
                <button className="mc-btn" style={{ width: '25%' }} onClick={() => navigateTo('skills')}>
                  <span className="mc-btn-inner">{portfolioMode === 'recruiter' ? 'Skills' : 'Edit'}</span>
                </button>
                <button className="mc-btn" style={{ width: '25%' }} onClick={() => navigateTo('profile')}>
                  <span className="mc-btn-inner">{portfolioMode === 'recruiter' ? 'About' : 'Delete'}</span>
                </button>
                <button className="mc-btn" style={{ width: '25%' }} onClick={() => { setSelectedProject(null); }}>
                  <span className="mc-btn-inner">Refresh</span>
                </button>
                <button className="mc-btn" style={{ width: '25%' }} onClick={() => navigateTo('menu')}>
                  <span className="mc-btn-inner">Back</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REALMS / SKILLS SCREEN */}
        {activeSection === 'skills' && (
          <div className="gui-screen" style={{ justifyContent: 'flex-start', padding: 0 }}>
            {/* Title */}
            <div className="gui-title" style={{ marginTop: 'calc(4 * var(--mu))', marginBottom: 'calc(3 * var(--mu))' }}>
              {portfolioMode === 'recruiter' ? 'Skills' : 'Advancements'}
            </div>

            {/* Skills list — dark scrollable strip */}
            <div className="mc-list-container">
              {skillsData.skills.map(skill => {
                const statusIcon = skill.status === 'unlocked' ? '⭐' : skill.status === 'in-progress' ? '⚙️' : '🔒';
                return (
                  <div 
                    key={skill.id}
                    className="mc-list-item"
                  >
                    <div style={{ width: 'calc(12 * var(--mu))', height: 'calc(12 * var(--mu))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'calc(6 * var(--font-mu))', marginRight: 'calc(4 * var(--mu))', flexShrink: 0 }}>
                      {statusIcon}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(0.5 * var(--mu))', flexGrow: 1 }}>
                      <div style={{ color: '#fff', fontSize: 'calc(5 * var(--font-mu))', textShadow: 'calc(1 * var(--mu)) calc(1 * var(--mu)) 0 #3f3f3f' }}>{skill.name}</div>
                      <div style={{ color: '#aaa', fontSize: 'calc(4 * var(--font-mu))', textShadow: 'calc(1 * var(--mu)) calc(1 * var(--mu)) 0 #3f3f3f' }}>
                        {portfolioMode === 'recruiter' ? `${skill.category}` : `${skill.status === 'unlocked' ? 'Advancement Made!' : skill.status === 'in-progress' ? 'Task in Progress...' : 'Advancement Locked'}${skill.startDate ? ` (${skill.startDate})` : ''}`}
                      </div>
                      <div style={{ color: '#888', fontSize: 'calc(3.5 * var(--font-mu))', textShadow: 'calc(1 * var(--mu)) calc(1 * var(--mu)) 0 #3f3f3f' }}>{skill.description}</div>
                    </div>
                    {/* Website Link Button */}
                    {skill.url && (
                      <div style={{ marginLeft: 'calc(4 * var(--mu))', flexShrink: 0 }}>
                        <a href={skill.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                          <button className="mc-btn" style={{ width: 'calc(40 * var(--mu))', height: 'calc(12 * var(--mu))', fontSize: 'calc(4 * var(--font-mu))' }}>
                            <span className="mc-btn-inner">View Site</span>
                          </button>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer button — Done */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'calc(4 * var(--mu))', marginTop: 'calc(3 * var(--mu))', paddingBottom: 'calc(4 * var(--mu))' }}>
              <div style={{ display: 'flex', gap: 'calc(4 * var(--mu))', width: 'calc(304 * var(--mu))' }}>
                <button className="mc-btn" style={{ width: '100%' }} onClick={() => navigateTo('menu')}>
                  <span className="mc-btn-inner">Done</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OPTIONS / CONTACT SCREEN */}
        {activeSection === 'contact' && (
          <ContactScreen 
            navigateTo={navigateTo}
            musicVolume={musicVolume}
            setMusicVolume={setMusicVolume}
            buttonVolume={buttonVolume}
            setButtonVolume={setButtonVolume}
            textScale={textScale}
            setTextScale={setTextScale}
            skyboxSpeed={skyboxSpeed}
            setSkyboxSpeed={setSkyboxSpeed}
            reducedMotion={reducedMotion}
            setReducedMotion={setReducedMotion}
            portfolioMode={portfolioMode}
            setPortfolioMode={setPortfolioMode}
          />
        )}

        {/* FOOTER */}
        <div className="footer-left">Minecraft 1.21.8</div>
        <div className="footer-right">Copyright Mojang AB. Portfolio RaghavNotFound!</div>

      </div>

      {/* F3 OVERLAY */}
      {f3Open && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 2000,
          fontFamily: "'Minecraft', sans-serif",
          fontSize: 'calc(4 * var(--font-mu))',
          color: '#ffffff',
          textShadow: 'calc(1 * var(--mu)) calc(1 * var(--mu)) 0 #3f3f3f',
          display: 'flex',
          justifyContent: 'space-between',
          lineHeight: '1.1'
        }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Minecraft 1.21.8 (Portfolio/RaghavNotFound)</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>{systemSpecs.browser} on {systemSpecs.os}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>&nbsp;</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Cores: {systemSpecs.cores}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Screen: {systemSpecs.screenRes}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Viewport: {systemSpecs.viewportRes}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Aspect: {systemSpecs.aspectRatio}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Platform: {systemSpecs.platform}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Timezone: {systemSpecs.timezone}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>&nbsp;</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>XYZ: {systemSpecs.coords}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>IP: {systemSpecs.ip}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Location: {systemSpecs.location}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>ISP: {systemSpecs.isp}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Online: {systemSpecs.online}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Battery: {systemSpecs.battery}</div>
          </div>
          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Memory: {systemSpecs.memory} / JS Heap: {systemSpecs.jsHeapSize}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>DOM Nodes: {systemSpecs.domNodes}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Renderer: {systemSpecs.gpuRenderer}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>GPU Vendor: {systemSpecs.gpuVendor}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>GL Version: {systemSpecs.glVersion}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>GLSL: {systemSpecs.glslVersion}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Max Texture: {systemSpecs.maxTextureSize}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>&nbsp;</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Language: {systemSpecs.language}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Cookies: {systemSpecs.cookies}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Session Time: {systemSpecs.sessionTime}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Visit Count: {systemSpecs.visitCount}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>DNT: {systemSpecs.dnt}</div>
            <div style={{ background: 'rgba(80,80,80,0.5)', padding: '0 calc(1 * var(--mu))' }}>Color Scheme: {systemSpecs.colorScheme}</div>
          </div>
        </div>
      )}

      {/* Music Toast Notification */}
      <div 
        className={`music-toast ${showSongNotification ? 'active' : ''}`}
        style={{
          width: MUSIC_TOAST_WIDTH,
          height: MUSIC_TOAST_HEIGHT,
          borderWidth: MUSIC_TOAST_BORDER_WIDTH,
          borderRadius: MUSIC_TOAST_BORDER_RADIUS,
          top: MUSIC_TOAST_Y,
          left: MUSIC_TOAST_X,
          '--icon-size': MUSIC_TOAST_ICON_SIZE,
          '--icon-margin': MUSIC_TOAST_ICON_MARGIN,
          '--icon-bounce-speed': MUSIC_TOAST_BOUNCE_SPEED,
          '--icon-bounce-delay': MUSIC_TOAST_BOUNCE_DELAY
        }}
      >
        <div className="music-toast-icon">
          <div className="custom-note note-1"></div>
          <div className="custom-note note-2"></div>
          <div className="custom-note note-3"></div>
        </div>
        <div className="music-toast-text">{currentSongName}</div>
      </div>
    </div>
  );
}
