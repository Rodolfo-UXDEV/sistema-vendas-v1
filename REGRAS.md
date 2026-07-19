# Regras do Projeto

Este documento define as regras, boas práticas e fluxo de trabalho para o desenvolvimento deste projeto.

---

## 1. Diretrizes de Comunicação e Idioma
- Toda a comunicação entre o assistente de IA (Antigravity) e o desenvolvedor será feita em **português**.
- Respostas diretas, claras e concisas.
- Links para arquivos no formato Markdown clicável sempre que um arquivo ou símbolo de código for mencionado.

## 2. Registro Obrigatório de Histórico (`HISTORICO.md`)
- **Regra de Ouro**: Todo e qualquer avanço, alteração no código, correção de bugs, mudança de requisitos ou decisão de design relevante deve ser documentada cronologicamente no arquivo [HISTORICO.md](file:///c:/Users/RodolfoRodriguesdoNa/.gemini/antigravity-ide/scratch/sistema-vendas-v1/HISTORICO.md).
- Este registro garante a rastreabilidade e impede a perda do progresso feito em sessões anteriores.

## 3. Fluxo de Trabalho (Planejamento e Execução)
- **Modo Planejamento**: Para qualquer mudança estrutural, criação de novas funcionalidades ou alterações complexas, deve ser criado um plano de implementação (`implementation_plan.md`) a ser aprovado antes do início do código.
- **Modo Execução**: Após a aprovação do plano, as tarefas são listadas no `task.md` e marcadas como concluídas à medida que avançamos.
- **Validação**: Todas as entregas devem ser testadas/verificadas e acompanhadas por um arquivo de walkthrough (`walkthrough.md`) com os resultados.

## 4. Padrões de Design e Qualidade (Desenvolvimento Web)
- **Estética Visual**: Interfaces modernas e elegantes. Utilização de paletas de cores refinadas (HSL customizado, dark mode moderno, etc.), tipografia contemporânea e micro-animações.
- **Responsividade**: Todo o layout deve se adaptar fluidamente a diferentes tamanhos de tela.
- **Sem Placeholders**: Imagens reais ou ilustrações reais (geradas ou válidas), dados simulados realistas.
- **SEO e Semântica**: Seguir a hierarquia semântica do HTML (uma tag `<h1>` por página, tags estruturais apropriadas) e tags meta essenciais.
- **Padronização de Iconografia**: Devemos manter rigorosamente a consistência visual dos ícones do projeto. Botões com a mesma finalidade (ex: botão Editar) em diferentes abas ou listagens devem utilizar exatamente a mesma representação de ícone SVG inline e os mesmos estilos de CSS correspondentes.

## 5. Stack Tecnológica e Práticas de Código
- **Framework Frontend**: O projeto deve ser desenvolvido utilizando **React** (utilizando Vite para inicialização rápida e moderna).
- **Banco de Dados & Backend**: O banco de dados e serviços de backend (como autenticação, storage, real-time) utilizarão **Supabase**.
- **Qualidade de Código**:
  - Código limpo, altamente organizado, legível e bem comentado (comentários úteis explicando o porquê das decisões, e não apenas o que o código faz).
  - Sem código morto: Escrever estritamente o código que de fato será utilizado no projeto.
- **Segurança**:
  - Segurança em primeiro lugar: Variáveis de ambiente configuradas corretamente (arquivos `.env` protegidos).
  - Políticas de RLS (Row Level Security) no Supabase ativadas e configuradas adequadamente para impedir acesso não autorizado aos dados.
  - Sanitização de inputs e tratamento robusto de erros tanto no frontend quanto no backend.

