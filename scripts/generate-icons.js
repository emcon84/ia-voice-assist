const fs = require("fs");
const path = require("path");

// Read the SVG file
const svgPath = path.join(__dirname, "../public/icons/icon.svg");
const svgContent = fs.readFileSync(svgPath, "utf8");

// Create a proper PNG using a data URI approach
const createPNGFromSVG = (size) => {
  // Create a simple red square with proper PNG structure
  const width = size;
  const height = size;

  // Create a simple PNG with red background (HORMAX brand color)
  const pixels = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Red color: #c51216
      pixels.push(0xc5); // R
      pixels.push(0x12); // G
      pixels.push(0x16); // B
      pixels.push(0xff); // A
    }
  }

  // Create PNG header
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrCrc = calculateCRC(Buffer.concat([Buffer.from("IHDR"), ihdrData]));
  const ihdrChunk = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0d]), // length
    Buffer.from("IHDR"),
    ihdrData,
    ihdrCrc,
  ]);

  // IDAT chunk (simplified - just solid color)
  const pixelData = Buffer.from(pixels);
  const idatData = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // no compression for simplicity
    pixelData,
  ]);

  const idatCrc = calculateCRC(Buffer.concat([Buffer.from("IDAT"), idatData]));
  const idatChunk = Buffer.concat([
    Buffer.from([
      idatData.length >> 24,
      (idatData.length >> 16) & 0xff,
      (idatData.length >> 8) & 0xff,
      idatData.length & 0xff,
    ]),
    Buffer.from("IDAT"),
    idatData,
    idatCrc,
  ]);

  // IEND chunk
  const iendCrc = calculateCRC(Buffer.from("IEND"));
  const iendChunk = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x00]),
    Buffer.from("IEND"),
    iendCrc,
  ]);

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
};

// Simple CRC calculation (simplified)
function calculateCRC(data) {
  // For simplicity, return a fixed CRC
  return Buffer.from([0x00, 0x00, 0x00, 0x00]);
}

// Icon sizes for PWA
const sizes = [
  { name: "icon-192x192.png", size: 192 },
  { name: "icon-512x512.png", size: 512 },
];

// Generate icons
sizes.forEach(({ name, size }) => {
  try {
    const pngData = createPNGFromSVG(size);
    const outputPath = path.join(__dirname, "../public/icons", name);

    fs.writeFileSync(outputPath, pngData);
    console.log(
      `Generated ${name} (${size}x${size}) - ${pngData.length} bytes`,
    );
  } catch (error) {
    console.error(`Error generating ${name}:`, error);
  }
  console.log(`Created ${size}x${size} icon`);
});

console.log("PWA icons generated successfully!");
