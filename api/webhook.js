export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- 1. SEGURANÇA: valida o token do Asaas ---
  const tokenRecebido = req.headers['asaas-access-token'];
  const tokenEsperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (tokenEsperado && tokenRecebido !== tokenEsperado) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { event, payment } = req.body || {};

  if (event !== 'PAYMENT_CONFIRMED' && event !== 'PAYMENT_RECEIVED') {
    return res.status(200).json({ ok: true, ignored: event });
  }

  const listingId = payment?.externalReference;

  if (!listingId) {
    return res.status(200).json({ ok: true, skipped: 'no externalReference' });
  }

  const wpUrl = process.env.WP_URL;
  const user = process.env.WP_USER;
  const pass = process.env.WP_APP_PASSWORD;
  const credentials = Buffer.from(`${user}:${pass}`).toString('base64');

  try {
    const response = await fetch(`${wpUrl}/wp-json/dvls/v1/feature-listing/${listingId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const wpResponse = await response.json().catch(() => ({}));
    console.log('WP response:', response.status, JSON.stringify(wpResponse));

    if (!response.ok) {
      return res.status(500).json({ error: 'WP update failed', status: response.status, details: wpResponse });
    }

    return res.status(200).json({ ok: true, listingId });
  } catch (err) {
    console.error('Erro ao chamar WP:', err?.message || err);
    return res.status(500).json({ error: 'WP request threw', message: err?.message || String(err) });
  }
}
