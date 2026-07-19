import { createClient } from '@supabase/supabase-js';

// Obtém as variáveis de ambiente necessárias para a conexão com o Supabase.
// O Vite exige o prefixo 'VITE_' para disponibilizar variáveis de ambiente no lado do cliente.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação de segurança: impede o funcionamento do app caso as variáveis de ambiente essenciais não estejam configuradas.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar configuradas no arquivo .env.local.'
  );
}

// Inicializa o cliente único do Supabase para uso em todo o projeto.
// Este cliente será responsável por realizar consultas, gerenciar sessões de autenticação e comunicação em tempo real.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
