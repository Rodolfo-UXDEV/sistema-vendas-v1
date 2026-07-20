import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import type { Cliente, Produto, Venda } from './types/database.types';

// Interface para gerenciar o estado das notificações flutuantes (Toasts)
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

type Tab = 'clientes' | 'produtos' | 'vendas';
type SubTabVendas = 'pendentes' | 'finalizadas';

interface CartItem {
  produtoId: string;
  nome: string;
  valor: number;
  quantidade: number;
}

export default function App() {
  // Controle de abas principais
  const [activeTab, setActiveTab] = useState<Tab>('clientes');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Estados para navegação de sub-telas (Mobile-First)
  const [viewCliente, setViewCliente] = useState<'list' | 'create' | 'edit'>('list');
  const [viewProduto, setViewProduto] = useState<'list' | 'create' | 'edit'>('list');
  const [viewVenda, setViewVenda] = useState<'list' | 'create' | 'edit'>('list');
  const [editingVenda, setEditingVenda] = useState<Venda | null>(null);
  const [showVendaDeleteConfirm, setShowVendaDeleteConfirm] = useState(false);

  // Estados para edição e exclusão de produtos
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [nomeEditProduto, setNomeEditProduto] = useState('');
  const [valorEditProduto, setValorEditProduto] = useState('');
  const [imagemEditPreview, setImagemEditPreview] = useState<string | null>(null);
  const [selectedEditFile, setSelectedEditFile] = useState<File | null>(null);
  const [showProductDeleteConfirm, setShowProductDeleteConfirm] = useState(false);

  // Estados para edição e exclusão de clientes
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [nomeEditCliente, setNomeEditCliente] = useState('');
  const [telefoneEditCliente, setTelefoneEditCliente] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroProduto, setFiltroProduto] = useState('');

  // ==========================================
  // ESTADOS E CONTROLE DA ABA DE CLIENTES
  // ==========================================
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingCliente, setLoadingCliente] = useState(false);
  const [fetchingClientes, setFetchingClientes] = useState(true);

  // ==========================================
  // ESTADOS E CONTROLE DA ABA DE PRODUTOS
  // ==========================================
  const [nomeProduto, setNomeProduto] = useState('');
  const [valorProduto, setValorProduto] = useState('');
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProduto, setLoadingProduto] = useState(false);
  const [fetchingProdutos, setFetchingProdutos] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileEditInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // ESTADOS E CONTROLE DA ABA DE GESTÃO DE VENDAS
  // ==========================================
  const [subTabVendas, setSubTabVendas] = useState<SubTabVendas>('pendentes');
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [fetchingVendas, setFetchingVendas] = useState(true);
  const [filtroMesVendas, setFiltroMesVendas] = useState(
    new Date().toISOString().substring(0, 7)
  );

  // ==========================================
  // ESTADOS E CONTROLE DA ABA DE NOVA VENDA (CARRINHO)
  // ==========================================
  const [cartClienteId, setCartClienteId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentProdutoId, setCurrentProdutoId] = useState('');
  const [currentQuantidade, setCurrentQuantidade] = useState(1);
  const [cartStatus, setCartStatus] = useState<'pendente' | 'finalizado'>('pendente');
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  
  // Controle de recibo pós-venda
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutVendaId, setCheckoutVendaId] = useState<string | null>(null);

  // ==========================================
  // EFEITOS E CARREGAMENTO DE DADOS
  // ==========================================
  useEffect(() => {
    fetchClientes();
    fetchProdutos();
    fetchVendas();
  }, []);

  const fetchClientes = async () => {
    try {
      setFetchingClientes(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setClientes(data || []);
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar clientes.', 'error');
    } finally {
      setFetchingClientes(false);
    }
  };

  const fetchProdutos = async () => {
    try {
      setFetchingProdutos(true);
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setProdutos(data || []);
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar produtos.', 'error');
    } finally {
      setFetchingProdutos(false);
    }
  };

  const fetchVendas = async () => {
    try {
      setFetchingVendas(true);
      // Realiza a consulta trazendo os dados do cliente e os itens da venda,
      // incluindo as informações detalhadas de cada produto em cada item.
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          id,
          created_at,
          cliente_id,
          valor_total,
          status,
          pago_em,
          clientes (nome, telefone),
          itens_venda (
            id,
            produto_id,
            quantidade,
            valor_unitario,
            produtos (nome, valor, imagem_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendas((data as any) || []);
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar histórico de vendas.', 'error');
    } finally {
      setFetchingVendas(false);
    }
  };

  // ==========================================
  // FUNÇÕES AUXILIARES COMUNS
  // ==========================================
  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ==========================================
  // OPERAÇÕES E COMPORTAMENTO DE CLIENTES
  // ==========================================
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.length > 11) input = input.substring(0, 11);
    if (input.length > 6) {
      input = `(${input.substring(0, 2)}) ${input.substring(2, 7)}-${input.substring(7)}`;
    } else if (input.length > 2) {
      input = `(${input.substring(0, 2)}) ${input.substring(2)}`;
    } else if (input.length > 0) {
      input = `(${input}`;
    }
    setTelefoneCliente(input);
  };

  const handleClienteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = nomeCliente.trim();
    const telefoneLimpo = telefoneCliente.trim();

    if (!nomeLimpo || nomeLimpo.length < 3) {
      showToast('O nome do cliente deve conter pelo menos 3 caracteres.', 'error');
      return;
    }
    if (telefoneLimpo.replace(/\D/g, '').length < 10) {
      showToast('Informe um telefone válido com DDD (mínimo 10 dígitos).', 'error');
      return;
    }

    setLoadingCliente(true);
    try {
      const { error } = await supabase.from('clientes').insert([
        { nome: nomeLimpo, telefone: telefoneLimpo }
      ]);
      if (error) throw error;
      showToast('Cliente cadastrado com sucesso!', 'success');
      setNomeCliente('');
      setTelefoneCliente('');
      fetchClientes();
      setViewCliente('list');
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar cliente.', 'error');
    } finally {
      setLoadingCliente(false);
    }
  };

  const handleTelefoneEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.length > 11) input = input.substring(0, 11);
    if (input.length > 6) {
      input = `(${input.substring(0, 2)}) ${input.substring(2, 7)}-${input.substring(7)}`;
    } else if (input.length > 2) {
      input = `(${input.substring(0, 2)}) ${input.substring(2)}`;
    } else if (input.length > 0) {
      input = `(${input}`;
    }
    setTelefoneEditCliente(input);
  };

  const handleClienteUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCliente) return;

    const nomeLimpo = nomeEditCliente.trim();
    const telefoneLimpo = telefoneEditCliente.trim();

    if (!nomeLimpo || nomeLimpo.length < 3) {
      showToast('O nome do cliente deve conter pelo menos 3 caracteres.', 'error');
      return;
    }
    if (telefoneLimpo.replace(/\D/g, '').length < 10) {
      showToast('Informe um telefone válido com DDD (mínimo 10 dígitos).', 'error');
      return;
    }

    setLoadingCliente(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ nome: nomeLimpo, telefone: telefoneLimpo })
        .eq('id', editingCliente.id);

      if (error) throw error;

      showToast('Cliente atualizado com sucesso!', 'success');
      resetClienteEditState();
      fetchClientes();
      setViewCliente('list');
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar cliente.', 'error');
    } finally {
      setLoadingCliente(false);
    }
  };

  const resetClienteEditState = () => {
    setEditingCliente(null);
    setNomeEditCliente('');
    setTelefoneEditCliente('');
    setShowDeleteConfirm(false);
    setFiltroCliente('');
    setFiltroProduto('');
  };

  const resetProdutoEditState = () => {
    setEditingProduto(null);
    setNomeEditProduto('');
    setValorEditProduto('');
    setImagemEditPreview(null);
    setSelectedEditFile(null);
    setShowProductDeleteConfirm(false);
    setFiltroProduto('');
  };

  const resetAllEditStates = () => {
    resetClienteEditState();
    resetProdutoEditState();
    setViewVenda('list');
    setEditingVenda(null);
    setShowVendaDeleteConfirm(false);
  };

  const handleClienteDelete = async () => {
    if (!editingCliente) return;

    setLoadingCliente(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', editingCliente.id);

      if (error) throw error;

      showToast('Cliente excluído com sucesso!', 'success');
      resetClienteEditState();
      fetchClientes();
      fetchVendas(); // Atualiza vendas caso o cliente possuísse vendas atreladas deletadas em cascata
      setViewCliente('list');
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir cliente.', 'error');
    } finally {
      setLoadingCliente(false);
    }
  };

  // ==========================================
  // OPERAÇÕES E COMPORTAMENTO DE PRODUTOS
  // ==========================================
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (!input) {
      setValorProduto('');
      return;
    }
    const valorNumerico = parseFloat(input) / 100;
    const formatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valorNumerico);
    setValorProduto(formatado);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Escolha um arquivo de imagem válido (PNG, JPG, WEBP).', 'error');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast('A imagem não deve exceder 3MB de tamanho.', 'error');
      return;
    }
    setImagemArquivo(file);
    setImagemPreview(URL.createObjectURL(file));
  };

  const removeSelectedImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagemArquivo(null);
    setImagemPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleValorEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (!input) {
      setValorEditProduto('');
      return;
    }
    const valorNumerico = parseFloat(input) / 100;
    const formatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valorNumerico);
    setValorEditProduto(formatado);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Escolha um arquivo de imagem válido (PNG, JPG, WEBP).', 'error');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast('A imagem não deve exceder 3MB de tamanho.', 'error');
      return;
    }
    setSelectedEditFile(file);
    setImagemEditPreview(URL.createObjectURL(file));
  };

  const removeSelectedEditImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEditFile(null);
    setImagemEditPreview(null);
    if (fileEditInputRef.current) fileEditInputRef.current.value = '';
  };

  const handleProdutoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = nomeProduto.trim();
    const valorNumerico = parseFloat(
      valorProduto.replace(/[^\d,]/g, '').replace(',', '.')
    );

    if (!nomeLimpo || nomeLimpo.length < 2) {
      showToast('O nome do produto deve conter pelo menos 2 caracteres.', 'error');
      return;
    }
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      showToast('Informe um valor de produto válido e maior que zero.', 'error');
      return;
    }

    setLoadingProduto(true);
    let publicImageUrl: string | null = null;

    try {
      if (imagemArquivo) {
        const fileExt = imagemArquivo.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('produtos')
          .upload(filePath, imagemArquivo);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('produtos')
          .getPublicUrl(filePath);

        publicImageUrl = data.publicUrl;
      }

      const { error } = await supabase.from('produtos').insert([
        {
          nome: nomeLimpo,
          valor: valorNumerico,
          imagem_url: publicImageUrl
        }
      ]);

      if (error) throw error;
      showToast('Produto cadastrado com sucesso!', 'success');
      setNomeProduto('');
      setValorProduto('');
      setImagemArquivo(null);
      setImagemPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchProdutos();
      setViewProduto('list');
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar produto.', 'error');
    } finally {
      setLoadingProduto(false);
    }
  };

  const handleProdutoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduto) return;

    const nomeLimpo = nomeEditProduto.trim();
    const valorNumerico = parseFloat(
      valorEditProduto.replace(/[^\d,]/g, '').replace(',', '.')
    );

    if (!nomeLimpo || nomeLimpo.length < 2) {
      showToast('O nome do produto deve conter pelo menos 2 caracteres.', 'error');
      return;
    }
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      showToast('Informe um valor de produto válido e maior que zero.', 'error');
      return;
    }

    setLoadingProduto(true);
    let publicImageUrl: string | null = editingProduto.imagem_url;

    if (imagemEditPreview === null) {
      publicImageUrl = null;
    }

    try {
      if (selectedEditFile) {
        const fileExt = selectedEditFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('produtos')
          .upload(filePath, selectedEditFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('produtos')
          .getPublicUrl(filePath);

        publicImageUrl = data.publicUrl;
      }

      const { error } = await supabase
        .from('produtos')
        .update({
          nome: nomeLimpo,
          valor: valorNumerico,
          imagem_url: publicImageUrl
        })
        .eq('id', editingProduto.id);

      if (error) throw error;

      showToast('Produto atualizado com sucesso!', 'success');
      resetProdutoEditState();
      fetchProdutos();
      setViewProduto('list');
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar produto.', 'error');
    } finally {
      setLoadingProduto(false);
    }
  };

  const handleProdutoDelete = async () => {
    if (!editingProduto) return;

    setLoadingProduto(true);
    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', editingProduto.id);

      if (error) throw error;

      setCart((prev) => prev.filter((item) => item.produtoId !== editingProduto.id));

      showToast('Produto excluído com sucesso!', 'success');
      resetProdutoEditState();
      fetchProdutos();
      fetchVendas();
      setViewProduto('list');
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir produto.', 'error');
    } finally {
      setLoadingProduto(false);
    }
  };

  // ==========================================
  // OPERAÇÕES E COMPORTAMENTO DE GESTÃO DE VENDAS
  // ==========================================
  const handleFinalizarPagamento = async (vendaId: string) => {
    try {
      const { error } = await supabase
        .from('vendas')
        .update({
          status: 'finalizado',
          pago_em: new Date().toISOString()
        })
        .eq('id', vendaId);

      if (error) throw error;

      showToast('Pagamento recebido! Venda finalizada.', 'success');
      fetchVendas();
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar pagamento.', 'error');
    }
  };

  const handleStartEditVenda = (venda: Venda) => {
    const itemsMapped: CartItem[] = (venda.itens_venda || []).map((item) => ({
      produtoId: item.produto_id,
      nome: item.produtos?.nome || 'Produto Removido',
      valor: item.valor_unitario,
      quantidade: item.quantidade
    }));

    setCart(itemsMapped);
    setCartClienteId(venda.cliente_id);
    setCartStatus(venda.status as any);
    setEditingVenda(venda);
    setViewVenda('edit');
  };

  const handleVendaDelete = async () => {
    if (!editingVenda) return;
    setLoadingCheckout(true);
    try {
      const { error } = await supabase
        .from('vendas')
        .delete()
        .eq('id', editingVenda.id);

      if (error) throw error;

      showToast('Venda excluída com sucesso!', 'success');
      await fetchVendas();
      resetNovaVenda();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir venda.', 'error');
    } finally {
      setLoadingCheckout(false);
      setShowVendaDeleteConfirm(false);
    }
  };

  const vendasPendentes = vendas.filter((v) => v.status === 'pendente');
  
  const vendasFinalizadas = vendas.filter((v) => {
    if (v.status !== 'finalizado') return false;
    if (!filtroMesVendas) return true;
    const dataVerificar = v.pago_em || v.created_at;
    return dataVerificar.startsWith(filtroMesVendas);
  });

  // ==========================================
  // OPERAÇÕES E COMPORTAMENTO DO CARRINHO DE NOVA VENDA
  // ==========================================
  const totalCarrinho = cart.reduce((acc, item) => acc + item.valor * item.quantidade, 0);

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProdutoId) return;

    const prod = produtos.find((p) => p.id === currentProdutoId);
    if (!prod) return;

    const existingItem = cart.find((item) => item.produtoId === currentProdutoId);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.produtoId === currentProdutoId
            ? { ...item, quantidade: item.quantidade + currentQuantidade }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          produtoId: currentProdutoId,
          nome: prod.nome,
          valor: prod.valor,
          quantidade: currentQuantidade
        }
      ]);
    }

    setCurrentProdutoId('');
    setCurrentQuantidade(1);
    showToast('Produto adicionado ao carrinho!', 'success');
  };

  const handleRemoveFromCart = (produtoId: string) => {
    setCart(cart.filter((item) => item.produtoId !== produtoId));
    showToast('Produto removido do carrinho.', 'success');
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cartClienteId) {
      showToast('Selecione o cliente para fechar a venda.', 'error');
      return;
    }
    if (cart.length === 0) {
      showToast('O carrinho está vazio! Adicione pelo menos um produto.', 'error');
      return;
    }

    setLoadingCheckout(true);
    try {
      const isFinalizada = cartStatus === 'finalizado';
      
      if (editingVenda) {
        // MODO EDICAO
        // 1. Atualiza registro mestre
        const { error: updateError } = await supabase
          .from('vendas')
          .update({
            cliente_id: cartClienteId,
            valor_total: totalCarrinho,
            status: cartStatus,
            pago_em: isFinalizada ? (editingVenda.pago_em || new Date().toISOString()) : null
          })
          .eq('id', editingVenda.id);

        if (updateError) throw updateError;

        // 2. Deleta itens antigos
        const { error: deleteError } = await supabase
          .from('itens_venda')
          .delete()
          .eq('venda_id', editingVenda.id);

        if (deleteError) throw deleteError;

        // 3. Prepara novos itens
        const itensParaInserir = cart.map((item) => ({
          venda_id: editingVenda.id,
          produto_id: item.produtoId,
          quantidade: item.quantidade,
          valor_unitario: item.valor
        }));

        // 4. Insere os itens atualizados
        const { error: insertError } = await supabase
          .from('itens_venda')
          .insert(itensParaInserir);

        if (insertError) throw insertError;

        showToast('Venda atualizada com sucesso!', 'success');
        await fetchVendas();
        resetNovaVenda();
      } else {
        // MODO CRIACAO (ORIGINAL)
        // 1. Cria o registro na tabela mestre "vendas"
        const { data: novaVenda, error: vendaError } = await supabase
          .from('vendas')
          .insert([
            {
              cliente_id: cartClienteId,
              valor_total: totalCarrinho,
              status: cartStatus,
              pago_em: isFinalizada ? new Date().toISOString() : null
            }
          ])
          .select()
          .single();

        if (vendaError) throw vendaError;
        if (!novaVenda) throw new Error('Falha ao gerar registro de venda.');

        // 2. Prepara os itens da venda vinculando o venda_id gerado
        const itensParaInserir = cart.map((item) => ({
          venda_id: novaVenda.id,
          produto_id: item.produtoId,
          quantidade: item.quantidade,
          valor_unitario: item.valor
        }));

        // 3. Insere os itens na tabela detalhe "itens_venda" em lote
        const { error: itensError } = await supabase
          .from('itens_venda')
          .insert(itensParaInserir);

        if (itensError) throw itensError;

        // Sucesso na transação
        setCheckoutVendaId(novaVenda.id);
        
        // Atualiza lista do histórico geral de vendas
        await fetchVendas();
        
        // Limpa dados locais
        setCart([]);
        setCartClienteId('');
        setCartStatus('pendente');
        setCheckoutSuccess(true);
        
        showToast('Venda finalizada com sucesso!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao processar venda no banco.', 'error');
    } finally {
      setLoadingCheckout(false);
    }
  };

  const resetNovaVenda = () => {
    setCheckoutSuccess(false);
    setCheckoutVendaId(null);
    setViewVenda('list');
    setEditingVenda(null);
    setShowVendaDeleteConfirm(false);
    setCart([]);
    setCartClienteId('');
    setCartStatus('pendente');
  };

  // WhatsApp Share Message builder
  const handleShareWhatsapp = () => {
    if (!checkoutVendaId) return;

    // Busca os dados consolidados da venda no histórico (que contêm os joins carregados)
    const sale = vendas.find((v) => v.id === checkoutVendaId);
    if (!sale) {
      showToast('Venda não localizada para compartilhamento.', 'error');
      return;
    }

    const clienteNome = sale.clientes?.nome || 'Cliente';
    const clienteTelefone = sale.clientes?.telefone || '';

    // Filtra apenas números do telefone do cliente para o link de wa.me
    let foneLimpo = clienteTelefone.replace(/\D/g, '');
    if (foneLimpo && !foneLimpo.startsWith('55') && foneLimpo.length >= 10) {
      foneLimpo = '55' + foneLimpo; // Adiciona DDI do Brasil caso falte
    }

    // Constrói recibo no WhatsApp com marcações em Markdown
    let msg = `Olá, *${clienteNome}*! Segue o recibo da sua compra:\n\n`;
    msg += `*Cód. Venda:* \`${sale.id.substring(0, 8).toUpperCase()}\`\n`;
    msg += `*Data:* ${formatDate(sale.created_at)}\n`;
    msg += `*Status:* ${sale.status === 'finalizado' ? '🟢 Pago (Finalizado)' : '🔴 Pendente de Pagamento'}\n\n`;
    
    msg += `*Itens comprados:*\n`;
    sale.itens_venda?.forEach((item) => {
      const prodNome = item.produtos?.nome || 'Produto';
      const subTotal = item.quantidade * item.valor_unitario;
      msg += `• ${item.quantidade}x ${prodNome} (${formatCurrency(item.valor_unitario)} cada) = _${formatCurrency(subTotal)}_\n`;
    });

    msg += `\n*Valor Total:* *${formatCurrency(sale.valor_total)}*\n\n`;
    msg += `Agradecemos pela preferência!`;

    const encodedMsg = encodeURIComponent(msg);
    const whatsappUrl = foneLimpo 
      ? `https://wa.me/${foneLimpo}?text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="container">
      {/* Cabeçalho */}
      <header className="header">
        <h1>Sistema de Vendas</h1>
        <p>Gerenciamento integrado ao banco de dados Supabase</p>
      </header>

      {/* Abas de Navegação Principal */}
      <nav className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'clientes' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('clientes');
            setViewCliente('list');
            setViewProduto('list');
            resetAllEditStates();
            resetNovaVenda();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon"><path d="M17 21v-2a4 4 0 0 0-3-3.87"/><path d="M9 21v-2a4 4 0 0 0-4-4H3a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span className="tab-label">Clientes</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'produtos' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('produtos');
            setViewCliente('list');
            setViewProduto('list');
            resetAllEditStates();
            resetNovaVenda();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          <span className="tab-label">Produtos</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'vendas' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('vendas');
            setViewCliente('list');
            setViewProduto('list');
            resetAllEditStates();
            resetNovaVenda();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span className="tab-label">Vendas</span>
        </button>
      </nav>

      {/* ==========================================
          VISÃO DA ABA: CLIENTES
          ========================================== */}
      {activeTab === 'clientes' && (
        viewCliente === 'list' ? (
          <main className="grid" style={{ gridTemplateColumns: '1fr' }}>
            {/* Listagem de Clientes */}
            <section className="card">
              <h2 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--accent)'}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Clientes Cadastrados ({clientes.length})
              </h2>

              {fetchingClientes ? (
                <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner" style={{ borderColor: 'rgba(139, 92, 246, 0.3)', borderTopColor: 'var(--accent)', width: '2rem', height: '2rem', borderWidth: '3px' }}></div>
                  <p style={{ marginTop: '1rem' }}>Carregando dados...</p>
                </div>
              ) : clientes.length === 0 ? (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p>Nenhum cliente cadastrado ainda.</p>
                </div>
              ) : (
                <>
                  {/* Campo de Busca */}
                  <div className="search-bar">
                    <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Pesquisar cliente por nome..."
                      value={filtroCliente}
                      onChange={(e) => setFiltroCliente(e.target.value)}
                      autoComplete="off"
                    />
                  </div>

                  {clientes.filter(cliente => cliente.nome.toLowerCase().includes(filtroCliente.toLowerCase())).length === 0 ? (
                    <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '2.5rem', height: '2.5rem', color: 'var(--text-muted)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>Nenhum cliente correspondente encontrado.</p>
                    </div>
                  ) : (
                    <div className="clients-list">
                      {clientes
                        .filter(cliente => cliente.nome.toLowerCase().includes(filtroCliente.toLowerCase()))
                        .map((cliente) => (
                          <article key={cliente.id} className="client-item">
                            <div className="client-meta">
                              <div className="client-avatar">
                                {getInitials(cliente.nome)}
                              </div>
                              <div className="client-info">
                                <h3>{cliente.nome}</h3>
                                <p>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                  {cliente.telefone}
                                </p>
                              </div>
                            </div>
                            {cliente.telefone && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  className="btn-client-wa"
                                  onClick={() => {
                                    let foneLimpo = cliente.telefone.replace(/\D/g, '');
                                    if (foneLimpo && !foneLimpo.startsWith('55') && foneLimpo.length >= 10) {
                                      foneLimpo = '55' + foneLimpo;
                                    }
                                    const url = `https://wa.me/${foneLimpo}`;
                                    window.open(url, '_blank');
                                  }}
                                  title={`Conversar com ${cliente.nome}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.166.001 6.141 1.233 8.378 3.469 2.237 2.236 3.466 5.21 3.466 8.377 0 6.533-5.325 11.858-11.857 11.858-2.004-.001-3.974-.512-5.733-1.488L0 24zm6.208-3.693c1.691.99 3.324 1.517 5.168 1.519 5.485 0 9.948-4.463 9.95-9.95.001-2.659-1.03-5.158-2.902-7.03C16.59 2.973 14.099 1.943 11.44 1.945c-5.488 0-9.95 4.463-9.952 9.951-.001 1.936.533 3.513 1.523 5.132L1.97 22.03l5.038-1.32.743.431.116-.034zM17.47 15.65c-.32-.16-1.89-.93-2.18-1.04-.3-.1-.51-.16-.73.16-.21.32-.82 1.04-1.01 1.25-.19.22-.38.24-.7.08-.32-.16-1.35-.5-2.58-1.59-.95-.85-1.6-1.9-1.78-2.22-.19-.32-.02-.5.14-.66.15-.15.32-.38.48-.56.16-.18.22-.3.32-.51.1-.22.05-.41-.03-.57-.08-.16-.73-1.76-1-2.4-.27-.66-.54-.57-.73-.58-.19-.01-.41-.01-.63-.01-.22 0-.58.08-.88.4-.3.32-1.15 1.12-1.15 2.73s1.18 3.16 1.34 3.38c.16.22 2.32 3.54 5.62 4.97.78.34 1.4.55 1.87.7.79.25 1.5.21 2.07.13.63-.09 1.89-.77 2.15-1.48.27-.71.27-1.32.19-1.45-.08-.14-.3-.22-.62-.38z"/></svg>
                                </button>
                                <button
                                  type="button"
                                  className="btn-client-edit"
                                  onClick={() => {
                                    setEditingCliente(cliente);
                                    setNomeEditCliente(cliente.nome);
                                    setTelefoneEditCliente(cliente.telefone || '');
                                    setViewCliente('edit');
                                  }}
                                  title={`Editar ${cliente.nome}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                              </div>
                            )}
                          </article>
                        ))}
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Botão Flutuante (FAB) */}
            <button
              type="button"
              className="fab-btn"
              onClick={() => setViewCliente('create')}
              title="Cadastrar Novo Cliente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </main>
        ) : viewCliente === 'create' ? (
          /* Tela Dedicada de Cadastro de Cliente */
          <main className="form-screen">
            <div className="back-header">
              <button
                type="button"
                className="btn-back"
                onClick={() => setViewCliente('list')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </button>
            </div>

            <section className="card">
              <h2 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--accent)'}}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                Novo Cliente
              </h2>
              <form onSubmit={handleClienteSubmit}>
                <div className="form-group">
                  <label htmlFor="nomeCliente" className="form-label">Nome Completo</label>
                  <input
                    id="nomeCliente"
                    type="text"
                    className="form-input"
                    placeholder="Ex: João Silva"
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    disabled={loadingCliente}
                    required
                    autoComplete="off"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="telefoneCliente" className="form-label">Telefone / WhatsApp</label>
                  <input
                    id="telefoneCliente"
                    type="tel"
                    className="form-input"
                    placeholder="Ex: (11) 98765-4321"
                    value={telefoneCliente}
                    onChange={handleTelefoneChange}
                    disabled={loadingCliente}
                    required
                    autoComplete="off"
                  />
                </div>

                <button type="submit" className="btn" disabled={loadingCliente}>
                  {loadingCliente ? (
                    <>
                      <div className="spinner"></div>
                      Salvando...
                    </>
                  ) : (
                    'Salvar Cliente'
                  )}
                </button>
              </form>
            </section>
          </main>
        ) : (
          /* Tela Dedicada de Edição de Cliente */
          <main className="form-screen">
            <div className="back-header">
              <button
                type="button"
                className="btn-back"
                onClick={() => {
                  setViewCliente('list');
                  setEditingCliente(null);
                  setNomeEditCliente('');
                  setTelefoneEditCliente('');
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </button>
            </div>

            <section className="card">
              <h2 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--accent)'}}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Editar Cliente
              </h2>
              <form onSubmit={handleClienteUpdate}>
                <div className="form-group">
                  <label htmlFor="nomeEditCliente" className="form-label">Nome Completo</label>
                  <input
                    id="nomeEditCliente"
                    type="text"
                    className="form-input"
                    placeholder="Ex: João Silva"
                    value={nomeEditCliente}
                    onChange={(e) => setNomeEditCliente(e.target.value)}
                    disabled={loadingCliente}
                    required
                    autoComplete="off"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="telefoneEditCliente" className="form-label">Telefone / WhatsApp</label>
                  <input
                    id="telefoneEditCliente"
                    type="tel"
                    className="form-input"
                    placeholder="Ex: (11) 98765-4321"
                    value={telefoneEditCliente}
                    onChange={handleTelefoneEditChange}
                    disabled={loadingCliente}
                    required
                    autoComplete="off"
                  />
                </div>

                <button type="submit" className="btn" disabled={loadingCliente}>
                  {loadingCliente ? (
                    <>
                      <div className="spinner"></div>
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </button>

                <button
                  type="button"
                  className="btn-danger-outline"
                  style={{ marginTop: '1.25rem' }}
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loadingCliente}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Excluir Cliente
                </button>
              </form>
            </section>
          </main>
        )
      )}

      {/* ==========================================
          VISÃO DA ABA: PRODUTOS
          ========================================== */}
      {activeTab === 'produtos' && (
        viewProduto === 'list' ? (
          <main className="grid" style={{ gridTemplateColumns: '1fr' }}>
            {/* Listagem de Produtos */}
            <section className="card">
              <h2 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--accent)'}}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                Produtos Cadastrados ({produtos.length})
              </h2>

              {fetchingProdutos ? (
                <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner" style={{ borderColor: 'rgba(139, 92, 246, 0.3)', borderTopColor: 'var(--accent)', width: '2rem', height: '2rem', borderWidth: '3px' }}></div>
                  <p style={{ marginTop: '1rem' }}>Carregando dados...</p>
                </div>
              ) : produtos.length === 0 ? (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p>Nenhum produto cadastrado ainda.</p>
                </div>
              ) : (
                <>
                  {/* Campo de Busca de Produtos */}
                  <div className="search-bar">
                    <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Pesquisar produto por nome..."
                      value={filtroProduto}
                      onChange={(e) => setFiltroProduto(e.target.value)}
                      autoComplete="off"
                    />
                  </div>

                  {produtos.filter(p => p.nome.toLowerCase().includes(filtroProduto.toLowerCase())).length === 0 ? (
                    <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '2.5rem', height: '2.5rem', color: 'var(--text-muted)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>Nenhum produto correspondente encontrado.</p>
                    </div>
                  ) : (
                    <div className="products-list-vertical">
                      {produtos
                        .filter(p => p.nome.toLowerCase().includes(filtroProduto.toLowerCase()))
                        .map((produto) => (
                          <article key={produto.id} className="product-card-vertical">
                            <div className="product-img-wrapper-vertical">
                              {produto.imagem_url ? (
                                <img src={produto.imagem_url} alt={produto.nome} className="product-img-vertical" />
                              ) : (
                                <div className="product-no-img-vertical">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>Sem foto</span>
                                </div>
                              )}
                            </div>
                            <div className="product-info-vertical">
                              <h3 className="product-name-vertical">{produto.nome}</h3>
                              <p className="product-price-vertical">{formatCurrency(produto.valor)}</p>
                            </div>
                            <button
                              type="button"
                              className="btn-product-edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProduto(produto);
                                setNomeEditProduto(produto.nome);
                                setValorEditProduto(formatCurrency(produto.valor).replace('R$', '').trim());
                                setImagemEditPreview(produto.imagem_url);
                                setSelectedEditFile(null);
                                setViewProduto('edit');
                              }}
                              title="Editar Produto"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                          </article>
                        ))}
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Botão Flutuante (FAB) */}
            <button
              type="button"
              className="fab-btn"
              onClick={() => setViewProduto('create')}
              title="Cadastrar Novo Produto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </main>
        ) : viewProduto === 'create' ? (
          /* Tela Dedicada de Cadastro de Produto */
          <main className="form-screen">
            <div className="back-header">
              <button
                type="button"
                className="btn-back"
                onClick={() => setViewProduto('list')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </button>
            </div>

            <section className="card">
              <h2 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--accent)'}}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 17 22 12"/></svg>
                Novo Produto
              </h2>
              <form onSubmit={handleProdutoSubmit}>
                <div className="form-group">
                  <label htmlFor="nomeProduto" className="form-label">Nome do Produto</label>
                  <input
                    id="nomeProduto"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Camiseta Algodão Premium"
                    value={nomeProduto}
                    onChange={(e) => setNomeProduto(e.target.value)}
                    disabled={loadingProduto}
                    required
                    autoComplete="off"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="valorProduto" className="form-label">Preço / Valor de Venda</label>
                  <input
                    id="valorProduto"
                    type="text"
                    className="form-input"
                    placeholder="Ex: R$ 0,00"
                    value={valorProduto}
                    onChange={handleValorChange}
                    disabled={loadingProduto}
                    required
                    autoComplete="off"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Imagem do Produto</label>
                  <div className="upload-container">
                    <div 
                      className="upload-area"
                      onClick={() => !loadingProduto && fileInputRef.current?.click()}
                    >
                      {imagemPreview ? (
                        <div className="upload-preview-container">
                          <img src={imagemPreview} alt="Preview" className="upload-preview" />
                          <button 
                            type="button" 
                            className="upload-remove-btn"
                            onClick={removeSelectedImage}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="upload-text">Clique para <span>enviar foto</span></p>
                          <p className="upload-text" style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem'}}>Suporta PNG, JPG, WEBP até 3MB</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={loadingProduto}
                    />
                  </div>
                </div>

                <button type="submit" className="btn" disabled={loadingProduto}>
                  {loadingProduto ? (
                    <>
                      <div className="spinner"></div>
                      Salvando...
                    </>
                  ) : (
                    'Salvar Produto'
                  )}
                </button>
              </form>
            </section>
          </main>
        ) : (
          /* Tela Dedicada de Edição de Produto */
          <main className="form-screen">
            <div className="back-header">
              <button
                type="button"
                className="btn-back"
                onClick={() => setViewProduto('list')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </button>
            </div>

            <section className="card">
              <h2 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--accent)'}}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 17 22 12"/></svg>
                Editar Produto
              </h2>
              <form onSubmit={handleProdutoUpdate}>
                <div className="form-group">
                  <label htmlFor="nomeEditProduto" className="form-label">Nome do Produto</label>
                  <input
                    id="nomeEditProduto"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Camiseta Algodão Premium"
                    value={nomeEditProduto}
                    onChange={(e) => setNomeEditProduto(e.target.value)}
                    disabled={loadingProduto}
                    required
                    autoComplete="off"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="valorEditProduto" className="form-label">Preço / Valor de Venda</label>
                  <input
                    id="valorEditProduto"
                    type="text"
                    className="form-input"
                    placeholder="Ex: R$ 0,00"
                    value={valorEditProduto}
                    onChange={handleValorEditChange}
                    disabled={loadingProduto}
                    required
                    autoComplete="off"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Imagem do Produto</label>
                  <div className="upload-container">
                    <div 
                      className="upload-area"
                      onClick={() => !loadingProduto && fileEditInputRef.current?.click()}
                    >
                      {imagemEditPreview ? (
                        <div className="upload-preview-container">
                          <img src={imagemEditPreview} alt="Preview" className="upload-preview" />
                          <button 
                            type="button" 
                            className="upload-remove-btn"
                            onClick={removeSelectedEditImage}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="upload-text">Clique para <span>enviar foto</span></p>
                          <p className="upload-text" style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem'}}>Suporta PNG, JPG, WEBP até 3MB</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileEditInputRef}
                      onChange={handleEditFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={loadingProduto}
                    />
                  </div>
                </div>

                <button type="submit" className="btn" disabled={loadingProduto}>
                  {loadingProduto ? (
                    <>
                      <div className="spinner"></div>
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-danger-outline"
                  style={{ marginTop: '1.25rem' }}
                  onClick={() => setShowProductDeleteConfirm(true)}
                  disabled={loadingProduto}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Excluir Produto
                </button>
              </form>
            </section>
          </main>
        )
      )}

      {/* ==========================================
          VISÃO DA ABA: GESTÃO DE VENDAS (HISTÓRICO)
          ========================================== */}
      {activeTab === 'vendas' && (
        viewVenda === 'list' ? (
          <main className="grid" style={{ gridTemplateColumns: '1fr' }}>
            <section className="card">
              {/* Sub-abas de status */}
              <div className="subtabs-container">
                <button
                  className={`subtab-button ${subTabVendas === 'pendentes' ? 'active' : ''}`}
                  onClick={() => setSubTabVendas('pendentes')}
                >
                  Pendentes de Pagamento ({vendasPendentes.length})
                </button>
                <button
                  className={`subtab-button ${subTabVendas === 'finalizadas' ? 'active' : ''}`}
                  onClick={() => setSubTabVendas('finalizadas')}
                >
                  Vendas Finalizadas ({vendasFinalizadas.length})
                </button>
              </div>

              {/* Barra de Filtros */}
              {subTabVendas === 'finalizadas' && (
                <div className="filter-bar">
                  <span className="filter-title">Filtrar por Mês:</span>
                  <input
                    type="month"
                    className="filter-input"
                    value={filtroMesVendas}
                    onChange={(e) => setFiltroMesVendas(e.target.value)}
                  />
                </div>
              )}

              {fetchingVendas ? (
                <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner" style={{ borderColor: 'rgba(139, 92, 246, 0.3)', borderTopColor: 'var(--accent)', width: '2rem', height: '2rem', borderWidth: '3px' }}></div>
                  <p style={{ marginTop: '1rem' }}>Carregando dados...</p>
                </div>
              ) : (subTabVendas === 'pendentes' ? vendasPendentes : vendasFinalizadas).length === 0 ? (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M-6 9l2 2 4-4" />
                  </svg>
                  <p>Nenhuma venda encontrada nesta aba.</p>
                </div>
              ) : (
                <div className="sales-list">
                  {(subTabVendas === 'pendentes' ? vendasPendentes : vendasFinalizadas).map((venda) => (
                    <article key={venda.id} className="sale-item">
                      <div className="sale-info">
                        <div className="client-avatar" style={{ flexShrink: 0 }}>
                          {getInitials(venda.clientes?.nome || '?')}
                        </div>

                        <div className="sale-details">
                          <h3>Cliente: {venda.clientes?.nome || 'Cliente Removido'}</h3>
                          <p style={{ color: 'var(--text-secondary)' }}>
                            Contato: {venda.clientes?.telefone || 'Sem telefone'}
                          </p>
                          
                          <div className="sale-products-box">
                            <p className="sale-products-title">Produtos:</p>
                            <ul className="sale-products-list">
                              {venda.itens_venda?.map((item) => (
                                <li key={item.id} className="sale-product-item">
                                  <span className="sale-product-name">• {item.produtos?.nome || 'Produto Removido'} ({item.quantidade}x)</span>
                                  <span>{formatCurrency(item.quantidade * item.valor_unitario)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="sale-date" style={{ marginTop: '0.5rem' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Realizada em: {formatDate(venda.created_at)}
                          </div>
                          {venda.pago_em && (
                            <div className="sale-date" style={{ color: 'var(--success)', marginTop: '0.1rem' }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Paga em: {formatDate(venda.pago_em)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="sale-action-zone">
                        <div className="sale-price-box">
                          <div className="sale-total">{formatCurrency(venda.valor_total)}</div>
                          <div className="sale-qty">
                            {venda.itens_venda?.reduce((s, i) => s + i.quantidade, 0) || 0} itens no total
                          </div>
                        </div>

                        <div className="sale-action-buttons">
                          <span className={`status-badge ${venda.status}`}>
                            {venda.status === 'finalizado' ? 'Finalizada' : 'Pendente'}
                          </span>
                          
                          {venda.status === 'pendente' && (
                            <button
                              type="button"
                              className="btn-pay"
                              onClick={() => handleFinalizarPagamento(venda.id)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Receber
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn-client-edit"
                            onClick={() => handleStartEditVenda(venda)}
                            title="Editar Venda"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Botão Flutuante (FAB) de Nova Venda */}
            <button
              type="button"
              className="fab-btn"
              onClick={() => setViewVenda('create')}
              title="Nova Venda"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </main>
        ) : (
          /* Tela Dedicada de Nova Venda (Checkout) */
          <main className="form-screen">
            <div className="back-header">
              <button
                type="button"
                className="btn-back"
                onClick={() => resetNovaVenda()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </button>
              <h2 className="section-title" style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>
                {editingVenda ? 'Editar Venda' : 'Nova Venda'}
              </h2>
            </div>

            <div className="grid" style={{ marginTop: '1rem' }}>
              {checkoutSuccess ? (
                /* Recibo de Sucesso com Compartilhamento de WhatsApp */
                <section className="card success-screen" style={{ gridColumn: '1 / -1' }}>
                  <div className="success-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2>Venda Concluída com Sucesso!</h2>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
                    O registro da venda foi gravado no Supabase. Você pode compartilhar os detalhes da compra diretamente com o cliente agora.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '320px', margin: '1rem auto 0' }}>
                    <button 
                      type="button" 
                      className="btn-whatsapp"
                      onClick={handleShareWhatsapp}
                    >
                      {/* Ícone simples do WhatsApp */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.166.001 6.141 1.233 8.378 3.469 2.237 2.236 3.466 5.21 3.466 8.377 0 6.533-5.325 11.858-11.857 11.858-2.004-.001-3.974-.512-5.733-1.488L0 24zm6.208-3.693c1.691.99 3.324 1.517 5.168 1.519 5.485 0 9.948-4.463 9.95-9.95.001-2.659-1.03-5.158-2.902-7.03C16.59 2.973 14.099 1.943 11.44 1.945c-5.488 0-9.95 4.463-9.952 9.951-.001 1.936.533 3.513 1.523 5.132L1.97 22.03l5.038-1.32.743.431.116-.034zM17.47 15.65c-.32-.16-1.89-.93-2.18-1.04-.3-.1-.51-.16-.73.16-.21.32-.82 1.04-1.01 1.25-.19.22-.38.24-.7.08-.32-.16-1.35-.5-2.58-1.59-.95-.85-1.6-1.9-1.78-2.22-.19-.32-.02-.5.14-.66.15-.15.32-.38.48-.56.16-.18.22-.3.32-.51.1-.22.05-.41-.03-.57-.08-.16-.73-1.76-1-2.4-.27-.66-.54-.57-.73-.58-.19-.01-.41-.01-.63-.01-.22 0-.58.08-.88.4-.3.32-1.15 1.12-1.15 2.73s1.18 3.16 1.34 3.38c.16.22 2.32 3.54 5.62 4.97.78.34 1.4.55 1.87.7.79.25 1.5.21 2.07.13.63-.09 1.89-.77 2.15-1.48.27-.71.27-1.32.19-1.45-.08-.14-.3-.22-.62-.38z"/></svg>
                      Enviar no WhatsApp
                    </button>
                    
                    <button 
                      type="button" 
                      className="btn-outline"
                      onClick={resetNovaVenda}
                    >
                      Registrar Outra Venda
                    </button>
                  </div>
                </section>
              ) : (
                /* Fluxo normal de compras (Carrinho) */
                <>
                  {/* Coluna da esquerda: Formulário de adição de itens */}
                  <section className="card">
                    <h2 className="card-title">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--accent)'}}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      Adicionar ao Carrinho
                    </h2>

                    <form onSubmit={handleAddToCart}>
                      <div className="form-group">
                        <label htmlFor="cartProduto" className="form-label">Produto</label>
                        {produtos.length === 0 ? (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cadastre um produto antes de vender.</p>
                        ) : (
                          <select
                            id="cartProduto"
                            className="form-select"
                            value={currentProdutoId}
                            onChange={(e) => setCurrentProdutoId(e.target.value)}
                            required
                          >
                            <option value="">-- Selecione o Produto --</option>
                            {produtos.map((p) => (
                              <option key={p.id} value={p.id}>{p.nome} - ({formatCurrency(p.valor)})</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="cartQuantidade" className="form-label">Quantidade</label>
                        <div className="qty-selector">
                          <button 
                            type="button" 
                            className="qty-btn"
                            onClick={() => setCurrentQuantidade(Math.max(1, currentQuantidade - 1))}
                          >
                            −
                          </button>
                          <input
                            id="cartQuantidade"
                            type="number"
                            min="1"
                            className="form-input qty-input"
                            value={currentQuantidade}
                            onChange={(e) => setCurrentQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                            required
                          />
                          <button 
                            type="button" 
                            className="qty-btn"
                            onClick={() => setCurrentQuantidade(currentQuantidade + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="btn" 
                        disabled={produtos.length === 0 || !currentProdutoId}
                      >
                        Adicionar Item
                      </button>
                    </form>
                  </section>

                  {/* Coluna da direita: Visualização do Carrinho e Finalização */}
                  <section className="card">
                    <h2 className="card-title">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--accent)'}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      Carrinho de Compras
                    </h2>

                    {cart.length === 0 ? (
                      <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>O carrinho está vazio.</p>
                        <p style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>Adicione produtos usando o formulário ao lado.</p>
                      </div>
                    ) : (
                      <>
                        {/* Tabela do Carrinho */}
                        <div className="cart-table-wrapper">
                          <table className="cart-table">
                            <thead>
                              <tr>
                                <th>Produto</th>
                                <th>Qtd</th>
                                <th>Unitário</th>
                                <th>Subtotal</th>
                                <th style={{ width: '50px' }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {cart.map((item) => (
                                <tr key={item.produtoId}>
                                  <td>{item.nome}</td>
                                  <td>{item.quantidade}</td>
                                  <td>{formatCurrency(item.valor)}</td>
                                  <td>{formatCurrency(item.quantidade * item.valor)}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn-remove-item"
                                      onClick={() => handleRemoveFromCart(item.produtoId)}
                                      title="Remover produto do carrinho"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Caixa de Fechamento */}
                        <form onSubmit={handleCheckout}>
                          <div className="form-group">
                            <label htmlFor="cartCliente" className="form-label">Cliente da Compra</label>
                            {clientes.length === 0 ? (
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cadastre um cliente antes de prosseguir.</p>
                            ) : (
                              <select
                                id="cartCliente"
                                className="form-select"
                                value={cartClienteId}
                                onChange={(e) => setCartClienteId(e.target.value)}
                                required
                              >
                                <option value="">-- Selecione o Cliente --</option>
                                {clientes.map((c) => (
                                  <option key={c.id} value={c.id}>{c.nome} {c.telefone ? `(${c.telefone})` : ''}</option>
                                ))}
                              </select>
                            )}
                          </div>

                          <div className="form-group">
                            <label htmlFor="cartStatusVenda" className="form-label">Status do Pagamento</label>
                            <select
                              id="cartStatusVenda"
                              className="form-select"
                              value={cartStatus}
                              onChange={(e) => setCartStatus(e.target.value as any)}
                              required
                            >
                              <option value="pendente">Pendente de Pagamento</option>
                              <option value="finalizado">Finalizado (Pago)</option>
                            </select>
                          </div>

                          {/* Totalizador */}
                          <div className="total-preview-box">
                            <span className="total-preview-label">Total do Pedido</span>
                            <span className="total-preview-value">{formatCurrency(totalCarrinho)}</span>
                          </div>

                          <button 
                            type="submit" 
                            className="btn" 
                            disabled={loadingCheckout || !cartClienteId || cart.length === 0}
                          >
                            {loadingCheckout ? (
                              <>
                                <div className="spinner"></div>
                                {editingVenda ? 'Salvando...' : 'Finalizando...'}
                              </>
                            ) : (
                              editingVenda ? 'Salvar Alterações' : 'Finalizar Venda'
                            )}
                          </button>
                        </form>
                        {editingVenda && (
                          <button
                            type="button"
                            className="btn btn-danger-outline"
                            style={{ marginTop: '1.25rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            onClick={() => setShowVendaDeleteConfirm(true)}
                            disabled={loadingCheckout}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Excluir Venda
                          </button>
                        )}
                      </>
                    )}
                  </section>
                </>
              )}
            </div>
          </main>
        )
      )}

      {/* Modal de Validação/Confirmação de Exclusão de Cliente */}
      {showDeleteConfirm && editingCliente && (
        <div className="confirm-modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-modal-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="var(--danger)" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Excluir Cliente?
            </h3>
            <p className="confirm-modal-body">
              Tem certeza que deseja excluir <strong>{editingCliente.nome}</strong>?<br />
              Esta ação excluirá permanentemente todos os dados deste cliente e todas as vendas associadas a ele. Esta ação não poderá ser desfeita.
            </p>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loadingCliente}
              >
                Não, cancelar
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleClienteDelete}
                disabled={loadingCliente}
              >
                {loadingCliente ? (
                  <>
                    <div className="spinner"></div>
                    Excluindo...
                  </>
                ) : (
                  'Sim, excluir'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Validação/Confirmação de Exclusão de Produto */}
      {showProductDeleteConfirm && editingProduto && (
        <div className="confirm-modal-backdrop" onClick={() => setShowProductDeleteConfirm(false)}>
          <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-modal-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="var(--danger)" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Excluir Produto?
            </h3>
            <p className="confirm-modal-body">
              Tem certeza que deseja excluir o produto <strong>{editingProduto.nome}</strong>?<br />
              Esta ação excluirá permanentemente os dados do produto e todas as referências dele em vendas passadas. Esta ação não poderá ser desfeita.
            </p>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowProductDeleteConfirm(false)}
                disabled={loadingProduto}
              >
                Não, cancelar
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleProdutoDelete}
                disabled={loadingProduto}
              >
                {loadingProduto ? (
                  <>
                    <div className="spinner"></div>
                    Excluindo...
                  </>
                ) : (
                  'Sim, excluir'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Validação/Confirmação de Exclusão de Venda */}
      {showVendaDeleteConfirm && editingVenda && (
        <div className="confirm-modal-backdrop" onClick={() => setShowVendaDeleteConfirm(false)}>
          <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-modal-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="var(--danger)" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Excluir Venda?
            </h3>
            <p className="confirm-modal-body">
              Tem certeza que deseja excluir esta venda do cliente <strong>{editingVenda.clientes?.nome || 'Cliente Removido'}</strong>?<br />
              Esta ação excluirá permanentemente todos os registros de itens associados e esta venda. Esta ação não poderá ser desfeita.
            </p>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowVendaDeleteConfirm(false)}
                disabled={loadingCheckout}
              >
                Não, cancelar
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleVendaDelete}
                disabled={loadingCheckout}
              >
                {loadingCheckout ? (
                  <>
                    <div className="spinner"></div>
                    Excluindo...
                  </>
                ) : (
                  'Sim, excluir'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renderização de Notificações (Toasts) */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
