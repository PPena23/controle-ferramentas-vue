import { computed, reactive, ref } from 'vue'

/** Uma regra devolve `true` quando o valor é válido, ou a mensagem de erro. */
export type Regra<V, F> = (valor: V, formulario: F) => true | string
export type Regras<F> = { [K in keyof F]?: Regra<F[K], F>[] }

/**
 * Validação declarativa de formulários.
 * - `erros` é um computed: reavalia sozinho quando o formulário (ou qualquer dado reativo usado nas regras) muda.
 * - `erro(campo)` só exibe a mensagem depois que o campo foi "tocado" (blur) ou houve tentativa de envio,
 *   para não gritar com o usuário antes de ele digitar.
 */
export function useFormValidation<F extends object>(formulario: F, regras: Regras<F>) {
  const tocados = reactive<Record<string, boolean>>({})
  const tentouEnviar = ref(false)

  const erros = computed(() => {
    const resultado: Partial<Record<keyof F, string>> = {}
    for (const campo of Object.keys(regras) as (keyof F)[]) {
      const lista = (regras[campo] ?? []) as Regra<unknown, F>[]
      for (const regra of lista) {
        const r = regra(formulario[campo], formulario)
        if (r !== true) {
          resultado[campo] = r
          break // mostra só o primeiro erro de cada campo
        }
      }
    }
    return resultado
  })

  const valido = computed(() => Object.keys(erros.value).length === 0)

  function erro(campo: keyof F): string | undefined {
    const visivel = tentouEnviar.value || tocados[String(campo)]
    return visivel ? erros.value[campo] : undefined
  }

  function tocar(campo: keyof F): void {
    tocados[String(campo)] = true
  }

  /** Marca tudo como tocado e devolve se o formulário pode ser enviado. */
  function validarTudo(): boolean {
    tentouEnviar.value = true
    return valido.value
  }

  function resetar(): void {
    Object.keys(tocados).forEach((k) => delete tocados[k])
    tentouEnviar.value = false
  }

  return { erros, valido, erro, tocar, validarTudo, resetar }
}

// ---------- Validadores reutilizáveis ----------

export const validadores = {
  obrigatorio:
    (mensagem = 'Campo obrigatório.') =>
    (valor: unknown) =>
      (valor !== null && valor !== undefined && String(valor).trim() !== '') || mensagem,

  minCaracteres: (minimo: number) => (valor: unknown) =>
    String(valor ?? '').trim().length >= minimo || `Use pelo menos ${minimo} caracteres.`,

  maxCaracteres: (maximo: number) => (valor: unknown) =>
    String(valor ?? '').trim().length <= maximo || `Use no máximo ${maximo} caracteres.`,

  numero: () => (valor: unknown) =>
    (typeof valor === 'number' && Number.isFinite(valor)) || 'Informe um número válido.',

  inteiro: () => (valor: unknown) => Number.isInteger(valor) || 'Use um número inteiro.',

  minimo: (minimo: number, mensagem?: string) => (valor: unknown) =>
    (typeof valor === 'number' && valor >= minimo) || (mensagem ?? `O valor mínimo é ${minimo}.`),

  padrao: (regex: RegExp, mensagem: string) => (valor: unknown) => regex.test(String(valor ?? '')) || mensagem,
}
