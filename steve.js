/**
 * MINECRAFT 3D STEVE CHARACTER RENDERER (PE Style)
 * ────────────────────────────────────────────────
 * Generates a fully 3D CSS Steve character on the right side of the screen.
 * Supports:
 *   - Dual skin layers (inner and outer layers) for high-fidelity depth.
 *   - Floating player nametag "RaghavNotFound" above his head.
 *   - Dynamic mouse-tracking (Steve's head rotates smoothly to follow the arrow).
 */

(function () {
  'use strict';

  // Config mapping for Minecraft skin texture (64x64 format)
  const skinMap = {
    head: {
      w: 8, h: 8, d: 8,
      inner: {
        top:    { x: 8,  y: 0 },
        bottom: { x: 16, y: 0 },
        right:  { x: 0,  y: 8 },
        front:  { x: 8,  y: 8 },
        left:   { x: 16, y: 8 },
        back:   { x: 24, y: 8 }
      },
      outer: {
        top:    { x: 40, y: 0 },
        bottom: { x: 48, y: 0 },
        right:  { x: 32, y: 8 },
        front:  { x: 40, y: 8 },
        left:   { x: 48, y: 8 },
        back:   { x: 56, y: 8 }
      }
    },
    torso: {
      w: 8, h: 12, d: 4,
      inner: {
        top:    { x: 20, y: 16 },
        bottom: { x: 28, y: 16 },
        right:  { x: 16, y: 20 },
        front:  { x: 20, y: 20 },
        left:   { x: 28, y: 20 },
        back:   { x: 32, y: 20 }
      },
      outer: {
        top:    { x: 20, y: 32 },
        bottom: { x: 28, y: 32 },
        right:  { x: 16, y: 36 },
        front:  { x: 20, y: 36 },
        left:   { x: 28, y: 36 },
        back:   { x: 32, y: 36 }
      }
    },
    rightArm: {
      w: 4, h: 12, d: 4,
      inner: {
        top:    { x: 44, y: 16 },
        bottom: { x: 48, y: 16 },
        right:  { x: 40, y: 20 },
        front:  { x: 44, y: 20 },
        left:   { x: 48, y: 20 },
        back:   { x: 52, y: 20 }
      },
      outer: {
        top:    { x: 44, y: 32 },
        bottom: { x: 48, y: 32 },
        right:  { x: 40, y: 36 },
        front:  { x: 44, y: 36 },
        left:   { x: 48, y: 36 },
        back:   { x: 52, y: 36 }
      }
    },
    leftArm: {
      w: 4, h: 12, d: 4,
      inner: {
        top:    { x: 36, y: 48 },
        bottom: { x: 40, y: 48 },
        right:  { x: 32, y: 52 },
        front:  { x: 36, y: 52 },
        left:   { x: 40, y: 52 },
        back:   { x: 44, y: 52 }
      },
      outer: {
        top:    { x: 52, y: 48 },
        bottom: { x: 56, y: 48 },
        right:  { x: 48, y: 52 },
        front:  { x: 52, y: 52 },
        left:   { x: 56, y: 52 },
        back:   { x: 60, y: 52 }
      }
    },
    rightLeg: {
      w: 4, h: 12, d: 4,
      inner: {
        top:    { x: 4,  y: 16 },
        bottom: { x: 8,  y: 16 },
        right:  { x: 0,  y: 20 },
        front:  { x: 4,  y: 20 },
        left:   { x: 8,  y: 20 },
        back:   { x: 12, y: 20 }
      },
      outer: {
        top:    { x: 4,  y: 32 },
        bottom: { x: 8,  y: 32 },
        right:  { x: 0,  y: 36 },
        front:  { x: 4,  y: 36 },
        left:   { x: 8,  y: 36 },
        back:   { x: 12, y: 36 }
      }
    },
    leftLeg: {
      w: 4, h: 12, d: 4,
      inner: {
        top:    { x: 20, y: 48 },
        bottom: { x: 24, y: 48 },
        right:  { x: 16, y: 52 },
        front:  { x: 20, y: 52 },
        left:   { x: 24, y: 52 },
        back:   { x: 28, y: 52 }
      },
      outer: {
        top:    { x: 4,  y: 48 },
        bottom: { x: 8,  y: 48 },
        right:  { x: 0,  y: 52 },
        front:  { x: 4,  y: 52 },
        left:   { x: 8,  y: 52 },
        back:   { x: 12, y: 52 }
      }
    }
  };

  /**
   * Helper to build a 3D box component for a body part
   */
  function createLimb(partName, config, isOuter = false) {
    const limb = document.createElement('div');
    limb.className = `steve-limb ${partName} ${isOuter ? 'outer-layer' : 'inner-layer'}`;
    
    const { w, h, d } = config;
    const faces = isOuter ? config.outer : config.inner;
    
    // Size multiplier for outer layer to give depth
    const scale = isOuter ? 1.07 : 1.0;
    const wScaled = w * scale;
    const hScaled = h * scale;
    const dScaled = d * scale;

    limb.style.width = `calc(${wScaled} * var(--mu))`;
    limb.style.height = `calc(${hScaled} * var(--mu))`;

    const faceSpecs = [
      { name: 'front',  w: wScaled, h: hScaled, tx: faces.front.x,  ty: faces.front.y,  transform: `translate3d(0, 0, calc(${dScaled / 2} * var(--mu)))` },
      { name: 'back',   w: wScaled, h: hScaled, tx: faces.back.x,   ty: faces.back.y,   transform: `rotateY(180deg) translate3d(0, 0, calc(${dScaled / 2} * var(--mu)))` },
      { name: 'left',   w: dScaled, h: hScaled, tx: faces.left.x,   ty: faces.left.y,   transform: `rotateY(90deg) translate3d(0, 0, calc(${wScaled / 2} * var(--mu)))` },
      { name: 'right',  w: dScaled, h: hScaled, tx: faces.right.x,  ty: faces.right.y,  transform: `rotateY(-90deg) translate3d(0, 0, calc(${wScaled / 2} * var(--mu)))` },
      { name: 'top',    w: wScaled, h: dScaled, tx: faces.top.x,    ty: faces.top.y,    transform: `rotateX(90deg) translate3d(0, 0, calc(${hScaled / 2} * var(--mu)))` },
      { name: 'bottom', w: wScaled, h: dScaled, tx: faces.bottom.x, ty: faces.bottom.y, transform: `rotateX(-90deg) translate3d(0, 0, calc(${hScaled / 2} * var(--mu)))` }
    ];

    faceSpecs.forEach(spec => {
      const face = document.createElement('div');
      face.className = `face ${spec.name}`;
      face.style.width = `calc(${spec.w} * var(--mu))`;
      face.style.height = `calc(${spec.h} * var(--mu))`;
      face.style.transform = `translate(-50%, -50%) ${spec.transform}`;
      face.style.backgroundImage = "url('assets/steve.png')";
      
      const bgW = 64 * scale;
      const bgH = 64 * scale;
      const posX = spec.tx * scale;
      const posY = spec.ty * scale;
      
      face.style.backgroundSize = `calc(${bgW} * var(--mu)) calc(${bgH} * var(--mu))`;
      face.style.backgroundPosition = `calc(-1 * ${posX} * var(--mu)) calc(-1 * ${posY} * var(--mu))`;
      limb.appendChild(face);
    });

    return limb;
  }

  // Helper to build a 3D voxel handgun
  function create3DGun() {
    const gunContainer = document.createElement('div');
    gunContainer.className = 'steve-gun-3d';
    
    function createSolidBox(name, w, h, d, color, highlight, shadowColor) {
      const box = document.createElement('div');
      box.className = `gun-box ${name}`;
      box.style.width = `calc(${w} * var(--mu))`;
      box.style.height = `calc(${h} * var(--mu))`;
      box.style.transformStyle = 'preserve-3d';
      
      const faceSpecs = [
        { name: 'front',  w: w, h: h, transform: `translate3d(0, 0, calc(${d / 2} * var(--mu)))`, bg: color },
        { name: 'back',   w: w, h: h, transform: `rotateY(180deg) translate3d(0, 0, calc(${d / 2} * var(--mu)))`, bg: color },
        { name: 'left',   w: d, h: h, transform: `rotateY(90deg) translate3d(0, 0, calc(${w / 2} * var(--mu)))`, bg: shadowColor },
        { name: 'right',  w: d, h: h, transform: `rotateY(-90deg) translate3d(0, 0, calc(${w / 2} * var(--mu)))`, bg: highlight },
        { name: 'top',    w: w, h: d, transform: `rotateX(90deg) translate3d(0, 0, calc(${h / 2} * var(--mu)))`, bg: highlight },
        { name: 'bottom', w: w, h: d, transform: `rotateX(-90deg) translate3d(0, 0, calc(${h / 2} * var(--mu)))`, bg: shadowColor }
      ];
      
      faceSpecs.forEach(spec => {
        const face = document.createElement('div');
        face.className = `face ${spec.name}`;
        face.style.width = `calc(${spec.w} * var(--mu))`;
        face.style.height = `calc(${spec.h} * var(--mu))`;
        face.style.transform = `translate(-50%, -50%) ${spec.transform}`;
        face.style.backgroundColor = spec.bg;
        face.style.position = 'absolute';
        face.style.left = '50%';
        face.style.top = '50%';
        face.style.boxShadow = `inset calc(0.3 * var(--mu)) calc(0.3 * var(--mu)) 0 rgba(255,255,255,0.08), inset calc(-0.3 * var(--mu)) calc(-0.3 * var(--mu)) 0 rgba(0,0,0,0.15)`;
        box.appendChild(face);
      });
      
      return box;
    }
    
    // Slide (barrel): 1.4 wide, 1.6 high, 6.5 long
    const slide = createSolidBox('gun-slide', 1.4, 1.6, 6.5, '#3a3a3a', '#555555', '#222222');
    slide.style.position = 'absolute';
    slide.style.left = '0';
    slide.style.top = '0';
    slide.style.transform = `translate3d(0, calc(-1.6 * var(--mu)), calc(1.8 * var(--mu)))`; // sits on top of grip, pushed forward

    // Grip: 1.1 wide, 3.2 high, 1.6 long
    const grip = createSolidBox('gun-grip', 1.1, 3.2, 1.6, '#5c3e27', '#755235', '#3e2b1b');
    grip.style.position = 'absolute';
    grip.style.left = '0';
    grip.style.top = '0';
    grip.style.transform = `translate3d(0, 0, 0) rotateX(15deg)`; // angled grip

    gunContainer.appendChild(slide);
    gunContainer.appendChild(grip);
    
    return gunContainer;
  }

  // Initialize the Steve model DOM container
  function initSteve() {
    const container = document.createElement('div');
    container.className = 'steve-container';
    
    const steve = document.createElement('div');
    steve.className = 'steve-character';

    // Build limbs for both inner and outer layers
    for (const [name, config] of Object.entries(skinMap)) {
      const innerLimb = createLimb(name, config, false);
      const outerLimb = createLimb(name, config, true);

      // Group inner and outer layers for articulation/rotation together
      const limbWrapper = document.createElement('div');
      limbWrapper.className = `limb-wrapper ${name}-wrapper`;
      limbWrapper.appendChild(innerLimb);
      limbWrapper.appendChild(outerLimb);
      steve.appendChild(limbWrapper);
    }
    
    // Add a grounded drop shadow below Steve's feet
    const shadow = document.createElement('div');
    shadow.className = 'steve-shadow';
    steve.appendChild(shadow);

    // Add 3D voxel gun directly to the character container (reduces 3D nesting depth)
    const gun3D = create3DGun();
    steve.appendChild(gun3D);

    // Add Player Nametag (centered above head, direct child of container to avoid scale zoom)
    const nametag = document.createElement('div');
    nametag.className = 'steve-nametag';
    nametag.textContent = 'RaghavNotFound';
    container.appendChild(nametag);

    container.appendChild(steve);
    document.body.appendChild(container);

    // Setup mouse tracking variables (initialized to 20deg to face camera at rest)
    let targetRotY = 20;
    let targetRotX = 0;
    let currentRotY = 20;
    let currentRotX = 0;

    const headWrapper = steve.querySelector('.head-wrapper');
    const btnQuit = document.getElementById('btnQuit');
    let isQuitHovered = false;

    if (btnQuit) {
      btnQuit.addEventListener('mouseenter', () => {
        isQuitHovered = true;
        document.body.classList.add('horror-active');
      });
      btnQuit.addEventListener('mouseleave', () => {
        isQuitHovered = false;
        document.body.classList.remove('horror-active');
      });
    }

    // Monitor pointer moves
    window.addEventListener('mousemove', (e) => {
      if (!headWrapper) return;

      // When Quit Game is hovered, make head look directly forward/scary towards center screen
      if (isQuitHovered) {
        targetRotY = 20; // 20deg relative to body Y=-20 means looking straight at camera
        targetRotX = 0;
        return;
      }
      
      const rect = headWrapper.getBoundingClientRect();
      const headX = rect.left + rect.width / 2;
      const headY = rect.top + rect.height / 2;
      
      const dx = e.clientX - headX;
      const dy = e.clientY - headY;
      
      // Calculate angles in degrees
      // +20 offsets body rotateY(-20deg) to align look center with screen center
      targetRotY = (Math.atan2(dx, 300) * (180 / Math.PI)) + 20;
      targetRotX = -Math.atan2(dy, 300) * (180 / Math.PI); // Added negative sign back to fix vertical lookup
      
      // Clamp values so neck doesn't rotate like a demon, but allows looking across the whole screen.
      // Since looking left is negative relative to body center, clamp is from -55 (left) to +60 (right)
      targetRotY = Math.max(-55, Math.min(60, targetRotY));
      targetRotX = Math.max(-30, Math.min(30, targetRotX));
    });

    // Smooth transition loop
    function animateHead() {
      if (headWrapper) {
        currentRotY += (targetRotY - currentRotY) * 0.12;
        currentRotX += (targetRotX - currentRotX) * 0.12;
        
        // Apply smooth rotation relative to the base swing origin
        headWrapper.style.transform = `rotateY(${currentRotY}deg) rotateX(${currentRotX}deg)`;
      }
      requestAnimationFrame(animateHead);
    }
    
    requestAnimationFrame(animateHead);
  }

  // Inject Steve on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSteve);
  } else {
    initSteve();
  }
})();
