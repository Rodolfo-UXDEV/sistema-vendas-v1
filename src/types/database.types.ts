// Definição dos tipos TypeScript para refletir a tabela "public.clientes" do Supabase.
// Isto garante segurança em tempo de compilação e autocompletar eficiente no frontend.

export interface Cliente {
  id: string;             // UUID gerado automaticamente pelo Supabase
  created_at: string;     // Data/hora de inserção
  nome: string;           // Nome completo do cliente
  telefone: string;       // Telefone formatado do cliente
}

// Tipo útil para inserção, excluindo os campos gerados de forma automática no banco (id, created_at)
export type ClienteInsert = Omit<Cliente, 'id' | 'created_at'>;

export interface Produto {
  id: string;             // UUID gerado automaticamente pelo Supabase
  created_at: string;     // Data/hora de criação do produto
  nome: string;           // Nome do produto
  valor: number;          // Preço/valor decimal do produto
  quantidade: number;     // Quantidade disponível no estoque
  imagem_url: string | null; // URL da imagem armazenada no Supabase Storage ou externa
}

export type ProdutoInsert = Omit<Produto, 'id' | 'created_at'>;

export interface ItemVenda {
  id: string;               // UUID gerado automaticamente
  venda_id: string;         // FK para vendas(id)
  produto_id: string;       // FK para produtos(id)
  quantidade: number;       // Quantidade de itens (CHECK > 0)
  valor_unitario: number;    // Valor do produto na hora da venda
  produtos?: { nome: string; valor: number; imagem_url: string | null }; // Detalhe do produto (join)
}

export interface PagamentoVenda {
  id: string;               // UUID do pagamento
  venda_id: string;         // FK para vendas(id)
  valor: number;            // Valor abatido
  created_at: string;       // Data/hora do lançamento do pagamento
}

export interface Venda {
  id: string;               // UUID gerado automaticamente
  created_at: string;       // Data/hora da venda
  cliente_id: string;       // FK para clientes(id)
  valor_total: number;      // Soma de todos os itens_venda
  status: 'pendente' | 'finalizado'; // Status de pagamento da venda
  pago_em: string | null;   // Timestamp de quando o status mudou para finalizado
  
  // Relacionamentos expandidos
  clientes?: { nome: string; telefone: string };
  itens_venda?: ItemVenda[];
  pagamentos_venda?: PagamentoVenda[];
}

export type VendaInsert = Omit<Venda, 'id' | 'created_at' | 'pago_em' | 'clientes' | 'itens_venda' | 'pagamentos_venda'>;
export type ItemVendaInsert = Omit<ItemVenda, 'id' | 'produtos'>;



