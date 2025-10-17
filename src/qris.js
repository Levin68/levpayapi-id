// Util CRC16-CCITT (0x1021, init 0xFFFF) – input: HEX string
function crc16ccitt(hexStr) {
  let crc = 0xffff;
  for (let i = 0; i < hexStr.length; i += 2) {
    const byte = parseInt(hexStr.substr(i, 2), 16);
    crc ^= (byte << 8);
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// ASCII -> HEX
function asciiToHex(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) out += s.charCodeAt(i).toString(16).padStart(2, '0');
  return out.toUpperCase();
}

// TLV helpers
function parseTLV(s) {
  const map = new Map();
  let i = 0;
  while (i + 4 <= s.length) {
    const id = s.substr(i, 2);
    const len = parseInt(s.substr(i + 2, 2), 10);
    const start = i + 4;
    const end = start + len;
    if (isNaN(len) || end > s.length) break;
    const val = s.substring(start, end);
    map.set(id, val);
    i = end;
  }
  return map;
}
function tlvSerialize(map) {
  let out = '';
  for (const [id, val] of map.entries()) {
    out += id + String(val.length).padStart(2, '0') + val;
  }
  return out;
}
const tlvGet = (m, id) => (m.has(id) ? m.get(id) : null);
const tlvPut = (m, id, val) => m.set(id, String(val ?? ''));
const tlvDel = (m, id) => m.delete(id);

// Build QRIS dinamis dari base QR statik
function buildQRIS({ base, amount, reference }) {
  if (!base) throw new Error('BASE_QR_STRING kosong');
  const amtStr = String(Math.round(Number(amount) || 0));
  if (!/^\d+$/.test(amtStr) || Number(amtStr) < 1) throw new Error('amount minimal 1 (angka)');

  // buang CRC lama
  let raw = base.trim().replace(/6304[0-9A-Fa-f]{4}$/, '');

  // force dynamic (01=12) jika base masih 010211
  raw = raw.replace(/^000201010211/, '000201010212');

  // parse TLV
  const tlvs = parseTLV(raw);

  // paksa 01=12
  tlvPut(tlvs, '01', '12');

  // nominal (54)
  tlvPut(tlvs, '54', amtStr);

  // additional data (62/01 = reference label)
  const tag62raw = tlvGet(tlvs, '62') || '';
  const tag62map = parseTLV(tag62raw);
  tlvPut(tag62map, '01', reference);
  const tag62str = tlvSerialize(tag62map);
  tlvPut(tlvs, '62', tag62str);

  // hapus CRC (63) sebelum hitung ulang
  tlvDel(tlvs, '63');
  const noCRC = tlvSerialize(tlvs);

  // re-CRC atas ASCII + '6304'
  const forCRC = noCRC + '6304';
  const crc = crc16ccitt(asciiToHex(forCRC));

  return forCRC + crc;
}

export default {
  buildQRIS
};