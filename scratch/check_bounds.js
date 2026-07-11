const fs = require('fs');
const zlib = require('zlib');

function getPngBounds(filePath) {
  const buf = fs.readFileSync(filePath);
  
  // Verify PNG signature
  if (buf.readUInt32BE(0) !== 0x89504E47 || buf.readUInt32BE(4) !== 0x0D0A1A0A) {
    throw new Error('Not a valid PNG file');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let idatBuffers = [];

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    
    if (type === 'IHDR') {
      width = buf.readUInt32BE(offset + 8);
      height = buf.readUInt32BE(offset + 12);
      bitDepth = buf[offset + 16];
      colorType = buf[offset + 17];
      console.log(`${filePath} Dimensions: ${width}x${height}, ColorType: ${colorType}, BitDepth: ${bitDepth}`);
    } else if (type === 'IDAT') {
      idatBuffers.push(buf.slice(offset + 8, offset + 8 + length));
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  if (colorType !== 6 || bitDepth !== 8) {
    console.log('Skipping pixel-level bounds check (not RGBA 8-bit)');
    return;
  }

  // Decompress IDAT
  const compressed = Buffer.concat(idatBuffers);
  const decompressed = zlib.inflateSync(compressed);

  // Scanline length = 1 byte filter + width * 4 bytes (RGBA)
  const scanlineLength = 1 + width * 4;
  let minX = width, maxX = 0, minY = height, maxY = 0;

  for (let y = 0; y < height; y++) {
    const lineStart = y * scanlineLength;
    const filter = decompressed[lineStart];
    // Note: We don't need to fully decode filters if we just check alpha values,
    // but the filter might offset values. To be precise, let's decode scanline filters.
  }
  
  // Actually, a simpler way is to just do a basic filter reconstruction for sub/up/average/paeth
  // Let's implement full filter reconstruction to get true RGBA values:
  const pixels = Buffer.alloc(width * height * 4);
  const bytesPerPixel = 4;

  for (let y = 0; y < height; y++) {
    const rawStart = y * scanlineLength;
    const filterType = decompressed[rawStart];
    const currentRaw = decompressed.slice(rawStart + 1, rawStart + 1 + width * 4);
    const pixelStart = y * width * 4;

    for (let x = 0; x < width * 4; x++) {
      const rawVal = currentRaw[x];
      let reconVal = 0;
      
      const left = x >= bytesPerPixel ? pixels[pixelStart + x - bytesPerPixel] : 0;
      const up = y > 0 ? pixels[(y - 1) * width * 4 + x] : 0;
      const upLeft = (y > 0 && x >= bytesPerPixel) ? pixels[(y - 1) * width * 4 + x - bytesPerPixel] : 0;

      if (filterType === 0) { // None
        reconVal = rawVal;
      } else if (filterType === 1) { // Sub
        reconVal = (rawVal + left) & 0xFF;
      } else if (filterType === 2) { // Up
        reconVal = (rawVal + up) & 0xFF;
      } else if (filterType === 3) { // Average
        reconVal = (rawVal + Math.floor((left + up) / 2)) & 0xFF;
      } else if (filterType === 4) { // Paeth
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        let paeth = 0;
        if (pa <= pb && pa <= pc) paeth = left;
        else if (pb <= pc) paeth = up;
        else paeth = upLeft;
        reconVal = (rawVal + paeth) & 0xFF;
      }

      pixels[pixelStart + x] = reconVal;
    }
  }

  // Find bounding box of non-transparent pixels (Alpha > 0)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log(`Bounds: X [${minX} to ${maxX}], Y [${minY} to ${maxY}]`);
  console.log(`Content size: ${maxX - minX + 1}x${maxY - minY + 1}`);
  console.log(`Offsets from top-left: Left: ${minX}, Top: ${minY}`);
}

getPngBounds('assets/minecraft.png');
getPngBounds('assets/edition.png');
