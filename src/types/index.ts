// Tipos de domínio do Almoxarifado de Ferramentas.
// Centralizar os tipos aqui mantém stores, serviços e componentes falando a mesma língua.

export const CATEGORIAS = [
  'Elétricas',
  'Manuais',
  'Medição',
  'Segurança/EPI',
  'Jardinagem',
  'Hidráulica',
] as const

export type Categoria = (typeof CATEGORIAS)[number]

export type EstadoFerramenta = 'bom' | 'manutencao' | 'baixada'

export const ESTADOS: ReadonlyArray<{ valor: EstadoFerramenta; rotulo: string }> = [
  { valor: 'bom', rotulo: 'Bom' },
  { valor: 'manutencao', rotulo: 'Manutenção' },
  { valor: 'baixada', rotulo: 'Baixada' },
]

export const SETORES = [
  'Manutenção predial',
  'Elétrica',
  'Hidráulica',
  'Obras',
  'Jardinagem',
  'Oficina mecânica',
] as const

export interface Ferramenta {
  id: string
  codigo: string
  nome: string
  categoria: Categoria
  marca: string
  local: string
  quantidadeTotal: number
  estoqueMinimo: number
  valorUnitario: number
  estado: EstadoFerramenta
  /** Unidades fisicamente na oficina de manutenção (indisponíveis para retirada). */
  emManutencao: number
  criadoEm: string
  atualizadoEm: string
}

/** Dados editáveis pelo formulário de cadastro/edição. */
export type FerramentaInput = Omit<Ferramenta, 'id' | 'criadoEm' | 'atualizadoEm'>

/** Ferramenta enriquecida com os números de estoque calculados. */
export interface FerramentaComEstoque extends Ferramenta {
  emprestadas: number
  disponivel: number
  abaixoDoMinimo: boolean
}

export interface Emprestimo {
  id: string
  ferramentaId: string
  quantidade: number
  colaborador: string
  setor: string
  /** Data/hora ISO da retirada. */
  dataRetirada: string
  /** Data prevista de devolução (AAAA-MM-DD). */
  dataPrevista: string
  /** Data/hora ISO da devolução, ou null enquanto estiver emprestado. */
  dataDevolucao: string | null
  observacao: string
  devolvidaComDefeito: boolean
}

export type StatusEmprestimo = 'ativo' | 'atrasado' | 'devolvido'

export interface EmprestimoDetalhado extends Emprestimo {
  status: StatusEmprestimo
  diasAtraso: number
  ferramenta: Ferramenta | undefined
}

export interface NovoEmprestimoInput {
  ferramentaId: string
  quantidade: number
  colaborador: string
  setor: string
  dataPrevista: string
  observacao: string
}

export interface DevolucaoInput {
  emprestimoId: string
  comDefeito: boolean
  observacao: string
}

export type TipoMovimentacao =
  | 'cadastro'
  | 'edicao'
  | 'retirada'
  | 'devolucao'
  | 'manutencao'
  | 'exclusao'

export interface Movimentacao {
  id: string
  tipo: TipoMovimentacao
  ferramentaId: string
  /** Código e nome são copiados no momento do evento para o histórico sobreviver a edições/exclusões. */
  ferramentaCodigo: string
  ferramentaNome: string
  descricao: string
  responsavel: string
  data: string
}

export interface BancoDeDados {
  ferramentas: Ferramenta[]
  emprestimos: Emprestimo[]
  movimentacoes: Movimentacao[]
}

// ---------- Tipos de UI ----------

export type Tom = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

export type DirecaoOrdenacao = 'asc' | 'desc'

export interface Ordenacao {
  coluna: string
  direcao: DirecaoOrdenacao
}

export interface ColunaTabela<T> {
  chave: string
  rotulo: string
  ordenavel?: boolean
  /** Valor usado para ordenar. Se omitido, usa linha[chave]. */
  valor?: (linha: T) => string | number
  alinhamento?: 'inicio' | 'fim' | 'centro'
  /** Esconde a coluna no layout de cartões (mobile). */
  ocultarNoMobile?: boolean
}

export interface OpcaoSelect {
  valor: string
  rotulo: string
  desabilitada?: boolean
}

export interface ItemGrafico {
  rotulo: string
  valor: number
  /** Valor secundário exibido em destaque (ex.: unidades em uso agora). */
  destaque: number
}
