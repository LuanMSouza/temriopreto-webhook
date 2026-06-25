export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { event, payment } = req.body;
  if (event !== 'PAYMENT_CONFIRMED' && event !== 'PAYMENT_RECEIVED') {
    return res.status(200).json({ ok: true });
  }
  const listingId = payment?.externalReference;
  if (!listingId) {
    return res.status(400).json({ error: 'No externalReference' });
  }
  const wpUrl = process.env.WP_URL;
  const user = process.env.WP_USER;
  const pass = process.env.WP_APP_PASSWORD;
  const credentials = Buffer.from(`${user}:${pass}`).toString('base64');
  const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts/${listingId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      meta: { _rtcl_featured: true }
    }),
  });
  const wpResponse = await response.json();
  console.log('WP response:', JSON.stringify(wpResponse));
  if (!response.ok) {
    return res.status(500).json({ error: 'WP update failed', details: wpResponse });
  }
  return res.status(200).json({ ok: true });
}
