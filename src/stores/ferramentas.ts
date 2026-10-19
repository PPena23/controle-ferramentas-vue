import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Categoria, Ferramenta, FerramentaInput } from '@/types'
import { api } from '@/services/api'
import { mensagemDeErro } from '@/composables/useToast'
import { useHistoricoStore } from './historico'

// Store no estilo "setup" (Composition API): ref = state, computed = getters, function = actions.
// Os números de estoque (disponível, abaixo do mínimo…) ficam na store derivada `estoque`,
// que combina ferramentas + empréstimos sem criar dependência circular entre as duas.
export const useFerramentasStore = defineStore('ferramentas', () => {
  const itens = ref<Ferramenta[]>([])
  const carregando = ref(false)
  const carregado = ref(false)
  const salvando = ref(false)
  const erro = ref<string | null>(null)

  // ---------- Getters ----------

  const categoriasEmUso = computed(
    () => [...new Set(itens.value.map((f) => f.categoria))].sort() as Categoria[],
  )

  /** Sugere o próximo código livre no padrão FER-0000. */
  const proximoCodigo = computed(() => {
    const maior = itens.value.reduce((max, f) => {
      const numero = Number(f.codigo.replace(/\D/g, ''))
      return Number.isFinite(numero) ? Math.max(max, numero) : max
    }, 0)
    return `FER-${String(maior + 1).padStart(4, '0')}`
  })

  // ---------- Actions ----------

  function definir(lista: Ferramenta[]) {
    itens.value = lista
    carregado.value = true
    erro.value = null
  }

  /** Insere ou substitui uma ferramenta vinda da API. */
  function aplicar(ferramenta: Ferramenta) {
    const indice = itens.value.findIndex((f) => f.id === ferramenta.id)
    if (indice === -1) itens.value.push(ferramenta)
    else itens.value.splice(indice, 1, ferramenta)
  }

  async function carregar() {
    carregando.value = true
    erro.value = null
    try {
      definir(await api.listarFerramentas())
    } catch (e) {
      erro.value = mensagemDeErro(e)
    } finally {
      carregando.value = false
    }
  }

  // As actions de escrita propagam o erro: quem chamou (a view) decide como avisar o usuário.
  async function criar(dados: FerramentaInput): Promise<Ferramenta> {
    salvando.value = true
    try {
      const { ferramenta, movimentacao } = await api.criarFerramenta(dados)
      aplicar(ferramenta)
      useHistoricoStore().adicionar(movimentacao)
      return ferramenta
    } finally {
      salvando.value = false
    }
  }

  async function atualizar(id: string, dados: FerramentaInput): Promise<Ferramenta> {
    salvando.value = true
    try {
      const { ferramenta, movimentacao } = await api.atualizarFerramenta(id, dados)
      aplicar(ferramenta)
      useHistoricoStore().adicionar(movimentacao)
      return ferramenta
    } finally {
      salvando.value = false
    }
  }

  async function excluir(id: string): Promise<void> {
    salvando.value = true
    try {
      const { movimentacao } = await api.excluirFerramenta(id)
      itens.value = itens.value.filter((f) => f.id !== id)
      useHistoricoStore().adicionar(movimentacao)
    } finally {
      salvando.value = false
    }
  }

  async function concluirManutencao(id: string): Promise<void> {
    salvando.value = true
    try {
      const { ferramenta, movimentacao } = await api.concluirManutencao(id)
      aplicar(ferramenta)
      useHistoricoStore().adicionar(movimentacao)
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
    categoriasEmUso,
    proximoCodigo,
    definir,
    aplicar,
    carregar,
    criar,
    atualizar,
    excluir,
    concluirManutencao,
  }
})
