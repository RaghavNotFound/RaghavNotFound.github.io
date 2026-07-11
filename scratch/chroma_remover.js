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
      // Keep other chunks
      chunks.push({ type, data: buf.slice(offset + 8, offset + 8 + length) });
    }
    offset += 12 + length;
  }

  if (colorType !== 6 || bitDepth !== 8) {
    throw new Error('Only 8-bit RGBA PNG files are supported for chroma keying');
  }

  const compressed = Buffer.concat(idatBuffers);
  const decompressed = zlib.inflateSync(compressed);

  const scanlineLength = 1 + width * 4;
  const pixels = Buffer.alloc(width * height * 4);
  const bytesPerPixel = 4;

  // 1. Reconstruct PNG filters to get raw RGBA pixels
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

  // 2. Remove Magenta chroma key (R > 220, G < 60, B > 220) or similar
  let chromaCount = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    
    // Check if pixel is close to magenta (Chroma key)
    if (r > 180 && g < 100 && b > 180) {
      pixels[i] = 0;
      pixels[i + 1] = 0;
      pixels[i + 2] = 0;
      pixels[i + 3] = 0; // Transparent
      chromaCount++;
    }
  }
  console.log(`Replaced ${chromaCount} magenta pixels with transparency`);

  // 3. Re-encode pixel data back to PNG format using Filter 0 (None) for simplicity
  const outDecompressed = Buffer.alloc(height * scanlineLength);
  for (let y = 0; y < height; y++) {
    const outStart = y * scanlineLength;
    outDecompressed[outStart] = 0; // Filter 0
    const pixelStart = y * width * 4;
    pixels.copy(outDecompressed, outStart + 1, pixelStart, pixelStart + width * 4);
  }

  const outCompressed = zlib.deflateSync(outDecompressed);

  // 4. Assemble the output PNG
  const outBufs = [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])];

  // Write IHDR chunk first
  const ihdr = chunks.find(c => c.type === 'IHDR');
  writeChunk(outBufs, 'IHDR', ihdr.data);

  // Write other chunks (except IHDR, IDAT, IEND)
  for (const c of chunks) {
    if (c.type !== 'IHDR' && c.type !== 'IEND') {
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
  
  // Calculate CRC over type and data
  const crc = calculateCrc(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  bufs.push(lenBuf, typeBuf, data, crcBuf);
}

// CRC-32 implementation
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

const inputPath = 'C:/Users/ragha/.gemini/antigravity/brain/a39854f8-01fe-4cbb-9b13-4595e223f08d/gun_chroma_1783808867393.png';
const outputPath = 'assets/gun.png';
removeChroma(inputPath, outputPath);
