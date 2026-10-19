import { ref, watch, type Ref } from 'vue'

/**
 * Ref (de um objeto) persistido no localStorage: lê na criação e grava a cada mudança (watch profundo).
 * Chaves novas do `padrao` são mescladas com o que já estava salvo.
 */
export function useLocalStorage<T extends object>(chave: string, padrao: T): Ref<T> {
  const estado = ref(ler()) as Ref<T>

  function ler(): T {
    try {
      const bruto = localStorage.getItem(chave)
      return bruto === null ? padrao : { ...padrao, ...(JSON.parse(bruto) as T) }
    } catch {
      return padrao // modo anônimo, storage bloqueado ou JSON inválido: segue com o padrão
    }
  }

  watch(
    estado,
    (valor) => {
      try {
        localStorage.setItem(chave, JSON.stringify(valor))
      } catch {
        /* sem espaço ou storage bloqueado: preferências são opcionais */
      }
    },
    { deep: true },
  )

  return estado
}
