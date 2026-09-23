// Write a character card into a PNG the way SillyTavern (and Chub, and the rest)
// read it: a tEXt chunk holding base64 JSON. Done here in the browser — no
// upload, no service, the file never leaves the machine.

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

function textChunk(keyword, value) {
  const key = new TextEncoder().encode(keyword);
  const val = new TextEncoder().encode(value);
  const data = new Uint8Array(key.length + 1 + val.length);
  data.set(key, 0);
  data[key.length] = 0;                       // null separator
  data.set(val, key.length + 1);

  const type = new TextEncoder().encode("tEXt");
  const body = new Uint8Array(type.length + data.length);
  body.set(type, 0);
  body.set(data, type.length);

  const chunk = new Uint8Array(4 + body.length + 4);
  new DataView(chunk.buffer).setUint32(0, data.length);
  chunk.set(body, 4);
  new DataView(chunk.buffer).setUint32(4 + body.length, crc32(body));
  return chunk;
}

// base64 that survives non-ASCII (curly quotes, corner brackets, em dashes)
function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * Put the card JSON into a PNG.
 * Keeps every original chunk except old card chunks, which get replaced.
 */
export function embedCard(pngBytes, card) {
  const view = new DataView(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength);
  const out = [pngBytes.slice(0, 8)];                       // signature
  const json = JSON.stringify(card);
  const v2 = { ...card, spec: "chara_card_v2", spec_version: "2.0" };

  let offset = 8;
  let wrote = false;
  while (offset < pngBytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...pngBytes.slice(offset + 4, offset + 8));
    const whole = pngBytes.slice(offset, offset + 12 + length);

    if (type === "tEXt") {
      const body = pngBytes.slice(offset + 8, offset + 8 + length);
      const keyword = String.fromCharCode(...body.slice(0, body.indexOf(0)));
      if (keyword === "chara" || keyword === "ccv3") { offset += 12 + length; continue; }
    }
    if (type === "IEND" && !wrote) {
      out.push(textChunk("chara", toBase64(JSON.stringify(v2))));   // what older tools read
      out.push(textChunk("ccv3", toBase64(json)));                  // the current spec
      wrote = true;
    }
    out.push(whole);
    offset += 12 + length;
    if (type === "IEND") break;
  }

  const size = out.reduce((n, part) => n + part.length, 0);
  const merged = new Uint8Array(size);
  let at = 0;
  for (const part of out) { merged.set(part, at); at += part.length; }
  return merged;
}

/** Re-encode anything the browser can open (jpg, webp, png) as PNG bytes. */
export async function toPngBytes(dataUrl, maxSide = 1024) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That image could not be read."));
    img.src = dataUrl;
  });
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  return new Uint8Array(await blob.arrayBuffer());
}
