// Configuração Global do Supabase para o Prosperus Quiz & Admin
(function (global) {
  // Cole suas credenciais aqui ou defina nas variáveis de ambiente da Vercel
  const SUPABASE_URL = (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL) || "https://seu-projeto.supabase.co";
  const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env && process.env.SUPABASE_ANON_KEY) || "sua-chave-anonima-aqui";

  global.PROSPERUS_SUPABASE_URL = SUPABASE_URL;
  global.PROSPERUS_SUPABASE_KEY = SUPABASE_ANON_KEY;

  // Função utilitária para obter o cliente Supabase no Navegador
  global.getSupabaseClient = function() {
    if (typeof supabase !== 'undefined' && SUPABASE_URL !== "https://seu-projeto.supabase.co") {
      try {
        return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      } catch(e) {
        console.warn('⚠️ Erro ao instanciar cliente Supabase no browser:', e);
      }
    }
    return null;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    };
  }
})(typeof window !== 'undefined' ? window : global);
