// API simulada.
// Funciona como um "back-end de mentira": guarda os dados no localStorage, responde com
// Promises após um pequeno atraso de rede e aplica as regras de negócio (código único,
// estoque disponível etc.). Assim os estados de carregamento e erro na interface são reais,
// e trocar por um back-end de verdade (fetch/axios) exigiria mexer só neste arquivo.

import type {
  BancoDeDados,
  DevolucaoInput,
  Emprestimo,
  Ferramenta,
  FerramentaInput,
  Movimentacao,
  NovoEmprestimoInput,
  TipoMovimentacao,
} from '@/types'
import { gerarDadosDeExemplo, OPERADOR_PADRAO } from '@/data/seed'
import { gerarId, normalizar } from '@/utils/formatadores'
import { calcularEstoque } from '@/utils/estoque'

const CHAVE_BANCO = 'almoxarifado-ferramentas:db:v1'
const ATRASO_MINIMO_MS = 250
const ATRASO_MAXIMO_MS = 650

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ---------- Simulação de falha (para demonstrar os estados de erro) ----------

let falharProximaRequisicao = false

export function simularFalhaNaProximaRequisicao(): void {
  falharProximaRequisicao = true
}

// ---------- Infraestrutura ----------

const esperar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function lerBanco(): BancoDeDados {
  const bruto = localStorage.getItem(CHAVE_BANCO)
  if (!bruto) {
    const novo = gerarDadosDeExemplo()
    gravarBanco(novo)
    return novo
  }
  try {
    return JSON.parse(bruto) as BancoDeDados
  } catch {
    throw new ApiError('Os dados salvos estão corrompidos. Use "Restaurar dados de exemplo".', 500)
  }
}

function gravarBanco(banco: BancoDeDados): void {
  localStorage.setItem(CHAVE_BANCO, JSON.stringify(banco))
}

/** Envelopa toda operação: atraso de rede, falha simulada, leitura/gravação e cópia da resposta. */
async function requisicao<T>(operacao: (banco: BancoDeDados) => T, escrita = false): Promise<T> {
  await esperar(ATRASO_MINIMO_MS + Math.random() * (ATRASO_MAXIMO_MS - ATRASO_MINIMO_MS))

  if (falharProximaRequisicao) {
    falharProximaRequisicao = false
    throw new ApiError('Falha de conexão simulada. Verifique a rede e tente novamente.', 503)
  }

  const banco = lerBanco()
  const resultado = operacao(banco)
  if (escrita) gravarBanco(banco)

  // Devolve uma cópia, como uma resposta HTTP faria: ninguém fora daqui altera o "banco".
  return JSON.parse(JSON.stringify(resultado ?? null)) as T
}

function buscarFerramenta(banco: BancoDeDados, id: string): Ferramenta {
  const ferramenta = banco.ferramentas.find((f) => f.id === id)
  if (!ferramenta) throw new ApiError('Ferramenta não encontrada.', 404)
  return ferramenta
}

function unidadesEmprestadas(banco: BancoDeDados, ferramentaId: string): number {
  return banco.emprestimos
    .filter((e) => e.ferramentaId === ferramentaId && !e.dataDevolucao)
    .reduce((soma, e) => soma + e.quantidade, 0)
}

function registrarMovimentacao(
  banco: BancoDeDados,
  ferramenta: Ferramenta,
  tipo: TipoMovimentacao,
  descricao: string,
): Movimentacao {
  const movimentacao: Movimentacao = {
    id: gerarId('mov'),
    tipo,
    ferramentaId: ferramenta.id,
    ferramentaCodigo: ferramenta.codigo,
    ferramentaNome: ferramenta.nome,
    descricao,
    responsavel: OPERADOR_PADRAO,
    data: new Date().toISOString(),
  }
  banco.movimentacoes.unshift(movimentacao)
  return movimentacao
}

function validarCodigoUnico(banco: BancoDeDados, codigo: string, ignorarId?: string): void {
  const alvo = normalizar(codigo)
  const duplicada = banco.ferramentas.some((f) => f.id !== ignorarId && normalizar(f.codigo) === alvo)
  if (duplicada) throw new ApiError(`Já existe uma ferramenta com o código ${codigo}.`, 409)
}

// ---------- Ferramentas ----------

export const api = {
  listarFerramentas(): Promise<Ferramenta[]> {
    return requisicao((banco) => banco.ferramentas)
  },

  criarFerramenta(dados: FerramentaInput): Promise<{ ferramenta: Ferramenta; movimentacao: Movimentacao }> {
    return requisicao((banco) => {
      validarCodigoUnico(banco, dados.codigo)
      const agora = new Date().toISOString()
      const ferramenta: Ferramenta = {
        ...dados,
        codigo: dados.codigo.toUpperCase(),
        id: gerarId('fer'),
        criadoEm: agora,
        atualizadoEm: agora,
      }
      banco.ferramentas.push(ferramenta)
      const movimentacao = registrarMovimentacao(
        banco,
        ferramenta,
        'cadastro',
        `Cadastrada com ${ferramenta.quantidadeTotal} unidade(s) em ${ferramenta.local}.`,
      )
      return { ferramenta, movimentacao }
    }, true)
  },

  atualizarFerramenta(
    id: string,
    dados: FerramentaInput,
  ): Promise<{ ferramenta: Ferramenta; movimentacao: Movimentacao }> {
    return requisicao((banco) => {
      const atual = buscarFerramenta(banco, id)
      validarCodigoUnico(banco, dados.codigo, id)

      const emprestadas = unidadesEmprestadas(banco, id)
      if (dados.quantidadeTotal < emprestadas + dados.emManutencao) {
        throw new ApiError(
          `A quantidade total não pode ser menor que ${emprestadas + dados.emManutencao} (emprestadas + em manutenção).`,
        )
      }

      const alteracoes = descreverAlteracoes(atual, dados)
      Object.assign(atual, dados, { codigo: dados.codigo.toUpperCase(), atualizadoEm: new Date().toISOString() })
      const movimentacao = registrarMovimentacao(banco, atual, 'edicao', alteracoes)
      return { ferramenta: atual, movimentacao }
    }, true)
  },

  excluirFerramenta(id: string): Promise<{ movimentacao: Movimentacao }> {
    return requisicao((banco) => {
      const ferramenta = buscarFerramenta(banco, id)
      if (unidadesEmprestadas(banco, id) > 0) {
        throw new ApiError('Não é possível excluir: há unidades emprestadas desta ferramenta.', 409)
      }
      banco.ferramentas = banco.ferramentas.filter((f) => f.id !== id)
      const movimentacao = registrarMovimentacao(banco, ferramenta, 'exclusao', 'Ferramenta removida do catálogo.')
      return { movimentacao }
    }, true)
  },

  concluirManutencao(id: string): Promise<{ ferramenta: Ferramenta; movimentacao: Movimentacao }> {
    return requisicao((banco) => {
      const ferramenta = buscarFerramenta(banco, id)
      const unidades = ferramenta.emManutencao
      if (unidades === 0 && ferramenta.estado !== 'manutencao') {
        throw new ApiError('Esta ferramenta não está em manutenção.')
      }
      ferramenta.emManutencao = 0
      ferramenta.estado = 'bom'
      ferramenta.atualizadoEm = new Date().toISOString()
      const movimentacao = registrarMovimentacao(
        banco,
        ferramenta,
        'manutencao',
        `Manutenção concluída: ${unidades} un. de volta ao estoque.`,
      )
      return { ferramenta, movimentacao }
    }, true)
  },

  // ---------- Empréstimos ----------

  listarEmprestimos(): Promise<Emprestimo[]> {
    return requisicao((banco) => banco.emprestimos)
  },

  registrarRetirada(dados: NovoEmprestimoInput): Promise<{ emprestimo: Emprestimo; movimentacao: Movimentacao }> {
    return requisicao((banco) => {
      const ferramenta = buscarFerramenta(banco, dados.ferramentaId)
      const { disponivel } = calcularEstoque(ferramenta, unidadesEmprestadas(banco, ferramenta.id))

      if (dados.quantidade < 1) throw new ApiError('Informe ao menos 1 unidade.')
      if (dados.quantidade > disponivel) {
        throw new ApiError(`Estoque insuficiente: só há ${disponivel} unidade(s) disponível(is).`, 409)
      }

      const emprestimo: Emprestimo = {
        id: gerarId('emp'),
        ferramentaId: ferramenta.id,
        quantidade: dados.quantidade,
        colaborador: dados.colaborador.trim(),
        setor: dados.setor,
        dataRetirada: new Date().toISOString(),
        dataPrevista: dados.dataPrevista,
        dataDevolucao: null,
        observacao: dados.observacao.trim(),
        devolvidaComDefeito: false,
      }
      banco.emprestimos.unshift(emprestimo)
      const movimentacao = registrarMovimentacao(
        banco,
        ferramenta,
        'retirada',
        `${emprestimo.quantidade} un. retirada(s) por ${emprestimo.colaborador} (${emprestimo.setor}).`,
      )
      return { emprestimo, movimentacao }
    }, true)
  },

  registrarDevolucao(
    dados: DevolucaoInput,
  ): Promise<{ emprestimo: Emprestimo; ferramenta: Ferramenta; movimentacoes: Movimentacao[] }> {
    return requisicao((banco) => {
      const emprestimo = banco.emprestimos.find((e) => e.id === dados.emprestimoId)
      if (!emprestimo) throw new ApiError('Empréstimo não encontrado.', 404)
      if (emprestimo.dataDevolucao) throw new ApiError('Este empréstimo já foi devolvido.', 409)

      const ferramenta = buscarFerramenta(banco, emprestimo.ferramentaId)
      emprestimo.dataDevolucao = new Date().toISOString()
      emprestimo.devolvidaComDefeito = dados.comDefeito
      emprestimo.observacao = dados.observacao.trim() || emprestimo.observacao

      const movimentacoes = [
        registrarMovimentacao(
          banco,
          ferramenta,
          'devolucao',
          `${emprestimo.quantidade} un. devolvida(s) por ${emprestimo.colaborador}${dados.comDefeito ? ' — com defeito' : ''}.`,
        ),
      ]

      // Regra de negócio: devolução com defeito manda 1 unidade para a manutenção.
      if (dados.comDefeito) {
        ferramenta.emManutencao += 1
        if (ferramenta.estado === 'bom') ferramenta.estado = 'manutencao'
        ferramenta.atualizadoEm = new Date().toISOString()
        movimentacoes.unshift(
          registrarMovimentacao(
            banco,
            ferramenta,
            'manutencao',
            `1 un. enviada para manutenção${dados.observacao.trim() ? `: ${dados.observacao.trim()}` : '.'}`,
          ),
        )
      }

      return { emprestimo, ferramenta, movimentacoes }
    }, true)
  },

  // ---------- Histórico ----------

  listarMovimentacoes(): Promise<Movimentacao[]> {
    return requisicao((banco) => [...banco.movimentacoes].sort((a, b) => b.data.localeCompare(a.data)))
  },

  // ---------- Utilidades ----------

  /** Recria o banco com os dados fictícios (funciona mesmo se o localStorage estiver corrompido). */
  async restaurarDadosDeExemplo(): Promise<BancoDeDados> {
    localStorage.removeItem(CHAVE_BANCO)
    return requisicao((banco) => banco)
  },
}

function descreverAlteracoes(antes: Ferramenta, depois: FerramentaInput): string {
  const rotulos: Partial<Record<keyof FerramentaInput, string>> = {
    codigo: 'código',
    nome: 'nome',
    categoria: 'categoria',
    marca: 'marca',
    local: 'local',
    quantidadeTotal: 'quantidade total',
    estoqueMinimo: 'estoque mínimo',
    valorUnitario: 'valor unitário',
    estado: 'estado',
    emManutencao: 'unidades em manutenção',
  }
  const campos = (Object.keys(rotulos) as (keyof FerramentaInput)[]).filter((c) => antes[c] !== depois[c])
  if (campos.length === 0) return 'Cadastro salvo sem alterações.'
  return `Alterado: ${campos.map((c) => rotulos[c]).join(', ')}.`
}
