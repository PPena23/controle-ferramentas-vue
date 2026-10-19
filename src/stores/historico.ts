import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Movimentacao } from '@/types'
import { api } from '@/services/api'
import { mensagemDeErro } from '@/composables/useToast'

export const useHistoricoStore = defineStore('historico', () => {
  const itens = ref<Movimentacao[]>([])
  const carregando = ref(false)
  const carregado = ref(false)
  const erro = ref<string | null>(null)

  /** Mais recentes primeiro. */
  const ordenadas = computed(() => [...itens.value].sort((a, b) => b.data.localeCompare(a.data)))

  function definir(lista: Movimentacao[]) {
    itens.value = lista
    carregado.value = true
    erro.value = null
  }

  function adicionar(...novas: Movimentacao[]) {
    itens.value.unshift(...novas)
  }

  async function carregar() {
    carregando.value = true
    erro.value = null
    try {
      definir(await api.listarMovimentacoes())
    } catch (e) {
      erro.value = mensagemDeErro(e)
    } finally {
      carregando.value = false
    }
  }

  return { itens, carregando, carregado, erro, ordenadas, definir, adicionar, carregar }
})
