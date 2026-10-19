import { readonly, ref } from 'vue'

export type TipoToast = 'sucesso' | 'erro' | 'info' | 'aviso'

export interface Toast {
  id: number
  tipo: TipoToast
  titulo: string
  mensagem?: string
}

// Estado no escopo do módulo: todos os componentes que chamam useToast() compartilham a mesma fila.
const toasts = ref<Toast[]>([])
const temporizadores = new Map<number, ReturnType<typeof setTimeout>>()
let proximoId = 1

function remover(id: number): void {
  toasts.value = toasts.value.filter((t) => t.id !== id)
  clearTimeout(temporizadores.get(id))
  temporizadores.delete(id)
}

function mostrar(tipo: TipoToast, titulo: string, mensagem?: string, duracaoMs = 4500): number {
  const id = proximoId++
  toasts.value = [...toasts.value.slice(-3), { id, tipo, titulo, mensagem }] // no máximo 4 na tela
  if (duracaoMs > 0) temporizadores.set(id, setTimeout(() => remover(id), duracaoMs))
  return id
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    remover,
    sucesso: (titulo: string, mensagem?: string) => mostrar('sucesso', titulo, mensagem),
    info: (titulo: string, mensagem?: string) => mostrar('info', titulo, mensagem),
    aviso: (titulo: string, mensagem?: string) => mostrar('aviso', titulo, mensagem, 6000),
    // Erros ficam mais tempo na tela para dar tempo de leitura.
    erro: (titulo: string, mensagem?: string) => mostrar('erro', titulo, mensagem, 8000),
  }
}

/** Extrai uma mensagem legível de qualquer erro lançado (ApiError, Error ou desconhecido). */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof Error) return erro.message
  return 'Ocorreu um erro inesperado. Tente novamente.'
}
