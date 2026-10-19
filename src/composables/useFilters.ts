import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'

type ValorFiltro = string | boolean

/**
 * Filtros sincronizados com a query string da URL.
 * Assim um filtro aplicado pode ser compartilhado por link e sobrevive ao F5.
 *
 * @example const { filtros, limpar } = useFilters({ busca: '', categoria: '', abaixoDoMinimo: false })
 */
export function useFilters<T extends Record<string, ValorFiltro>>(padroes: T) {
  const route = useRoute()
  const router = useRouter()
  const chaves = Object.keys(padroes) as (keyof T & string)[]
  // Durante a transição de saída a view antiga ainda está viva: os watchers só agem na própria rota.
  const caminho = route.path

  function lerDaQuery(query: LocationQuery): Partial<T> {
    const resultado: Record<string, ValorFiltro> = {}
    for (const chave of chaves) {
      const valor = query[chave]
      if (typeof valor !== 'string') continue
      resultado[chave] = typeof padroes[chave] === 'boolean' ? valor === '1' : valor
    }
    return resultado as Partial<T>
  }

  /** Parâmetros da URL que não são filtros (ex.: ?nova=1) são preservados. */
  function outrosParametros(): LocationQuery {
    return Object.fromEntries(Object.entries(route.query).filter(([chave]) => !chaves.includes(chave as keyof T & string)))
  }

  const filtros = reactive({ ...padroes, ...lerDaQuery(route.query) }) as T

  // watch profundo: qualquer alteração de filtro reescreve a URL (sem criar entrada no histórico).
  watch(
    filtros,
    (atuais) => {
      if (route.path !== caminho) return
      const query: Record<string, string> = {}
      for (const chave of chaves) {
        const valor = atuais[chave]
        if (valor === padroes[chave]) continue
        query[chave] = typeof valor === 'boolean' ? '1' : String(valor)
      }
      router.replace({ query: { ...outrosParametros(), ...query } })
    },
    { deep: true },
  )

  // Caminho inverso: se a URL mudar por fora (link, botão voltar), os filtros acompanham.
  // Não entra em loop porque só atribui quando o valor realmente difere.
  watch(
    () => route.query,
    (query) => {
      if (route.path !== caminho) return
      const lidos = lerDaQuery(query)
      for (const chave of chaves) {
        const valor = (lidos[chave] ?? padroes[chave]) as T[typeof chave]
        if (filtros[chave] !== valor) filtros[chave] = valor
      }
    },
  )

  const quantidadeAtivos = computed(() => chaves.filter((c) => filtros[c] !== padroes[c]).length)

  function limpar(): void {
    Object.assign(filtros, padroes)
  }

  return { filtros, quantidadeAtivos, limpar }
}
