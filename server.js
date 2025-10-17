import express from 'express';
import cors from 'cors';
import qris from './src/qris.js';
import { checkStatus } from './src/status.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// health
app.get('/', (req, res) => {
  res.json({
    ok: true,
    name: 'LevPay Backend',
    endpoints: ['/api/qr/create', '/api/qr/status']
  });
});

// create QR (GET quick test, POST production)
app.get('/api/qr/create', async (req, res) => {
  try {
    const amount = Number(req.query.amount || 0);
    if (!amount) {
      return res.json({
        success: true,
        info: 'Use POST to create QR. Quick test: /api/qr/create?amount=1000',
        store: process.env.STORE_NAME || 'LevPay'
      });
    }
    const reference = 'REF' + Date.now();
    const qris = qris.buildQRIS({
      base: process.env.BASE_QR_STRING,
      amount,
      reference
    });
    const size = Number(process.env.QR_IMG_SIZE || 520);
    const qr_image_url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qris)}`;
    
    return res.json({
      success: true,
      store: process.env.STORE_NAME || 'LevPay',
      reference,
      amount,
      qris,
      qr_image_url
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || 'internal error' });
  }
});

app.post('/api/qr/create', async (req, res) => {
  try {
    const { amount, meta } = req.body || {};
    const amt = Number(amount);
    if (!amt || amt < 1) return res.status(400).json({ success: false, message: 'amount minimal 1' });
    
    // optional: hanya warning kalau auth kosong (dipakai oleh checker eksternal)
    if (!process.env.AUTH_USERNAME || !process.env.AUTH_TOKEN) {
      console.warn('[WARN] AUTH_USERNAME/AUTH_TOKEN kosong — hanya generate QR.');
    }
    
    const reference = 'REF' + Date.now();
    const qrisStr = qris.buildQRIS({
      base: process.env.BASE_QR_STRING,
      amount: amt,
      reference
    });
    const size = Number(process.env.QR_IMG_SIZE || 520);
    const qr_image_url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrisStr)}`;
    
    return res.json({
      success: true,
      store: process.env.STORE_NAME || 'LevPay',
      reference,
      amount: amt,
      meta: meta || null,
      qris: qrisStr,
      qr_image_url
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || 'internal error' });
  }
});

// status
app.get('/api/qr/status', async (req, res) => {
  try {
    const { reference, amount } = req.query;
    if (!reference || !amount) {
      return res.status(400).json({ success: false, message: 'reference & amount required' });
    }
    const data = await checkStatus(String(reference), Number(amount));
    return res.json({ success: true, data });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || 'internal error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LevPay backend listening on :${PORT}`);
});