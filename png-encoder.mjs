import { deflateSync } from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_unused, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, checksum]);
}

export function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const stride = width * 4 + 1;
  const rows = Buffer.alloc(stride * height);
  for (let row = 0; row < height; row += 1) {
    rows[row * stride] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + row * width * 4, width * 4).copy(rows, row * stride + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export function encodeIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const pngBuffers = images.map((image) => encodePng(image.width, image.height, image.pixels));
  let dataOffset = header.length + images.length * 16;
  const entries = images.map((image, index) => {
    const entry = Buffer.alloc(16);
    entry[0] = image.width >= 256 ? 0 : image.width;
    entry[1] = image.height >= 256 ? 0 : image.height;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(pngBuffers[index].length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    dataOffset += pngBuffers[index].length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngBuffers]);
}
