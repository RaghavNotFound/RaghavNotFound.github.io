import React, { useState, useEffect, useRef } from 'react';

const SPLASH_TEXTS = [
  "Now with 100% less null pointer exceptions!",
  "Works on my machine!",
  "Also try Terraria!",
  "git push --force",
  "It's a feature, not a bug!",
  "Asynchronous by nature!",
  "Finally centered that div!",
  "Console.log('Hello World');",
  "Powered by coffee!"
];

export default function MainMenu({ navigateTo, musicVolume, handleQuitGame, setIsHorror }) {
  const [splashText, setSplashText] = useState('');
  const [showQuitModal, setShowQuitModal] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Select random splash text on mount
    const randomSplash = SPLASH_TEXTS[Math.floor(Math.random() * SPLASH_TEXTS.length)];
    setSplashText(randomSplash);

    // Initialize click sound
    audioRef.current = new Audio('/assets/click.mp3'); // We'll assume a placeholder path, will fail silently if missing
    audioRef.current.volume = 0.5;
  }, []);

  const playClick = () => {
    if (musicVolume > 0 && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const onBtnEnter = () => {
    playClick();
  };

  const handleQuitClick = () => {
    playClick();
    setShowQuitModal(true);
  };

  const confirmQuit = () => {
    playClick();
    setShowQuitModal(false);
    // Execute the parent's horror/jumpscare function as requested
    if (handleQuitGame) {
      handleQuitGame();
    }
  };

  const cancelQuit = () => {
    playClick();
    setShowQuitModal(false);
  };

  return (
    <>
      <div className="title-block">
        <img src="/assets/minecraft.png" alt="Minecraft" className="title-logo" draggable="false" />
        <img src="/assets/edition.png" alt="Java Edition" className="title-edition" draggable="false" />
        <div className="splash-text pulsing">{splashText}</div>
      </div>

      <div className="menu-buttons">
        <button 
          className="mc-btn tooltip-container" 
          onClick={() => { playClick(); navigateTo('profile'); }}
          onMouseEnter={onBtnEnter}
        >
          <span className="mc-btn-inner">Singleplayer</span>
          <span className="tooltip-text">Learn about the dev</span>
        </button>

        <button 
          className="mc-btn tooltip-container" 
          onClick={() => { playClick(); navigateTo('projects'); }}
          onMouseEnter={onBtnEnter}
        >
          <span className="mc-btn-inner">Multiplayer</span>
          <span className="tooltip-text">Browse the projects</span>
        </button>

        <button 
          className="mc-btn tooltip-container" 
          onClick={() => { playClick(); navigateTo('skills'); }}
          onMouseEnter={onBtnEnter}
        >
          <span className="mc-btn-inner">Achievements</span>
          <span className="tooltip-text">Explore the skill tree</span>
        </button>

        <div className="menu-row bottom-row">
          <button 
            className="mc-btn icon-btn lang tooltip-container" 
            onClick={() => { playClick(); alert("Language settings are decorative in this portfolio."); }}
            onMouseEnter={onBtnEnter}
          >
            <span className="mc-btn-inner">
              <img src="/assets/Icon_Language.png" alt="Lang" className="lang-img" />
            </span>
            <span className="tooltip-text">Language</span>
          </button>

          <button 
            className="mc-btn half btn-options tooltip-container" 
            onClick={() => { playClick(); navigateTo('contact'); }}
            onMouseEnter={onBtnEnter}
          >
            <span className="mc-btn-inner">Options...</span>
            <span className="tooltip-text">Get in touch</span>
          </button>
          
          <button 
            className="mc-btn half btn-quit tooltip-container" 
            onClick={handleQuitClick}
            onMouseEnter={() => { onBtnEnter(); if (setIsHorror) setIsHorror(true); }}
            onMouseLeave={() => { if (setIsHorror) setIsHorror(false); }}
          >
            <span className="mc-btn-inner">Quit Game</span>
            <span className="tooltip-text">Exit the portfolio?</span>
          </button>

          <button 
            className="mc-btn icon-btn tooltip-container" 
            onClick={() => { playClick(); alert("Accessibility options are decorative in this portfolio."); }}
            onMouseEnter={onBtnEnter}
          >
            <span className="mc-btn-inner">
              <img src="/assets/accessibility.png" alt="Accessibility" className="accessibility-img" />
            </span>
            <span className="tooltip-text">Accessibility</span>
          </button>
        </div>
      </div>

      {showQuitModal && (
        <div className="quit-modal-overlay">
          <div className="quit-modal">
            <div className="quit-modal-title">Are you sure you want to quit?</div>
            <div className="quit-modal-desc">Just kidding. Thanks for visiting! Connect with me:</div>
            <div className="quit-modal-buttons">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="mc-btn half" onClick={playClick}>
                <span className="mc-btn-inner">LinkedIn</span>
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="mc-btn half" onClick={playClick}>
                <span className="mc-btn-inner">GitHub</span>
              </a>
            </div>
            <div className="quit-modal-buttons" style={{ marginTop: 'calc(2 * var(--mu))' }}>
              <button className="mc-btn" onClick={cancelQuit}>
                <span className="mc-btn-inner">Back to Game</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
