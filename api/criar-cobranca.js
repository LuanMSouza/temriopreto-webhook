export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { listingId, customerName, customerEmail, customerCpf } = req.body;

  if (!listingId || !customerName || !customerEmail || !customerCpf) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const asaasToken = process.env.ASAAS_TOKEN;

  // Primeiro cria ou busca o cliente no Asaas
  const customerRes = await fetch('https://api.asaas.com/v3/customers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': asaasToken,
    },
    body: JSON.stringify({
      name: customerName,
      email: customerEmail,
      cpfCnpj: customerCpf,
    }),
  });

  const customer = await customerRes.json();

  if (!customer.id) {
    return res.status(500).json({ error: 'Erro ao criar cliente no Asaas' });
  }

  // Cria a cobrança
  const chargeRes = await fetch('https://api.asaas.com/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': asaasToken,
    },
    body: JSON.stringify({
      customer: customer.id,
      billingType: 'UNDEFINED',
      value: 9.99,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Anúncio Destacado - Tem Rio Preto',
      externalReference: String(listingId),
    }),
  });

  const charge = await chargeRes.json();

  if (!charge.invoiceUrl) {
    return res.status(500).json({ error: 'Erro ao criar cobrança' });
  }

  return res.status(200).json({ paymentUrl: charge.invoiceUrl });
}
