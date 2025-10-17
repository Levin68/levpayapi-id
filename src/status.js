import fetch from 'node-fetch';

/**
 * Normalisasi status:
 * - Kalau ada env STATUS_URL → proxy ke sana: `${STATUS_URL}?reference=...&amount=...`
 *   → expected balikan: { success: true, data: { status: 'PAID'|'PENDING' } } atau {status:'PAID'}
 * - Kalau STATUS_URL kosong → fallback PENDING (dummy).
 */
export async function checkStatus(reference, amount) {
  const url = process.env.STATUS_URL;
  if (!url) {
    return { reference, amount, status: 'PENDING' };
  }
  const u = `${url}?reference=${encodeURIComponent(reference)}&amount=${encodeURIComponent(amount)}`;
  const r = await fetch(u, { headers: { 'Accept': 'application/json' } });
  let j = {};
  try { j = await r.json(); } catch { /* ignore */ }

  if (!r.ok) throw new Error(j?.message || `checker non-200: ${r.status}`);
  const raw = (j?.data?.status || j?.status || 'PENDING').toString().toUpperCase();
  const status = (raw === 'PAID' || raw === 'SUCCESS' || raw === 'SETTLEMENT') ? 'PAID' : 'PENDING';

  return { reference, amount, status };
}