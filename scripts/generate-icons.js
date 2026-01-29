// Simple PNG icon generator for PWA
// Creates minimal valid PNG files using zlib

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');

// Ensure directory exists
mkdirSync(iconsDir, { recursive: true });

// Create a PNG with specified dimensions
function createPNG(width, height) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk (image header)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;   // bit depth
  ihdrData[9] = 2;   // color type (RGB)
  ihdrData[10] = 0;  // compression method
  ihdrData[11] = 0;  // filter method
  ihdrData[12] = 0;  // interlace method

  // Create image data (black background with green design)
  const greenColor = [0x22, 0xC5, 0x5E]; // Tailwind green-500
  const blackColor = [0x00, 0x00, 0x00];
  const darkGreen = [0x15, 0x80, 0x3D];  // Darker green

  const rawData = [];
  const centerX = width / 2;
  const centerY = height / 2;

  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter type: none
    for (let x = 0; x < width; x++) {
      // Calculate distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.min(width, height) / 2;

      // Create a star/spaceship pattern
      const normalizedY = y / height;
      const normalizedX = x / width;

      let color = blackColor;

      // Border
      if (x < 2 || x >= width - 2 || y < 2 || y >= height - 2) {
        color = greenColor;
      }
      // Central diamond/ship shape
      else if (Math.abs(dx) + Math.abs(dy) < maxDist * 0.5) {
        color = darkGreen;
      }
      // Star points
      else if (
        (Math.abs(dy) < 8 && dist < maxDist * 0.7) ||
        (Math.abs(dx) < 8 && dist < maxDist * 0.7)
      ) {
        color = greenColor;
      }
      // Diagonal accents
      else if (
        (Math.abs(Math.abs(dx) - Math.abs(dy)) < 6 && dist < maxDist * 0.6)
      ) {
        color = darkGreen;
      }

      rawData.push(...color);
    }
  }

  // Compress using zlib
  const compressed = deflateSync(Buffer.from(rawData), { level: 9 });

  // Build chunks
  const chunks = [];

  // IHDR chunk
  chunks.push(createChunk('IHDR', ihdrData));

  // IDAT chunk (image data)
  chunks.push(createChunk('IDAT', compressed));

  // IEND chunk
  chunks.push(createChunk('IEND', Buffer.alloc(0)));

  return Buffer.concat([signature, ...chunks]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 lookup table
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }
  return table;
})();

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate icons
const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 }
];

console.log('Generating PWA icons...');

for (const { name, size } of sizes) {
  const png = createPNG(size, size);
  const path = join(iconsDir, name);
  writeFileSync(path, png);
  console.log(`Created ${name} (${size}x${size})`);
}

// Also create favicon.ico (just copy the 192x192 as a simple ICO)
// For simplicity, we'll just copy the PNG
const favicon = createPNG(32, 32);
writeFileSync(join(iconsDir, '..', 'favicon.ico'), favicon);
console.log('Created favicon.ico (32x32)');

console.log('Done!');
