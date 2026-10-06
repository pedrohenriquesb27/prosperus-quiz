const { createClient } = require('@supabase/supabase-js');

let visitsStore = [];

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key && url !== 'https://seu-projeto.supabase.co' && !url.includes('COLE_SUA_URL')) {
    try {
      return createClient(url, key);
    } catch (e) {
      console.warn('⚠️ Supabase client init error:', e.message);
    }
  }
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const supabase = getSupabaseClient();

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const userAgent = req.headers['user-agent'] || '';
      const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || (req.socket && req.socket.remoteAddress) || '127.0.0.1';

      const visitRecord = {
        timestamp: new Date().toISOString(),
        data_registro: new Date().toLocaleString('pt-BR'),
        ip,
        user_agent: userAgent,
        url: body.url || '',
        referrer: body.referrer || '',
        utm_source: body.utm_source || '',
        utm_medium: body.utm_medium || '',
        utm_campaign: body.utm_campaign || '',
        utm_content: body.utm_content || '',
        utm_term: body.utm_term || '',
        src: body.src || '',
        sck: body.sck || '',
        vid: body.vid || ''
      };

      console.log('📊 [PROSPERUS VISIT TRACKED]:', visitRecord);

      if (supabase) {
        try {
          await supabase.from('visits').insert([visitRecord]);
        } catch (spErr) {
          console.warn('⚠️ Supabase Visit Insert Warning:', spErr.message);
        }
      }

      visitsStore.push(visitRecord);
      if (visitsStore.length > 500) visitsStore.shift();

      return res.status(200).json({ status: 'ok', tracked: true, data: visitRecord });
    } catch (err) {
      return res.status(500).json({ status: 'error', tracked: false, message: err.message });
    }
  }

  return res.status(200).json({ status: 'ok', service: 'Prosperus Track Visit API', visitsCount: visitsStore.length });
};
