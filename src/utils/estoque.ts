import type {
  Emprestimo,
  EstadoFerramenta,
  Ferramenta,
  FerramentaComEstoque,
  StatusEmprestimo,
  Tom,
  TipoMovimentacao,
} from '@/types'
import { diasEntre, hojeISO } from './datas'

/**
 * Regra central de estoque:
 * disponível = total − emprestadas − em manutenção (ferramentas baixadas ficam sempre com 0).
 */
export function calcularEstoque(ferramenta: Ferramenta, emprestadas: number): FerramentaComEstoque {
  const disponivel =
    ferramenta.estado === 'baixada'
      ? 0
      : Math.max(0, ferramenta.quantidadeTotal - emprestadas - ferramenta.emManutencao)

  return {
    ...ferramenta,
    emprestadas,
    disponivel,
    abaixoDoMinimo: ferramenta.estado !== 'baixada' && disponivel < ferramenta.estoqueMinimo,
  }
}

export function statusDoEmprestimo(emprestimo: Emprestimo, hoje = hojeISO()): StatusEmprestimo {
  if (emprestimo.dataDevolucao) return 'devolvido'
  return emprestimo.dataPrevista < hoje ? 'atrasado' : 'ativo'
}

export function diasDeAtraso(emprestimo: Emprestimo, hoje = hojeISO()): number {
  if (emprestimo.dataDevolucao) return 0
  return Math.max(0, diasEntre(emprestimo.dataPrevista, hoje))
}

// ---------- Metadados de exibição (rótulo + tom + ícone) ----------
// Status nunca é comunicado apenas por cor: sempre há texto e ícone juntos.

export const META_ESTADO: Record<EstadoFerramenta, { rotulo: string; tom: Tom; icone: string }> = {
  bom: { rotulo: 'Bom', tom: 'success', icone: 'check-circle' },
  manutencao: { rotulo: 'Manutenção', tom: 'warning', icone: 'wrench' },
  baixada: { rotulo: 'Baixada', tom: 'neutral', icone: 'ban' },
}

export const META_STATUS_EMPRESTIMO: Record<StatusEmprestimo, { rotulo: string; tom: Tom; icone: string }> = {
  ativo: { rotulo: 'Em uso', tom: 'info', icone: 'clock' },
  atrasado: { rotulo: 'Atrasado', tom: 'danger', icone: 'alert' },
  devolvido: { rotulo: 'Devolvido', tom: 'success', icone: 'check-circle' },
}

export const META_MOVIMENTACAO: Record<TipoMovimentacao, { rotulo: string; tom: Tom; icone: string }> = {
  cadastro: { rotulo: 'Cadastro', tom: 'primary', icone: 'plus' },
  edicao: { rotulo: 'Edição', tom: 'neutral', icone: 'pencil' },
  retirada: { rotulo: 'Retirada', tom: 'info', icone: 'log-out' },
  devolucao: { rotulo: 'Devolução', tom: 'success', icone: 'undo' },
  manutencao: { rotulo: 'Manutenção', tom: 'warning', icone: 'wrench' },
  exclusao: { rotulo: 'Exclusão', tom: 'danger', icone: 'trash' },
}
