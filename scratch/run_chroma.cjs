const fs = require('fs');
const zlib = require('zlib');

function removeChroma(inputPath, outputPath) {
  const buf = fs.readFileSync(inputPath);
  
  if (buf.readUInt32BE(0) !== 0x89504E47 || buf.readUInt32BE(4) !== 0x0D0A1A0A) {
    throw new Error('Not a valid PNG file');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let chunks = [];
  let idatBuffers = [];

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    
    if (type === 'IHDR') {
      width = buf.readUInt32BE(offset + 8);
      height = buf.readUInt32BE(offset + 12);
      bitDepth = buf[offset + 16];
      colorType = buf[offset + 17];
      console.log(`IHDR: ${width}x${height}, ColorType: ${colorType}, BitDepth: ${bitDepth}`);
      chunks.push({ type, data: buf.slice(offset + 8, offset + 8 + length) });
    } else if (type === 'IDAT') {
      idatBuffers.push(buf.slice(offset + 8, offset + 8 + length));
    } else if (type === 'IEND') {
      chunks.push({ type, data: buf.slice(offset + 8, offset + 8 + length) });
      break;
    } else {
      chunks.push({ type, data: buf.slice(offset + 8, offset + 8 + length) });
    }
    offset += 12 + length;
  }

  // Support 8-bit RGBA (6) and 8-bit RGB (2)
  if ((colorType !== 6 && colorType !== 2) || bitDepth !== 8) {
    throw new Error('Only 8-bit RGB or RGBA PNG files are supported for chroma keying');
  }

  const compressed = Buffer.concat(idatBuffers);
  const decompressed = zlib.inflateSync(compressed);

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const scanlineLength = 1 + width * bytesPerPixel;
  const pixels = Buffer.alloc(width * height * bytesPerPixel);

  // 1. Reconstruct PNG filters to get raw pixels
  for (let y = 0; y < height; y++) {
    const rawStart = y * scanlineLength;
    const filterType = decompressed[rawStart];
    const currentRaw = decompressed.slice(rawStart + 1, rawStart + 1 + width * bytesPerPixel);
    const pixelStart = y * width * bytesPerPixel;

    for (let x = 0; x < width * bytesPerPixel; x++) {
      const rawVal = currentRaw[x];
      let reconVal = 0;
      
      const left = x >= bytesPerPixel ? pixels[pixelStart + x - bytesPerPixel] : 0;
      const up = y > 0 ? pixels[(y - 1) * width * bytesPerPixel + x] : 0;
      const upLeft = (y > 0 && x >= bytesPerPixel) ? pixels[(y - 1) * width * bytesPerPixel + x - bytesPerPixel] : 0;

      if (filterType === 0) {
        reconVal = rawVal;
      } else if (filterType === 1) {
        reconVal = (rawVal + left) & 0xFF;
      } else if (filterType === 2) {
        reconVal = (rawVal + up) & 0xFF;
      } else if (filterType === 3) {
        reconVal = (rawVal + Math.floor((left + up) / 2)) & 0xFF;
      } else if (filterType === 4) {
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

  // 2. Remove Magenta chroma key, convert to RGBA (ColorType 6)
  const outPixels = Buffer.alloc(width * height * 4);
  let chromaCount = 0;
  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * bytesPerPixel;
    const destIdx = i * 4;
    const r = pixels[srcIdx];
    const g = pixels[srcIdx + 1];
    const b = pixels[srcIdx + 2];
    const a = bytesPerPixel === 4 ? pixels[srcIdx + 3] : 255;
    
    // Check if pixel is close to magenta (Chroma key)
    if (r > 160 && g < 140 && b > 160 && Math.abs(r - b) < 60) {
      outPixels[destIdx] = 0;
      outPixels[destIdx + 1] = 0;
      outPixels[destIdx + 2] = 0;
      outPixels[destIdx + 3] = 0; // Transparent
      chromaCount++;
    } else {
      outPixels[destIdx] = r;
      outPixels[destIdx + 1] = g;
      outPixels[destIdx + 2] = b;
      outPixels[destIdx + 3] = a;
    }
  }
  console.log(`Replaced ${chromaCount} magenta pixels with transparency`);

  // 3. Re-encode pixel data back to PNG format using Filter 0 (None) and RGBA (6)
  const outScanlineLength = 1 + width * 4;
  const outDecompressed = Buffer.alloc(height * outScanlineLength);
  for (let y = 0; y < height; y++) {
    const outStart = y * outScanlineLength;
    outDecompressed[outStart] = 0; // Filter 0
    const pixelStart = y * width * 4;
    outPixels.copy(outDecompressed, outStart + 1, pixelStart, pixelStart + width * 4);
  }

  const outCompressed = zlib.deflateSync(outDecompressed);

  // 4. Assemble the output PNG
  const outBufs = [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])];

  // Modify IHDR to write RGBA (6) colorType
  const ihdr = chunks.find(c => c.type === 'IHDR');
  const newIhdrData = Buffer.from(ihdr.data);
  newIhdrData[9] = 6; // Set colorType = 6 (RGBA)
  writeChunk(outBufs, 'IHDR', newIhdrData);

  // Write other chunks (except IHDR, IDAT, IEND)
  for (const c of chunks) {
    if (c.type !== 'IHDR' && c.type !== 'IDAT' && c.type !== 'IEND') {
      writeChunk(outBufs, c.type, c.data);
    }
  }

  // Write new IDAT chunk
  writeChunk(outBufs, 'IDAT', outCompressed);

  // Write IEND chunk
  writeChunk(outBufs, 'IEND', Buffer.alloc(0));

  fs.writeFileSync(outputPath, Buffer.concat(outBufs));
  console.log(`Successfully wrote transparent PNG to ${outputPath}`);
}

function writeChunk(bufs, type, data) {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  
  const typeBuf = Buffer.from(type, 'ascii');
  
  const crc = calculateCrc(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  bufs.push(lenBuf, typeBuf, data, crcBuf);
}

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function calculateCrc(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const inputPath = 'C:\\Users\\ragha\\.gemini\\antigravity-ide\\brain\\7b475501-33f4-4cba-b4c5-297363e369bd\\gun_magenta_1783941850158.png';
const outputPath = 'public/assets/gun.png';
removeChroma(inputPath, outputPath);
