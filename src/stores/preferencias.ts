import { defineStore } from 'pinia'
import { computed } from 'vue'
import type { Ordenacao } from '@/types'
import { useLocalStorage } from '@/composables/useLocalStorage'

interface Preferencias {
  ordenacaoFerramentas: Ordenacao
  ordenacaoEmprestimos: Ordenacao
}

/**
 * Preferências de interface do usuário, persistidas no localStorage via composable
 * (watch profundo). Os dados de negócio são persistidos pela API simulada.
 */
export const usePreferenciasStore = defineStore('preferencias', () => {
  const estado = useLocalStorage<Preferencias>('almoxarifado-ferramentas:preferencias', {
    ordenacaoFerramentas: { coluna: 'codigo', direcao: 'asc' },
    ordenacaoEmprestimos: { coluna: 'dataPrevista', direcao: 'asc' },
  })

  const ordenacaoFerramentas = computed({
    get: () => estado.value.ordenacaoFerramentas,
    set: (valor: Ordenacao) => (estado.value.ordenacaoFerramentas = valor),
  })

  const ordenacaoEmprestimos = computed({
    get: () => estado.value.ordenacaoEmprestimos,
    set: (valor: Ordenacao) => (estado.value.ordenacaoEmprestimos = valor),
  })

  return { ordenacaoFerramentas, ordenacaoEmprestimos }
})
