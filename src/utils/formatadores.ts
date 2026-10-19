const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const numero = new Intl.NumberFormat('pt-BR')

export const formatarMoeda = (valor: number): string => moeda.format(valor)
export const formatarNumero = (valor: number): string => numero.format(valor)

/** Plural simples: plural(3, 'unidade') → "3 unidades". */
export function plural(quantidade: number, singular: string, pluralForma = `${singular}s`): string {
  return `${formatarNumero(quantidade)} ${quantidade === 1 ? singular : pluralForma}`
}

/** Normaliza texto para busca: minúsculas e sem acentos. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function gerarId(prefixo: string): string {
  const aleatorio =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefixo}-${Date.now().toString(36)}-${aleatorio}`
}
