const { createClient } = require('@supabase/supabase-js');

let leadsStore = [
  {
    data_registro: new Date().toLocaleString('pt-BR'),
    nome: 'Exemplo Prosperus',
    whatsapp: '(11) 99999-9999',
    faixa_renda: 'Acima de R$ 10.000',
    capacidade_pagamento: 'Sim, sei exatamente o valor disponível',
    monitoramento_cpf: 'Sim, acompanho com frequência',
    relacionamento_bancario: 'De 2 a 3 instituições',
    origem_url: 'https://prosperus-quiz.vercel.app/'
  }
];

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const supabase = getSupabaseClient();

  // POST: RECEBE E SALVA O LEAD (SUPABASE + FALLBACK)
  if (req.method === 'POST') {
    try {
      const lead = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      
      const leadRecord = {
        data_registro: lead.data_registro || new Date().toLocaleString('pt-BR'),
        nome: lead.nome || '',
        whatsapp: lead.whatsapp || '',
        faixa_renda: lead.faixa_renda || '',
        capacidade_pagamento: lead.capacidade_pagamento || '',
        monitoramento_cpf: lead.monitoramento_cpf || '',
        relacionamento_bancario: lead.relacionamento_bancario || '',
        cpf_cnpj: lead.cpf_cnpj || lead.documento || '',
        origem_url: lead.origem_url || 'https://prosperus-quiz.vercel.app/'
      };

      console.log('📊 [PROSPERUS LEAD CAPTURED]:', leadRecord);

      // Tenta salvar na tabela 'leads' do Supabase
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('leads')
            .insert([leadRecord]);

          if (error) console.error('❌ Supabase Insert Error:', error.message);
          else console.log('✅ Lead inserido com sucesso no Supabase!');
        } catch (spErr) {
          console.error('❌ Supabase Exceção:', spErr);
        }
      }

      // Armazena no fallback local
      leadsStore.push(leadRecord);
      if (leadsStore.length > 500) leadsStore.shift();

      // Webhook fallback para Google Sheets
      const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK;
      if (webhookUrl && webhookUrl.trim() !== '') {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadRecord)
          });
        } catch (webhookErr) {
          console.warn('⚠️ Erro no Webhook:', webhookErr);
        }
      }

      return res.status(200).json({
        status: 'success',
        message: 'Lead capturado com sucesso!',
        lead: leadRecord
      });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  // GET: CONSULTA LEADS (SUPABASE OU FALLBACK LOCAL)
  let currentLeads = leadsStore;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('id', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        currentLeads = data;
      }
    } catch (err) {
      console.warn('⚠️ Falha ao buscar leads do Supabase, usando fallback local:', err.message);
    }
  }

  const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
  if (urlParams.get('format') === 'csv') {
    let csvContent = '\uFEFF"Data e Hora";"Nome Completo";"WhatsApp";"Faixa de Renda";"Capacidade Mensal de Pagamento";"Acompanha CPF/Score?";"Quantidade de Bancos";"CPF/CNPJ";"Página de Origem"\n';
    currentLeads.forEach(item => {
      const row = [
        `"${item.data_registro || ''}"`,
        `"${(item.nome || '').replace(/"/g, '""')}"`,
        `"${(item.whatsapp || '').replace(/"/g, '""')}"`,
        `"${(item.faixa_renda || '').replace(/"/g, '""')}"`,
        `"${(item.capacidade_pagamento || '').replace(/"/g, '""')}"`,
        `"${(item.monitoramento_cpf || '').replace(/"/g, '""')}"`,
        `"${(item.relacionamento_bancario || '').replace(/"/g, '""')}"`,
        `"${(item.cpf_cnpj || item.documento || '').replace(/"/g, '""')}"`,
        `"${(item.origem_url || '').replace(/"/g, '""')}"`
      ].join(';');
      csvContent += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    return res.status(200).send(csvContent);
  }

  return res.status(200).json(currentLeads);
};
