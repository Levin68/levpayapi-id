# LevPay Backend (Express)

## ENV
- BASE_QR_STRING (wajib)
- AUTH_USERNAME, AUTH_TOKEN (opsional)
- STORE_NAME (opsional)
- QR_IMG_SIZE (default 520)
- STATUS_URL (opsional) → kalau ada, /api/qr/status akan proxy ke sini

## Jalankan lokal
npm install
cp .env.example .env   # edit nilainya
npm start   # http://localhost:3000

## Endpoint
- POST /api/qr/create  body: { amount: 1000, meta?: {...} }
- GET  /api/qr/create?amount=1000  (quick test)
- GET  /api/qr/status?reference=REF123&amount=1000

## Contoh curl
curl -sS -X POST http://localhost:3000/api/qr/create \
  -H "Content-Type: application/json" \
  -d '{"amount":1000,"meta":{"nama":"Levin","note":"Test"}}' | jq

curl -sS "http://localhost:3000/api/qr/status?reference=REF1739&amount=1000" | jq