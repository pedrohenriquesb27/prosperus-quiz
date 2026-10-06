const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const CSV_FILE = path.join(__dirname, 'leads.csv');
const JSON_FILE = path.join(__dirname, 'leads.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.csv': 'text/csv; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const CSV_HEADERS = '"Data e Hora";"Nome Completo";"WhatsApp";"Faixa de Renda";"Capacidade Mensal de Pagamento";"Acompanha CPF/Score?";"Quantidade de Bancos";"CPF/CNPJ";"Página de Origem"\n';

// Inicializa o arquivo CSV se não existir (ignora erros em ambientes read-only como Vercel)
try {
  if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, '\uFEFF' + CSV_HEADERS, 'utf8');
  }
} catch (err) {
  console.warn('⚠️ FS Write warning (CSV_FILE):', err.message);
}

// Inicializa o arquivo JSON se não existir
try {
  if (!fs.existsSync(JSON_FILE)) {
    fs.writeFileSync(JSON_FILE, '[]', 'utf8');
  }
} catch (err) {
  console.warn('⚠️ FS Write warning (JSON_FILE):', err.message);
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = req.url || '';

  // ENDPOINT DE RECEBIMENTO DE LEADS (POST /api/leads)
  if (reqUrl.startsWith('/api/leads') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const lead = JSON.parse(body || '{}');
        const timestamp = lead.data_registro || new Date().toLocaleString('pt-BR');
        const nome = (lead.nome || '').replace(/;/g, ',');
        const whatsapp = (lead.whatsapp || '').replace(/;/g, ',');
        const renda = (lead.faixa_renda || '').replace(/;/g, ',');
        const capacidade = (lead.capacidade_pagamento || '').replace(/;/g, ',');
        const cpf = (lead.monitoramento_cpf || '').replace(/;/g, ',');
        const bancos = (lead.relacionamento_bancario || '').replace(/;/g, ',');
        const cpfCnpj = (lead.cpf_cnpj || lead.documento || '').replace(/;/g, ',');
        const url = (lead.origem_url || '').replace(/;/g, ',');

        const csvLine = `"${timestamp}";"${nome}";"${whatsapp}";"${renda}";"${capacidade}";"${cpf}";"${bancos}";"${cpfCnpj}";"${url}"\n`;
        try { fs.appendFileSync(CSV_FILE, csvLine, 'utf8'); } catch (e) {}

        let leadsArr = [];
        try {
          leadsArr = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8') || '[]');
        } catch(e) { leadsArr = []; }
        
        leadsArr.push(lead);
        try { fs.writeFileSync(JSON_FILE, JSON.stringify(leadsArr, null, 2), 'utf8'); } catch (e) {}

        console.log(`📌 [NOVO LEAD CAPTURADO]: ${nome} - ${whatsapp}`);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ status: 'success', message: 'Lead registrado com sucesso em leads.csv' }));
      } catch (err) {
        console.error('Erro ao processar lead:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ status: 'error', message: err.message }));
      }
    });
    return;
  }

  // ENDPOINT DE LEITURA DE LEADS (GET /api/leads ou /api/leads?format=csv)
  if (reqUrl.startsWith('/api/leads') && req.method === 'GET') {
    if (reqUrl.includes('format=csv')) {
      let csvData = CSV_HEADERS;
      try { csvData = fs.readFileSync(CSV_FILE, 'utf8'); } catch (e) {}
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8' });
      res.end(csvData);
      return;
    }

    let leadsData = '[]';
    try { leadsData = fs.readFileSync(JSON_FILE, 'utf8'); } catch (e) {}
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(leadsData);
    return;
  }

  // SERVIDOR DE ARQUIVOS ESTÁTICOS
  let cleanPath = reqUrl.split('?')[0];
  let reqPath = cleanPath === '/' ? '/index.html' : cleanPath;
  if (reqPath === '/admin' || reqPath === '/login' || reqPath.startsWith('/admin')) reqPath = '/admin.html';
  let targetFile = path.join(__dirname, reqPath);

  fs.readFile(targetFile, (err, content) => {
    if (err) {
      fs.readFile(path.join(__dirname, 'index.html'), (indexErr, indexContent) => {
        if (indexErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Erro ao carregar index.html: ' + indexErr.message);
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(indexContent);
        }
      });
    } else {
      let ext = path.extname(targetFile).toLowerCase();
      let contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor da Prosperus ativo em http://localhost:${PORT}`);
  console.log(`📊 Endpoint de Leads: http://localhost:${PORT}/api/leads`);
  console.log(`📁 Planilha CSV Google Sheets: http://localhost:${PORT}/api/leads?format=csv`);
});
