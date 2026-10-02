# Prosperus Inteligência Financeira - Check-up & Quiz Funnel

Landing Page moderna, responsiva e otimizada para alta conversão (Growth Hacking) para captação de leads e venda direta do **Check-up Financeiro Completo** por R$ 99,00.

## 🚀 Tecnologias Utilizadas
- **HTML5 & Vanilla JavaScript**: Sem frameworks pesados, carregamento instantâneo.
- **Tailwind CSS (CDN)**: Design System com fundo off-white (`#F5F3EF`), Verde Corporativo (`#062E20`) e Dourado Nobre (`#C59B27`).
- **Node.js Native Server & Vercel Functions**: Backend leve para recepção e gravação automática de leads em CSV e JSON.

## 📋 Funcionalidades
- **Hero Section**: Copywriting focado na dor do empresário e pagador pontual.
- **Quiz de 6 Etapas**: Captura de Nome, WhatsApp (com máscara), Renda, Capacidade de Pagamento, Monitoramento de CPF e Quantidade de Bancos.
- **Simulação Animada de Análise (3s)**: Radar animado e mensagens dinâmicas personalizadas com o nome do cliente.
- **Tela de Revelação de Trava**: Explicação clara do **Rating Bancário Interno (AAA a CCC)** e do **Registrato do BACEN (SCR)**.
- **Oferta de R$ 99,00**: Botão direto para checkout da Greenn.
- **Integração de Leads (API / CSV / Webhook)**: Registra os leads automaticamente em `leads.csv` e dispara requisição assíncrona ao Webhook configurado.

## ⚙️ Como Executar Localmente
```bash
node server.js
```
Acesse `http://localhost:8080` no seu navegador.
- **Planilha de Leads**: `http://localhost:8080/leads.csv`
- **Endpoint de API**: `http://localhost:8080/api/leads`

## ☁️ Deploy Vercel
O projeto já está configurado com `vercel.json` e `api/leads.js` para ser implantado na Vercel em 1 clique.
