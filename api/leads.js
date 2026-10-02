module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'POST') {
    const lead = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    console.log('📊 [PROSPERUS VERCEL LEAD CAPTURED]:', lead);

    return res.status(200).json({
      status: 'success',
      message: 'Lead recebido e registrado com sucesso!',
      lead: lead
    });
  }

  return res.status(200).json({
    status: 'online',
    service: 'Prosperus Inteligência Financeira Lead API'
  });
};
