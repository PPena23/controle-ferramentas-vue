import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

/** Devolve uma cópia do ref que só é atualizada após `atrasoMs` sem novas alterações. */
export function useDebounce<T>(origem: Ref<T>, atrasoMs = 250): Readonly<Ref<T>> {
  const atrasado = ref(origem.value) as Ref<T>
  let temporizador: ReturnType<typeof setTimeout> | undefined

  watch(origem, (valor) => {
    clearTimeout(temporizador)
    temporizador = setTimeout(() => (atrasado.value = valor), atrasoMs)
  })

  onBeforeUnmount(() => clearTimeout(temporizador))

  return atrasado
}
