import { onBeforeUnmount, onMounted, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

/**
 * Protege formulários contra perda de dados:
 * - navegação interna (Vue Router): abre um diálogo próprio e aguarda a decisão do usuário;
 * - fechar/recarregar a aba: usa o aviso nativo do navegador (beforeunload).
 */
export function useUnsavedChangesGuard(temAlteracoes: MaybeRefOrGetter<boolean>) {
  const dialogoAberto = ref(false)
  let decidir: ((podeSair: boolean) => void) | null = null

  onBeforeRouteLeave(() => {
    if (!toValue(temAlteracoes)) return true
    dialogoAberto.value = true
    // A navegação fica "pendente" até o usuário escolher no diálogo.
    return new Promise<boolean>((resolve) => (decidir = resolve))
  })

  function aoFecharAba(evento: BeforeUnloadEvent) {
    if (toValue(temAlteracoes)) evento.preventDefault()
  }

  onMounted(() => window.addEventListener('beforeunload', aoFecharAba))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', aoFecharAba))

  function responder(podeSair: boolean) {
    dialogoAberto.value = false
    decidir?.(podeSair)
    decidir = null
  }

  return {
    dialogoAberto,
    sairMesmoAssim: () => responder(true),
    continuarEditando: () => responder(false),
  }
}
