import "server-only";
import zlib from "zlib";

export interface ZipEntry {
  filename: string;
  data: Buffer | Uint8Array;
}

/**
 * Converts a standard Date to MS-DOS date and time format for ZIP headers.
 */
function toDosDateTime(d: Date): { time: number; date: number } {
  const time =
    ((d.getHours() & 0x1f) << 11) |
    ((d.getMinutes() & 0x3f) << 5) |
    ((Math.floor(d.getSeconds() / 2)) & 0x1f);

  const date =
    (((d.getFullYear() - 1980) & 0x7f) << 9) |
    (((d.getMonth() + 1) & 0x0f) << 5) |
    (d.getDate() & 0x1f);

  return { time, date };
}

/**
 * Creates a valid, standard ZIP archive Buffer containing the provided entries.
 * Uses built-in Node.js zlib.crc32 and zlib.deflateRawSync with zero external dependencies.
 */
export function createZipArchive(entries: ZipEntry[]): Buffer {
  const localHeaders: Buffer[] = [];
  const centralDirHeaders: Buffer[] = [];
  let currentOffset = 0;
  const now = new Date();
  const { time: dosTime, date: dosDate } = toDosDateTime(now);

  for (const entry of entries) {
    const rawBuffer = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data);
    const uncompressedSize = rawBuffer.length;
    const crc = zlib.crc32(rawBuffer);

    // Deflate compression
    let compressedData: Buffer;
    let compressionMethod = 8; // Deflate
    try {
      compressedData = zlib.deflateRawSync(rawBuffer);
      // If deflation actually increases size, fall back to Store (0)
      if (compressedData.length >= uncompressedSize) {
        compressedData = rawBuffer;
        compressionMethod = 0;
      }
    } catch {
      compressedData = rawBuffer;
      compressionMethod = 0;
    }

    const compressedSize = compressedData.length;
    const cleanFilename = entry.filename.replace(/\\/g, "/").replace(/^\/+/, "");
    const filenameBuf = Buffer.from(cleanFilename, "utf-8");

    // 1. Local File Header
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // general purpose flags
    localHeader.writeUInt16LE(compressionMethod, 8); // compression method
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressedSize, 18);
    localHeader.writeUInt32LE(uncompressedSize, 22);
    localHeader.writeUInt16LE(filenameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra field length

    const fullLocal = Buffer.concat([localHeader, filenameBuf, compressedData]);
    localHeaders.push(fullLocal);

    // 2. Central Directory Header
    const cdHeader = Buffer.alloc(46);
    cdHeader.writeUInt32LE(0x02014b50, 0); // signature
    cdHeader.writeUInt16LE(20, 4); // version made by
    cdHeader.writeUInt16LE(20, 6); // version needed
    cdHeader.writeUInt16LE(0, 8); // flags
    cdHeader.writeUInt16LE(compressionMethod, 10);
    cdHeader.writeUInt16LE(dosTime, 12);
    cdHeader.writeUInt16LE(dosDate, 14);
    cdHeader.writeUInt32LE(crc, 16);
    cdHeader.writeUInt32LE(compressedSize, 20);
    cdHeader.writeUInt32LE(uncompressedSize, 24);
    cdHeader.writeUInt16LE(filenameBuf.length, 28);
    cdHeader.writeUInt16LE(0, 30); // extra length
    cdHeader.writeUInt16LE(0, 32); // comment length
    cdHeader.writeUInt16LE(0, 34); // disk start
    cdHeader.writeUInt16LE(0, 36); // internal attrs
    cdHeader.writeUInt32LE(0, 38); // external attrs
    cdHeader.writeUInt32LE(currentOffset, 42); // relative offset of local header

    const fullCd = Buffer.concat([cdHeader, filenameBuf]);
    centralDirHeaders.push(fullCd);

    currentOffset += fullLocal.length;
  }

  const localSection = Buffer.concat(localHeaders);
  const cdSection = Buffer.concat(centralDirHeaders);

  // 3. End of Central Directory Record
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // start disk
  eocd.writeUInt16LE(entries.length, 8); // entries on disk
  eocd.writeUInt16LE(entries.length, 10); // total entries
  eocd.writeUInt32LE(cdSection.length, 12); // size of central directory
  eocd.writeUInt32LE(localSection.length, 16); // offset of central directory
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([localSection, cdSection, eocd]);
}
