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

// Inicializa o arquivo CSV se não existir
if (!fs.existsSync(CSV_FILE)) {
  const headers = 'Data/Hora;Nome;WhatsApp;Faixa de Renda;Capacidade de Pagamento;Monitoramento CPF;Relacionamento Bancario;URL\n';
  fs.writeFileSync(CSV_FILE, '\uFEFF' + headers, 'utf8'); // BOM UTF-8 para abrir perfeito no Excel
}

// Inicializa o arquivo JSON se não existir
if (!fs.existsSync(JSON_FILE)) {
  fs.writeFileSync(JSON_FILE, '[]', 'utf8');
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ENDPOINT DE RECEBIMENTO DE LEADS (POST /api/leads)
  if (req.url === '/api/leads' && req.method === 'POST') {
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
        const url = (lead.origem_url || '').replace(/;/g, ',');

        // Linha no CSV (separador ; para abrir no Excel do Brasil)
        const csvLine = `"${timestamp}";"${nome}";"${whatsapp}";"${renda}";"${capacidade}";"${cpf}";"${bancos}";"${url}"\n`;
        fs.appendFileSync(CSV_FILE, csvLine, 'utf8');

        // Adiciona ao JSON
        const leadsArr = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8') || '[]');
        leadsArr.push(lead);
        fs.writeFileSync(JSON_FILE, JSON.stringify(leadsArr, null, 2), 'utf8');

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

  // ENDPOINT DE LEITURA DE LEADS (GET /api/leads)
  if (req.url === '/api/leads' && req.method === 'GET') {
    const leadsData = fs.readFileSync(JSON_FILE, 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(leadsData);
    return;
  }

  // SERVIDOR DE ARQUIVOS ESTÁTICOS
  let reqPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
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
  console.log(`📁 Download Planilha CSV: http://localhost:${PORT}/leads.csv`);
});
