const { Buffer } = require('buffer');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let i = 0; i < 256; i += 1) {
    let crc = i;

    for (let j = 0; j < 8; j += 1) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }

    table[i] = crc >>> 0;
  }

  return table;
})();

const crc32 = (buffer) => {
  let crc = 0xFFFFFFFF;

  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xFF] ^ (crc >>> 8);
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
};

const sanitizeZipPath = (value) => {
  return String(value || 'archivo')
    .replace(/\\/g, '/')
    .replace(/(^|\/)\.\.(?=\/|$)/g, '')
    .replace(/[\u0000-\u001F]/g, '')
    .replace(/^\/+/, '')
    .trim() || 'archivo';
};

const getDosDateTime = (date = new Date()) => {
  const value = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();

  const year = Math.max(1980, value.getFullYear());
  const month = value.getMonth() + 1;
  const day = value.getDate();
  const hours = value.getHours();
  const minutes = value.getMinutes();
  const seconds = Math.floor(value.getSeconds() / 2);

  return {
    dosTime: (hours << 11) | (minutes << 5) | seconds,
    dosDate: ((year - 1980) << 9) | (month << 5) | day
  };
};

class ZipStream {
  constructor(stream) {
    this.stream = stream;
    this.offset = 0;
    this.entries = [];
    this.finalized = false;
  }

  write(buffer) {
    this.stream.write(buffer);
    this.offset += buffer.length;
  }

  async addFile(fileName, content, options = {}) {
    if (this.finalized) {
      throw new Error('No se puede agregar archivos después de cerrar el ZIP');
    }

    const normalizedName = sanitizeZipPath(fileName);
    const nameBuffer = Buffer.from(normalizedName, 'utf8');
    const data = Buffer.isBuffer(content)
      ? content
      : Buffer.from(String(content ?? ''), 'utf8');
    const checksum = crc32(data);
    const size = data.length;
    const { dosTime, dosDate } = getDosDateTime(options.date || new Date());
    const localHeaderOffset = this.offset;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 file names
    localHeader.writeUInt16LE(0, 8); // stored, no compression
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(size, 18);
    localHeader.writeUInt32LE(size, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    this.write(localHeader);
    this.write(nameBuffer);
    this.write(data);

    this.entries.push({
      nameBuffer,
      checksum,
      size,
      dosTime,
      dosDate,
      localHeaderOffset
    });
  }

  async finalize() {
    if (this.finalized) return;

    this.finalized = true;
    const centralDirectoryStart = this.offset;

    for (const entry of this.entries) {
      const centralHeader = Buffer.alloc(46);
      centralHeader.writeUInt32LE(0x02014b50, 0);
      centralHeader.writeUInt16LE(20, 4);
      centralHeader.writeUInt16LE(20, 6);
      centralHeader.writeUInt16LE(0x0800, 8);
      centralHeader.writeUInt16LE(0, 10);
      centralHeader.writeUInt16LE(entry.dosTime, 12);
      centralHeader.writeUInt16LE(entry.dosDate, 14);
      centralHeader.writeUInt32LE(entry.checksum, 16);
      centralHeader.writeUInt32LE(entry.size, 20);
      centralHeader.writeUInt32LE(entry.size, 24);
      centralHeader.writeUInt16LE(entry.nameBuffer.length, 28);
      centralHeader.writeUInt16LE(0, 30);
      centralHeader.writeUInt16LE(0, 32);
      centralHeader.writeUInt16LE(0, 34);
      centralHeader.writeUInt16LE(0, 36);
      centralHeader.writeUInt32LE(0, 38);
      centralHeader.writeUInt32LE(entry.localHeaderOffset, 42);

      this.write(centralHeader);
      this.write(entry.nameBuffer);
    }

    const centralDirectorySize = this.offset - centralDirectoryStart;
    const endRecord = Buffer.alloc(22);
    endRecord.writeUInt32LE(0x06054b50, 0);
    endRecord.writeUInt16LE(0, 4);
    endRecord.writeUInt16LE(0, 6);
    endRecord.writeUInt16LE(this.entries.length, 8);
    endRecord.writeUInt16LE(this.entries.length, 10);
    endRecord.writeUInt32LE(centralDirectorySize, 12);
    endRecord.writeUInt32LE(centralDirectoryStart, 16);
    endRecord.writeUInt16LE(0, 20);

    this.write(endRecord);
    this.stream.end();
  }
}

module.exports = ZipStream;
