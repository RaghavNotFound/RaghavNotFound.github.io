/**
 * MINECRAFT GUI SCALER
 * ───────────────────
 * Simulates Minecraft: Java Edition's "GUI Scale: Auto" logic.
 * Calculates an integer scaling factor based on the window size
 * to keep the pixel art sharp and layout proportions authentic.
 */
(function () {
  'use strict';

  function updateScale() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Minecraft Java Edition GUI Scale Auto calculation:
    // Scale factor increases by 1 for every 320px width and 240px height.
    // Minimum scale is 1.
    let scale = Math.min(Math.floor(w / 320), Math.floor(h / 240));
    scale = Math.max(1, scale);

    // Set the scale variable on the root document
    document.documentElement.style.setProperty('--gui-scale', scale);
  }

  window.addEventListener('resize', updateScale);
  updateScale();
})();
