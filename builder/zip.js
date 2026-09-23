// A zip file, written by hand. Browsers block a page that fires off several
// downloads at once, so everything the builder produces goes out in one.
// Stored (uncompressed) entries only — a card is small and this keeps the
// whole thing to about eighty lines with no library.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// MS-DOS date and time, which is what the format still wants.
function dosStamp(date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

/**
 * @param {{name: string, bytes: Uint8Array}[]} files
 * @returns {Blob} a zip, ready to download
 */
export function makeZip(files) {
  const encoder = new TextEncoder();
  const { time, day } = dosStamp();
  const locals = [];
  const central = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const body = file.bytes;
    const sum = crc32(body);

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);     // local file header
    lv.setUint16(4, 20, true);             // version needed
    lv.setUint16(6, 0, true);              // flags
    lv.setUint16(8, 0, true);              // stored, no compression
    lv.setUint16(10, time, true);
    lv.setUint16(12, day, true);
    lv.setUint32(14, sum, true);
    lv.setUint32(18, body.length, true);   // compressed size
    lv.setUint32(22, body.length, true);   // uncompressed size
    lv.setUint16(26, name.length, true);
    local.set(name, 30);
    locals.push(local, body);

    const entry = new Uint8Array(46 + name.length);
    const cv = new DataView(entry.buffer);
    cv.setUint32(0, 0x02014b50, true);     // central directory header
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, day, true);
    cv.setUint32(16, sum, true);
    cv.setUint32(20, body.length, true);
    cv.setUint32(24, body.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);        // where its local header sits
    entry.set(name, 46);
    central.push(entry);

    offset += local.length + body.length;
  }

  const centralSize = central.reduce((n, part) => n + part.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);       // end of central directory
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  return new Blob([...locals, ...central, end], { type: "application/zip" });
}

export function textBytes(text) {
  return new TextEncoder().encode(text);
}
