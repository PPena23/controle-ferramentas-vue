import { computed } from 'vue'
import { api } from '@/services/api'
import { useFerramentasStore } from '@/stores/ferramentas'
import { useEmprestimosStore } from '@/stores/emprestimos'
import { useHistoricoStore } from '@/stores/historico'

/** Orquestra o carregamento das três stores de dados (usado no App e nas telas de erro). */
export function useDados() {
  const ferramentas = useFerramentasStore()
  const emprestimos = useEmprestimosStore()
  const historico = useHistoricoStore()

  const carregando = computed(() => ferramentas.carregando || emprestimos.carregando || historico.carregando)
  const pronto = computed(() => ferramentas.carregado && emprestimos.carregado && historico.carregado)
  const erro = computed(() => ferramentas.erro ?? emprestimos.erro ?? historico.erro)

  /** Primeira carga: mostra skeleton enquanto ainda não há dados. */
  const carregandoInicial = computed(() => !pronto.value && !erro.value)

  async function carregarTudo(): Promise<void> {
    // As três requisições correm em paralelo.
    await Promise.all([ferramentas.carregar(), emprestimos.carregar(), historico.carregar()])
  }

  async function restaurarExemplo(): Promise<void> {
    const banco = await api.restaurarDadosDeExemplo()
    ferramentas.definir(banco.ferramentas)
    emprestimos.definir(banco.emprestimos)
    historico.definir(banco.movimentacoes)
  }

  return { carregando, carregandoInicial, pronto, erro, carregarTudo, restaurarExemplo }
}
