import { createClient } from '@supabase/supabase-js';

// Obtém as variáveis de ambiente necessárias para a conexão com o Supabase.
// O Vite exige o prefixo 'VITE_' para disponibilizar variáveis de ambiente no lado do cliente.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rtruylfvzqlxuktvprmf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0cnV5bGZ2enFseHVrdHZwcm1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MDEzMjYsImV4cCI6MjA5OTk3NzMyNn0.ibkPp6722Dk-HyQpcywhgFfs__bddDh71oD-07-mJK8';

// Verificação de segurança: evita falhas fatais caso as chaves não estejam disponíveis
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Aviso: As variáveis de ambiente do Supabase não foram encontradas. Algumas funcionalidades podem não carregar corretamente.'
  );
}

// Inicializa o cliente único do Supabase para uso em todo o projeto.
// Este cliente será responsável por realizar consultas, gerenciar sessões de autenticação e comunicação em tempo real.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
