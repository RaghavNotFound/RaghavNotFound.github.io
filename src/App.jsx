import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function App() {
  const [activeSection, setActiveSection] = useState('menu'); // menu, profile, projects, contact
  const [isHorror, setIsHorror] = useState(false);
  const [isQuitJumpscare, setIsQuitJumpscare] = useState(false);
  const [selectedBtnId, setSelectedBtnId] = useState(null);
  const [arrowActive, setArrowActive] = useState(false);
  const [keyActive, setKeyActive] = useState(false);

  const skyboxCanvasRef = useRef(null);
  const steveCanvasRef = useRef(null);
  
  // Refs for sharing mouse coordinate changes between React and Three.js loop
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0 });

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

  // 1. WebGL Skybox Three.js Instance
  useEffect(() => {
    const canvas = skyboxCanvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

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

    const rotSpeed = (2 * Math.PI) / (120 * 60); // 120s rotation
    let frameId;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      skybox.rotation.y += rotSpeed;
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
      renderer.dispose();
    };
  }, []);

  // 2. 3D Steve Character Three.js Instance (Tied to horror status state)
  useEffect(() => {
    const canvas = steveCanvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    const scene = new THREE.Scene();
    
    // Arrays to collect resources for unified garbage collection disposal on unmount
    const geometries = [];
    const materials = [];
    const camera = new THREE.PerspectiveCamera(32, parent.clientWidth / parent.clientHeight, 0.1, 100);
    camera.position.set(0, -0.2, 13.3);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(parent.clientWidth, parent.clientHeight);

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
    gunGroup.rotation.x = -Math.PI / 2; // Hanging down initially
    rightArm.group.add(gunGroup);

    // Load custom gun image and build extruded 3D voxel gun with textures
    const gunTexture = textureLoader.load('/assets/gun.png');
    gunTexture.colorSpace = THREE.SRGBColorSpace;
    gunTexture.generateMipmaps = false;
    gunTexture.magFilter = THREE.NearestFilter;
    gunTexture.minFilter = THREE.NearestFilter;

    const gunMat = new THREE.MeshBasicMaterial({ map: gunTexture, transparent: true });
    materials.push(gunMat);

    const gunImg = new Image();
    gunImg.src = '/assets/gun.png';
    gunImg.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 32;
      tempCanvas.height = 32;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(gunImg, 0, 0, 32, 32);
      const imgData = ctx.getImageData(0, 0, 32, 32).data;

      // Find bounds of non-transparent and non-pink pixels to center the gun
      let minX = 32, maxX = 0, minY = 32, maxY = 0;
      let hasPixels = false;
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const idx = (y * 32 + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          const alpha = imgData[idx + 3];

          // Check for pink/magenta background chroma key (#ff00ff or similar)
          const isChromaPink = r > 180 && g < 120 && b > 180;
          if (alpha > 128 && !isChromaPink) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            hasPixels = true;
          }
        }
      }

      if (!hasPixels) return;

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Scale each pixel to a voxel
      const voxelSize = 0.024;
      const thickness = 0.09; // Extruded thickness of the gun pixels (fits classic Minecraft proportions)

      // Helper to apply UV mapping to voxel faces with padding to prevent color bleed
      const applyVoxelUVs = (geo, px, py) => {
        const uvs = geo.attributes.uv;
        const pad = 0.25; // 25% pixel padding to prevent texture bleeding from neighboring pink pixels
        for (let i = 0; i < uvs.count; i++) {
          let u = uvs.getX(i);
          let v = uvs.getY(i);
          
          // Map u and v to the specific pixel's UV coordinate bounds with padding
          u = (px + pad + u * (1 - 2 * pad)) / 32;
          v = (32 - py - 1 + pad + v * (1 - 2 * pad)) / 32;
          
          uvs.setXY(i, u, v);
        }
        uvs.needsUpdate = true;
      };

      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const idx = (y * 32 + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          const a = imgData[idx + 3];

          const isChromaPink = r > 180 && g < 120 && b > 180;
          if (a > 128 && !isChromaPink) {
            const voxelGeo = new THREE.BoxGeometry(thickness, voxelSize, voxelSize);
            applyVoxelUVs(voxelGeo, x, y);
            geometries.push(voxelGeo);

            const voxelMesh = new THREE.Mesh(voxelGeo, gunMat);
            
            // Align gun plane with Y-Z
            const localY = (centerY - y) * voxelSize + 0.08;
            const localZ = (centerX - x) * voxelSize + 0.05;

            voxelMesh.position.set(0, localY, localZ);
            gunGroup.add(voxelMesh);
          }
        }
      }
    };

    // Expose gunTexture to effect scope for cleanup
    window._gunTexture = gunTexture;

    gunGroup.visible = false;

    // Tracking variables
    let frameId;
    let time = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.035;

      // Access isHorror dynamically from reactive body class to bypass react closure stale state
      const horrorModeActive = document.body.classList.contains('horror-active');

      // Dynamically sync Steve's size scale: swells to 1.5 when hovering over Quit Game (horrorModeActive), otherwise baseScale
      const baseScale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--steve-scale')) || 0.7;
      const targetScale = horrorModeActive ? 1.5 : baseScale;
      const nextScale = steveGroup.scale.x + (targetScale - steveGroup.scale.x) * 0.12;
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
      
      // Clean up skin and gun textures
      skinTexture.dispose();
      if (window._gunTexture) window._gunTexture.dispose();

      // Clean up all loaded geometries and materials
      geometries.forEach(geo => geo.dispose());
      materials.forEach(mat => mat.dispose());

      // Dispose the WebGL renderer to free GPU resources
      renderer.dispose();
    };
  }, []);

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
      
      {/* Dynamic Fullscreen Skybox canvas */}
      <canvas id="skyboxCanvas" ref={skyboxCanvasRef}></canvas>
      
      {/* Screen Vignette Overlay */}
      <div className="vignette"></div>
      {/* 3D Steve Character canvas viewport container — always mounted, hidden when not on menu */}
      <div className="steve-container" style={{ display: activeSection === 'menu' ? 'flex' : 'none' }}>
        <div className="steve-nametag">RaghavNotFound</div>
        <canvas id="steveCanvas" ref={steveCanvasRef}></canvas>
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
        

        {/* Title Logo Block */}
        <div className="title-block">
          <img src="/assets/minecraft.png" alt="Minecraft" className="title-logo" draggable="false" />
          <img src="/assets/edition.png" alt="Java Edition" className="title-edition" draggable="false" />
          <div className="splash-text">Also try Terraria!</div>
        </div>

        {/* Dynamic Section Renderer */}
        {activeSection === 'menu' && (
          <div className="menu-buttons">
            <button className={`mc-btn ${selectedBtnId === 'singleplayer' ? 'selected-btn' : ''}`} onClick={() => setActiveSection('profile')}>
              <span className="mc-btn-inner">Singleplayer</span>
            </button>
            <button className={`mc-btn ${selectedBtnId === 'multiplayer' ? 'selected-btn' : ''}`} onClick={() => setActiveSection('projects')}>
              <span className="mc-btn-inner">Multiplayer</span>
            </button>
            <button className={`mc-btn ${selectedBtnId === 'realms' ? 'selected-btn' : ''}`} onClick={() => setActiveSection('skills')}>
              <span className="mc-btn-inner">Minecraft Realms</span>
            </button>
            <div className="menu-row bottom-row">
              <button className={`mc-btn icon-btn lang ${selectedBtnId === 'lang' ? 'selected-btn' : ''}`} title="Language" onClick={() => alert("Language settings are decorative in this portfolio.")}>
                <span className="mc-btn-inner">
                  <img src="/assets/Icon_Language.png" alt="Lang" className="lang-img" />
                </span>
              </button>
              <button className={`mc-btn half btn-options ${selectedBtnId === 'options' ? 'selected-btn' : ''}`} onClick={() => setActiveSection('contact')}>
                <span className="mc-btn-inner">Options...</span>
              </button>
              <button 
                className={`mc-btn half btn-quit ${selectedBtnId === 'quit' ? 'selected-btn' : ''}`} 
                id="btnQuit"
                onClick={handleQuitGame}
                onMouseEnter={() => setIsHorror(true)}
                onMouseLeave={() => setIsHorror(false)}
              >
                <span className="mc-btn-inner">Quit Game</span>
              </button>
              <button className={`mc-btn icon-btn ${selectedBtnId === 'accessibility' ? 'selected-btn' : ''}`} title="Accessibility Options" onClick={() => alert("Accessibility options are decorative in this portfolio.")}>
                <span className="mc-btn-inner">
                  <img src="/assets/accessibility.png" alt="Accessibility" className="accessibility-img" />
                </span>
              </button>
            </div>
          </div>
        )}

        {/* SINGLEPLAYER / ABOUT SCREEN */}
        {activeSection === 'profile' && (
          <div className="gui-screen">
            <div className="gui-title">Select World</div>
            <div className="gui-panel">
              <div className="bio-text">
                <div className="bio-section">
                  <div className="bio-heading">Creative Mode - Raghav Singhal</div>
                  <p>Welcome to my world! I am Raghav Singhal (aka RaghavNotFound), a full-stack engineer who loves building highly premium, immersive, and custom web applications. I combine modern front-end technologies with 3D WebGL interfaces to deliver outstanding visual experiences.</p>
                </div>
                <div className="bio-section" style={{ marginTop: 'calc(6 * var(--mu))' }}>
                  <div className="bio-heading">Survival Mode - Core Philosophy</div>
                  <p>My code is optimized for hardware acceleration, low memory footprints, and clean responsive layouts. I believe in writing robust code that stands the test of time while keeping the aesthetic beautiful, premium, and state-of-the-art.</p>
                </div>
              </div>
            </div>
            <div className="gui-row">
              <button className="mc-btn" onClick={() => setActiveSection('menu')}>
                <span className="mc-btn-inner">Cancel</span>
              </button>
            </div>
          </div>
        )}

        {/* MULTIPLAYER / PROJECTS SCREEN */}
        {activeSection === 'projects' && (
          <div className="gui-screen">
            <div className="gui-title">Play Multiplayer</div>
            <div className="gui-panel">
              
              <a href="https://github.com/RaghavNotFound/mysterious-tesla" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div className="server-item">
                  <div className="server-icon">MT</div>
                  <div className="server-details">
                    <div className="server-name">mysterious-tesla</div>
                    <div className="server-desc">React + Vite + Three.js Minecraft replica portfolio</div>
                  </div>
                  <div className="server-status">999/999</div>
                </div>
              </a>

              <a href="https://github.com/RaghavNotFound" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div className="server-item">
                  <div className="server-icon">GH</div>
                  <div className="server-details">
                    <div className="server-name">Github Repositories</div>
                    <div className="server-desc">Explore more of my open-source codebases and creations</div>
                  </div>
                  <div className="server-status">100/100</div>
                </div>
              </a>

            </div>
            <div className="gui-row">
              <button className="mc-btn" onClick={() => setActiveSection('menu')}>
                <span className="mc-btn-inner">Cancel</span>
              </button>
            </div>
          </div>
        )}

        {/* REALMS / SKILLS SCREEN */}
        {activeSection === 'skills' && (
          <div className="gui-screen">
            <div className="gui-title">Minecraft Realms</div>
            <div className="gui-panel">
              <div className="bio-text">
                <div className="bio-section">
                  <div className="bio-heading">Active Realms - Skills & Tech Stack</div>
                  <p style={{ marginBottom: 'calc(4 * var(--mu))' }}>Here is a listing of the core technologies I build on daily:</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'calc(2 * var(--mu))', color: '#ffcd9b' }}>
                    <div>• React / Next.js</div>
                    <div>• Three.js / WebGL / CSS 3D</div>
                    <div>• JavaScript (ES6+) / Node.js</div>
                    <div>• HTML5 / CSS3 / Vanilla CSS</div>
                    <div>• Vite / Webpack / Tooling</div>
                    <div>• Git / GitHub / Version Control</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="gui-row">
              <button className="mc-btn" onClick={() => setActiveSection('menu')}>
                <span className="mc-btn-inner">Cancel</span>
              </button>
            </div>
          </div>
        )}

        {/* OPTIONS / CONTACT SCREEN */}
        {activeSection === 'contact' && (
          <div className="gui-screen">
            <div className="gui-title">Options</div>
            
            <div className="options-grid">
              
              <a href="https://github.com/RaghavNotFound" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <button className="mc-btn">
                  <span className="mc-btn-inner">GitHub: RaghavNotFound</span>
                </button>
              </a>

              <a href="mailto:raghavsinghal638@gmail.com" style={{ textDecoration: 'none' }}>
                <button className="mc-btn">
                  <span className="mc-btn-inner">Email: raghavsinghal638</span>
                </button>
              </a>

              <button className="mc-btn">
                <span className="mc-btn-inner">Skin: RaghavNotFound</span>
              </button>

              <button className="mc-btn" onClick={() => alert("Resume download placeholder!")}>
                <span className="mc-btn-inner">Resume: Download</span>
              </button>

            </div>

            <div className="gui-row" style={{ width: 'calc(60 * var(--mu))' }}>
              <button className="mc-btn" onClick={() => setActiveSection('menu')}>
                <span className="mc-btn-inner">Done</span>
              </button>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="footer-left">Minecraft 1.21.8</div>
        <div className="footer-right">Copyright Mojang AB. Portfolio RaghavNotFound!</div>

      </div>
    </div>
  );
}
