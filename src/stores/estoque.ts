import { defineStore } from 'pinia'
import { computed } from 'vue'
import type { FerramentaComEstoque } from '@/types'
import { calcularEstoque } from '@/utils/estoque'
import { useFerramentasStore } from './ferramentas'
import { useEmprestimosStore } from './emprestimos'

/**
 * Store derivada (só getters): cruza o catálogo com os empréstimos em aberto.
 * Não guarda estado próprio — tudo é computed, então se atualiza sozinho
 * a cada retirada, devolução ou edição de ferramenta.
 */
export const useEstoqueStore = defineStore('estoque', () => {
  const ferramentas = useFerramentasStore()
  const emprestimos = useEmprestimosStore()

  /** Catálogo com disponível/emprestadas calculados. */
  const comEstoque = computed<FerramentaComEstoque[]>(() =>
    ferramentas.itens.map((f) => calcularEstoque(f, emprestimos.unidadesEmprestadasPorFerramenta.get(f.id) ?? 0)),
  )

  const porId = computed(() => new Map(comEstoque.value.map((f) => [f.id, f])))

  /** Mais críticas primeiro (menor proporção disponível/mínimo). */
  const abaixoDoMinimo = computed(() =>
    comEstoque.value
      .filter((f) => f.abaixoDoMinimo)
      .sort((a, b) => a.disponivel / Math.max(a.estoqueMinimo, 1) - b.disponivel / Math.max(b.estoqueMinimo, 1)),
  )

  const totais = computed(() =>
    comEstoque.value.reduce(
      (acc, f) => {
        if (f.estado !== 'baixada') {
          acc.unidades += f.quantidadeTotal
          acc.valorPatrimonio += f.quantidadeTotal * f.valorUnitario
        }
        acc.disponiveis += f.disponivel
        acc.emprestadas += f.emprestadas
        acc.emManutencao += f.emManutencao
        return acc
      },
      { unidades: 0, disponiveis: 0, emprestadas: 0, emManutencao: 0, valorPatrimonio: 0 },
    ),
  )

  return { comEstoque, porId, abaixoDoMinimo, totais }
})
