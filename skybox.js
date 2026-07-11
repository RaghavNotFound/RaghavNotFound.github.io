/**
 * WEBGL SKYBOX RENDERER
 * ─────────────────────
 * Renders a cube from the inside using WebGL.
 * GPU-accelerated, no CSS 3D transforms, buttery smooth.
 *
 * - 6 textures mapped to cube faces
 * - Slow Y-axis rotation + gentle X-axis breathing
 * - Auto-resizes to fill the viewport at device pixel ratio
 */

(function () {
  'use strict';

  const canvas = document.getElementById('skyboxCanvas');
  const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
  if (!gl) { console.error('WebGL not supported'); return; }

  /* ═══════════════════════════════════════════════════════
     SHADERS
     ═══════════════════════════════════════════════════════ */
  const VS = `
    attribute vec3 aPos;
    attribute vec2 aUV;
    uniform mat4 uMVP;
    varying vec2 vUV;
    void main() {
      gl_Position = uMVP * vec4(aPos, 1.0);
      vUV = aUV;
    }
  `;

  const FS = `
    precision mediump float;
    varying vec2 vUV;
    uniform sampler2D uTex;
    void main() {
      gl_FragColor = texture2D(uTex, vUV);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const aPos = gl.getAttribLocation(prog, 'aPos');
  const aUV  = gl.getAttribLocation(prog, 'aUV');
  const uMVP = gl.getUniformLocation(prog, 'uMVP');
  const uTex = gl.getUniformLocation(prog, 'uTex');

  /* ═══════════════════════════════════════════════════════
     CUBE GEOMETRY — viewed from INSIDE
     Each face: 4 corners → 2 triangles (6 indices)
     ═══════════════════════════════════════════════════════ */
  function makeFace(bl, br, tr, tl) {
    return {
      pos: new Float32Array([...bl, ...br, ...tr, ...tl]),
      uv:  new Float32Array([0,0, 1,0, 1,1, 0,1]),
      idx: new Uint16Array([0,1,2, 0,2,3]),
    };
  }

  const S = 1; // half-size of cube
  const faceData = {
    front:  makeFace([-S,-S,-S],[ S,-S,-S],[ S, S,-S],[-S, S,-S]),
    back:   makeFace([ S,-S, S],[-S,-S, S],[-S, S, S],[ S, S, S]),
    right:  makeFace([ S,-S,-S],[ S,-S, S],[ S, S, S],[ S, S,-S]),
    left:   makeFace([-S,-S, S],[-S,-S,-S],[-S, S,-S],[-S, S, S]),
    top:    makeFace([-S, S,-S],[ S, S,-S],[ S, S, S],[-S, S, S]),
    bottom: makeFace([-S,-S, S],[ S,-S, S],[ S,-S,-S],[-S,-S,-S]),
  };

  // Upload geometry to GPU buffers
  const faceBufs = {};
  for (const [name, f] of Object.entries(faceData)) {
    const pb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pb);
    gl.bufferData(gl.ARRAY_BUFFER, f.pos, gl.STATIC_DRAW);

    const ub = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ub);
    gl.bufferData(gl.ARRAY_BUFFER, f.uv, gl.STATIC_DRAW);

    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, f.idx, gl.STATIC_DRAW);

    faceBufs[name] = { pb, ub, ib, count: 6 };
  }

  /* ═══════════════════════════════════════════════════════
     TEXTURES — load 6 panorama images
     ═══════════════════════════════════════════════════════ */
  const TEX_FILES = {
    front:  'assets/skybox/front.png',
    back:   'assets/skybox/back.png',
    right:  'assets/skybox/right.png',
    left:   'assets/skybox/left.png',
    top:    'assets/skybox/top.png',
    bottom: 'assets/skybox/bottom.png',
  };

  const textures = {};
  let loaded = 0;

  for (const [name, src] of Object.entries(TEX_FILES)) {
    const tex = gl.createTexture();
    textures[name] = tex;

    const img = new Image();
    img.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      loaded++;
    };
    img.src = src;
  }

  /* ═══════════════════════════════════════════════════════
     MATRIX MATH — tiny inline library, no dependencies
     ═══════════════════════════════════════════════════════ */
  function perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0,
    ]);
  }

  function rotX(r) {
    const c = Math.cos(r), s = Math.sin(r);
    return new Float32Array([
      1, 0, 0, 0,
      0, c, s, 0,
      0,-s, c, 0,
      0, 0, 0, 1,
    ]);
  }

  function rotY(r) {
    const c = Math.cos(r), s = Math.sin(r);
    return new Float32Array([
       c, 0,-s, 0,
       0, 1, 0, 0,
       s, 0, c, 0,
       0, 0, 0, 1,
    ]);
  }

  function mul(a, b) {
    const o = new Float32Array(16);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++)
        o[j * 4 + i] =
          a[i] * b[j * 4] +
          a[4 + i] * b[j * 4 + 1] +
          a[8 + i] * b[j * 4 + 2] +
          a[12 + i] * b[j * 4 + 3];
    return o;
  }

  /* ═══════════════════════════════════════════════════════
     RENDER LOOP
     ═══════════════════════════════════════════════════════ */
  const SPIN  = (2 * Math.PI) / 120;       // full Y rotation in 120s
  const TILT  = 8 * Math.PI / 180;         // fixed downward tilt (8°)

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function frame(t) {
    requestAnimationFrame(frame);
    if (loaded < 6) return;              // wait for all textures

    resize();
    const s = t * 0.001;                 // seconds
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = canvas.width / canvas.height;
    const proj = perspective(90 * Math.PI / 180, aspect, 0.01, 10);
    const ry = rotY(s * SPIN);
    const rx = rotX(TILT);
    const mvp = mul(proj, mul(rx, ry));

    gl.uniformMatrix4fv(uMVP, false, mvp);

    for (const [name, buf] of Object.entries(faceBufs)) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf.pb);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, buf.ub);
      gl.enableVertexAttribArray(aUV);
      gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[name]);
      gl.uniform1i(uTex, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf.ib);
      gl.drawElements(gl.TRIANGLES, buf.count, gl.UNSIGNED_SHORT, 0);
    }
  }

  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  requestAnimationFrame(frame);

})();
