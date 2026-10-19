import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { DevolucaoInput, Emprestimo, EmprestimoDetalhado, NovoEmprestimoInput } from '@/types'
import { api } from '@/services/api'
import { diasDeAtraso, statusDoEmprestimo } from '@/utils/estoque'
import { hojeISO } from '@/utils/datas'
import { mensagemDeErro } from '@/composables/useToast'
import { useFerramentasStore } from './ferramentas'
import { useHistoricoStore } from './historico'

export const useEmprestimosStore = defineStore('emprestimos', () => {
  const itens = ref<Emprestimo[]>([])
  const carregando = ref(false)
  const carregado = ref(false)
  const salvando = ref(false)
  const erro = ref<string | null>(null)

  // ---------- Getters ----------

  /** Soma das unidades em aberto por ferramenta (usada no cálculo de disponibilidade). */
  const unidadesEmprestadasPorFerramenta = computed(() => {
    const mapa = new Map<string, number>()
    for (const e of itens.value) {
      if (!e.dataDevolucao) mapa.set(e.ferramentaId, (mapa.get(e.ferramentaId) ?? 0) + e.quantidade)
    }
    return mapa
  })

  const detalhados = computed<EmprestimoDetalhado[]>(() => {
    const hoje = hojeISO()
    const ferramentas = new Map(useFerramentasStore().itens.map((f) => [f.id, f]))
    return itens.value
      .map((e) => ({
        ...e,
        status: statusDoEmprestimo(e, hoje),
        diasAtraso: diasDeAtraso(e, hoje),
        ferramenta: ferramentas.get(e.ferramentaId),
      }))
      .sort((a, b) => b.dataRetirada.localeCompare(a.dataRetirada))
  })

  const emAberto = computed(() => detalhados.value.filter((e) => e.status !== 'devolvido'))
  const atrasados = computed(() =>
    detalhados.value.filter((e) => e.status === 'atrasado').sort((a, b) => b.diasAtraso - a.diasAtraso),
  )
  const devolvidos = computed(() => detalhados.value.filter((e) => e.status === 'devolvido'))

  /** Nomes já usados, para sugerir no campo "colaborador" (datalist). */
  const colaboradores = computed(() => [...new Set(itens.value.map((e) => e.colaborador))].sort())

  // ---------- Actions ----------

  function definir(lista: Emprestimo[]) {
    itens.value = lista
    carregado.value = true
    erro.value = null
  }

  async function carregar() {
    carregando.value = true
    erro.value = null
    try {
      definir(await api.listarEmprestimos())
    } catch (e) {
      erro.value = mensagemDeErro(e)
    } finally {
      carregando.value = false
    }
  }

  async function registrarRetirada(dados: NovoEmprestimoInput): Promise<Emprestimo> {
    salvando.value = true
    try {
      const { emprestimo, movimentacao } = await api.registrarRetirada(dados)
      itens.value.unshift(emprestimo)
      useHistoricoStore().adicionar(movimentacao)
      return emprestimo
    } finally {
      salvando.value = false
    }
  }

  async function registrarDevolucao(dados: DevolucaoInput): Promise<Emprestimo> {
    salvando.value = true
    try {
      const { emprestimo, ferramenta, movimentacoes } = await api.registrarDevolucao(dados)
      const indice = itens.value.findIndex((e) => e.id === emprestimo.id)
      if (indice !== -1) itens.value.splice(indice, 1, emprestimo)
      useFerramentasStore().aplicar(ferramenta) // a ferramenta pode ter ido para manutenção
      useHistoricoStore().adicionar(...movimentacoes)
      return emprestimo
    } finally {
      salvando.value = false
    }
  }

  return {
    itens,
    carregando,
    carregado,
    salvando,
    erro,
    unidadesEmprestadasPorFerramenta,
    detalhados,
    emAberto,
    atrasados,
    devolvidos,
    colaboradores,
    definir,
    carregar,
    registrarRetirada,
    registrarDevolucao,
  }
})
