// Utilitários de data. Datas "puras" (sem hora) usam o formato AAAA-MM-DD
// e são interpretadas no fuso local, evitando o clássico bug de "um dia a menos" do UTC.

const MS_POR_DIA = 24 * 60 * 60 * 1000

export function paraDataISO(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function hojeISO(): string {
  return paraDataISO(new Date())
}

export function deDataISO(iso: string): Date {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

export function somarDias(base: Date, dias: number): Date {
  const resultado = new Date(base)
  resultado.setDate(resultado.getDate() + dias)
  return resultado
}

/** Diferença em dias inteiros entre duas datas (AAAA-MM-DD ou ISO completo). */
export function diasEntre(inicio: string, fim: string): number {
  return Math.round((deDataISO(fim).getTime() - deDataISO(inicio).getTime()) / MS_POR_DIA)
}

const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const formatoDataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const formatoHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const formatoDiaExtenso = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatarData(iso: string): string {
  // Datas puras (10 caracteres) são locais; ISO completo respeita o fuso.
  return formatoData.format(iso.length === 10 ? deDataISO(iso) : new Date(iso))
}

export function formatarDataHora(iso: string): string {
  return formatoDataHora.format(new Date(iso))
}

export function formatarHora(iso: string): string {
  return formatoHora.format(new Date(iso))
}

export function formatarDiaExtenso(data: Date | string): string {
  const valor = typeof data === 'string' ? (data.length === 10 ? deDataISO(data) : new Date(data)) : data
  const texto = formatoDiaExtenso.format(valor)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** "hoje", "ontem", "há 3 dias", "em 2 dias"… */
export function formatarRelativo(dataISO: string, referencia = hojeISO()): string {
  const dias = diasEntre(referencia, paraDataISO(dataISO.length === 10 ? deDataISO(dataISO) : new Date(dataISO)))
  if (dias === 0) return 'hoje'
  if (dias === -1) return 'ontem'
  if (dias === 1) return 'amanhã'
  return dias < 0 ? `há ${-dias} dias` : `em ${dias} dias`
}
