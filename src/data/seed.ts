// Dados de exemplo 100% FICTÍCIOS (pessoas, marcas usadas apenas como referência de catálogo e valores).
// As datas são geradas em relação ao dia de hoje, para sempre haver empréstimos em dia e atrasados.

import type { BancoDeDados, Categoria, Emprestimo, EstadoFerramenta, Ferramenta, Movimentacao } from '@/types'
import { paraDataISO, somarDias } from '@/utils/datas'

export const OPERADOR_PADRAO = 'Rafael Moura (almoxarife)'

type LinhaCatalogo = [nome: string, categoria: Categoria, marca: string, total: number, minimo: number, valor: number]

const CATALOGO: LinhaCatalogo[] = [
  // Elétricas
  ['Furadeira de impacto 650W', 'Elétricas', 'Bosch', 6, 2, 389.9],
  ['Parafusadeira a bateria 12V', 'Elétricas', 'Makita', 8, 3, 629.0],
  ['Esmerilhadeira angular 4½"', 'Elétricas', 'DeWalt', 4, 2, 459.0],
  ['Serra circular 7¼"', 'Elétricas', 'Makita', 3, 1, 899.0],
  ['Serra tico-tico 500W', 'Elétricas', 'Bosch', 3, 1, 449.9],
  ['Martelete rompedor SDS Plus', 'Elétricas', 'Bosch', 2, 1, 1290.0],
  ['Lixadeira orbital', 'Elétricas', 'Makita', 4, 2, 379.0],
  ['Soprador térmico 2000W', 'Elétricas', 'Black+Decker', 2, 1, 259.9],
  ['Extensão elétrica 20 m', 'Elétricas', 'Fortgpro', 10, 4, 119.9],
  // Manuais
  ['Jogo de chaves combinadas 6–22 mm', 'Manuais', 'Tramontina', 5, 2, 289.0],
  ['Martelo unha 27 mm', 'Manuais', 'Tramontina', 12, 4, 54.9],
  ['Alicate universal 8"', 'Manuais', 'Gedore', 10, 4, 69.9],
  ['Jogo de chaves de fenda e Phillips', 'Manuais', 'Stanley', 8, 3, 99.9],
  ['Chave inglesa 12"', 'Manuais', 'Gedore', 4, 2, 119.0],
  ['Serrote 22"', 'Manuais', 'Tramontina', 4, 1, 64.9],
  ['Arco de serra regulável', 'Manuais', 'Starrett', 5, 2, 89.9],
  ['Marreta 1 kg', 'Manuais', 'Vonder', 4, 2, 49.9],
  ['Grampo sargento 30 cm', 'Manuais', 'Vonder', 6, 2, 59.9],
  // Medição
  ['Trena 5 m', 'Medição', 'Stanley', 15, 5, 39.9],
  ['Trena a laser 40 m', 'Medição', 'Bosch', 3, 1, 549.0],
  ['Nível de bolha 60 cm', 'Medição', 'Vonder', 5, 2, 69.9],
  ['Paquímetro digital 150 mm', 'Medição', 'Mitutoyo', 3, 1, 689.0],
  ['Multímetro digital', 'Medição', 'Minipa', 4, 2, 189.9],
  ['Alicate amperímetro', 'Medição', 'Minipa', 2, 1, 329.0],
  ['Nível a laser de linhas', 'Medição', 'Bosch', 2, 1, 1099.0],
  // Segurança/EPI
  ['Capacete de segurança classe B', 'Segurança/EPI', '3M', 25, 10, 45.9],
  ['Óculos de proteção incolor', 'Segurança/EPI', '3M', 30, 12, 18.9],
  ['Luva de vaqueta (par)', 'Segurança/EPI', 'Volk', 40, 15, 24.9],
  ['Protetor auricular tipo concha', 'Segurança/EPI', '3M', 15, 6, 59.9],
  ['Cinto paraquedista', 'Segurança/EPI', 'MG Cintos', 4, 2, 389.0],
  ['Máscara semifacial com filtro', 'Segurança/EPI', '3M', 8, 4, 129.9],
  // Jardinagem
  ['Roçadeira a gasolina', 'Jardinagem', 'Stihl', 3, 1, 1890.0],
  ['Tesoura de poda', 'Jardinagem', 'Tramontina', 6, 2, 79.9],
  ['Enxada larga', 'Jardinagem', 'Tramontina', 8, 3, 62.9],
  ['Carrinho de mão 60 L', 'Jardinagem', 'Metasul', 4, 2, 299.0],
  ['Soprador de folhas', 'Jardinagem', 'Stihl', 2, 1, 1490.0],
  ['Cortador de grama elétrico', 'Jardinagem', 'Trapp', 2, 1, 749.0],
  // Hidráulica
  ['Chave grifo 18"', 'Hidráulica', 'Gedore', 4, 2, 149.9],
  ['Corta-tubos de cobre', 'Hidráulica', 'Ridgid', 2, 1, 219.0],
  ['Desentupidor profissional', 'Hidráulica', 'Vonder', 1, 2, 89.9],
]

const LOCAL_POR_CATEGORIA: Record<Categoria, string> = {
  Elétricas: 'Prateleira A',
  Manuais: 'Prateleira B',
  Medição: 'Prateleira C',
  'Segurança/EPI': 'Armário EPI ',
  Jardinagem: 'Galpão D',
  Hidráulica: 'Prateleira E',
}

/** Ajustes pontuais de estado para o catálogo ficar realista. */
const AJUSTES: Record<number, { estado: EstadoFerramenta; emManutencao: number }> = {
  5: { estado: 'manutencao', emManutencao: 1 }, // Martelete: voltou com defeito
  7: { estado: 'baixada', emManutencao: 0 }, // Soprador térmico: descartado
  31: { estado: 'manutencao', emManutencao: 1 }, // Roçadeira: carburador
}

type LinhaEmprestimo = {
  ferramenta: number
  quantidade: number
  colaborador: string
  setor: string
  retirada: number // dias relativos a hoje
  prevista: number
  devolucao?: number
  observacao?: string
  defeito?: boolean
}

const EMPRESTIMOS: LinhaEmprestimo[] = [
  // Em aberto e atrasados
  { ferramenta: 1, quantidade: 4, colaborador: 'Ana Ribeiro', setor: 'Manutenção predial', retirada: -12, prevista: -5 },
  { ferramenta: 0, quantidade: 3, colaborador: 'Bruno Camargo', setor: 'Obras', retirada: -9, prevista: -2 },
  { ferramenta: 21, quantidade: 3, colaborador: 'Carla Menezes', setor: 'Oficina mecânica', retirada: -20, prevista: -8 },
  { ferramenta: 29, quantidade: 3, colaborador: 'Diego Fontana', setor: 'Elétrica', retirada: -4, prevista: -1 },
  // Em aberto dentro do prazo
  { ferramenta: 31, quantidade: 2, colaborador: 'Elaine Prado', setor: 'Jardinagem', retirada: -3, prevista: 2 },
  { ferramenta: 1, quantidade: 2, colaborador: 'Fábio Nogueira', setor: 'Elétrica', retirada: -2, prevista: 5 },
  { ferramenta: 0, quantidade: 2, colaborador: 'Gisele Tavares', setor: 'Obras', retirada: -1, prevista: 6 },
  { ferramenta: 19, quantidade: 2, colaborador: 'Hugo Bastos', setor: 'Obras', retirada: -5, prevista: 2 },
  { ferramenta: 25, quantidade: 8, colaborador: 'Igor Salvador', setor: 'Obras', retirada: -6, prevista: 24 },
  { ferramenta: 37, quantidade: 1, colaborador: 'Juliana Paixão', setor: 'Hidráulica', retirada: -2, prevista: 0 },
  // Já devolvidos
  { ferramenta: 2, quantidade: 1, colaborador: 'Lucas Ferraz', setor: 'Oficina mecânica', retirada: -30, prevista: -25, devolucao: -26 },
  { ferramenta: 22, quantidade: 1, colaborador: 'Marina Coutinho', setor: 'Elétrica', retirada: -18, prevista: -15, devolucao: -14 },
  {
    ferramenta: 5,
    quantidade: 1,
    colaborador: 'Bruno Camargo',
    setor: 'Obras',
    retirada: -15,
    prevista: -10,
    devolucao: -11,
    observacao: 'Mandril travando ao trocar a broca.',
    defeito: true,
  },
  { ferramenta: 32, quantidade: 2, colaborador: 'Elaine Prado', setor: 'Jardinagem', retirada: -14, prevista: -12, devolucao: -12 },
  { ferramenta: 10, quantidade: 3, colaborador: 'Ana Ribeiro', setor: 'Manutenção predial', retirada: -25, prevista: -20, devolucao: -21 },
  {
    ferramenta: 31,
    quantidade: 1,
    colaborador: 'Elaine Prado',
    setor: 'Jardinagem',
    retirada: -40,
    prevista: -35,
    devolucao: -36,
    observacao: 'Carburador falhando em marcha lenta.',
    defeito: true,
  },
]

/** Gera um timestamp ISO em `dias` relativos a hoje, num horário de expediente. */
function momento(hoje: Date, dias: number, hora: number, minuto = 0): string {
  const data = somarDias(hoje, dias)
  data.setHours(hora, minuto, 0, 0)
  return data.toISOString()
}

export function gerarDadosDeExemplo(hoje = new Date()): BancoDeDados {
  const contadorPorCategoria = new Map<Categoria, number>()

  const ferramentas: Ferramenta[] = CATALOGO.map(([nome, categoria, marca, total, minimo, valor], i) => {
    const posicao = contadorPorCategoria.get(categoria) ?? 0
    contadorPorCategoria.set(categoria, posicao + 1)
    const criadoEm = momento(hoje, -120 + i, 8 + (i % 8), (i * 7) % 60)
    return {
      id: `fer-${String(i + 1).padStart(3, '0')}`,
      codigo: `FER-${String(i + 1).padStart(4, '0')}`,
      nome,
      categoria,
      marca,
      local: `${LOCAL_POR_CATEGORIA[categoria]}${(posicao % 3) + 1}`,
      quantidadeTotal: total,
      estoqueMinimo: minimo,
      valorUnitario: valor,
      estado: AJUSTES[i]?.estado ?? 'bom',
      emManutencao: AJUSTES[i]?.emManutencao ?? 0,
      criadoEm,
      atualizadoEm: criadoEm,
    }
  })

  const movimentacoes: Movimentacao[] = ferramentas.map((f, i) => ({
    id: `mov-cad-${i + 1}`,
    tipo: 'cadastro',
    ferramentaId: f.id,
    ferramentaCodigo: f.codigo,
    ferramentaNome: f.nome,
    descricao: `Cadastrada com ${f.quantidadeTotal} unidade(s) em ${f.local}.`,
    responsavel: OPERADOR_PADRAO,
    data: f.criadoEm,
  }))

  const emprestimos: Emprestimo[] = EMPRESTIMOS.map((linha, i) => {
    const ferramenta = ferramentas[linha.ferramenta]
    const emprestimo: Emprestimo = {
      id: `emp-${String(i + 1).padStart(3, '0')}`,
      ferramentaId: ferramenta.id,
      quantidade: linha.quantidade,
      colaborador: linha.colaborador,
      setor: linha.setor,
      dataRetirada: momento(hoje, linha.retirada, 7 + (i % 4), 15 + i),
      dataPrevista: paraDataISO(somarDias(hoje, linha.prevista)),
      dataDevolucao: linha.devolucao === undefined ? null : momento(hoje, linha.devolucao, 16, 10 + i),
      observacao: linha.observacao ?? '',
      devolvidaComDefeito: linha.defeito ?? false,
    }

    const base = {
      ferramentaId: ferramenta.id,
      ferramentaCodigo: ferramenta.codigo,
      ferramentaNome: ferramenta.nome,
      responsavel: OPERADOR_PADRAO,
    }

    movimentacoes.push({
      ...base,
      id: `mov-ret-${i + 1}`,
      tipo: 'retirada',
      descricao: `${linha.quantidade} un. retirada(s) por ${linha.colaborador} (${linha.setor}).`,
      data: emprestimo.dataRetirada,
    })

    if (emprestimo.dataDevolucao) {
      movimentacoes.push({
        ...base,
        id: `mov-dev-${i + 1}`,
        tipo: 'devolucao',
        descricao: `${linha.quantidade} un. devolvida(s) por ${linha.colaborador}${linha.defeito ? ' — com defeito' : ''}.`,
        data: emprestimo.dataDevolucao,
      })
      if (linha.defeito) {
        movimentacoes.push({
          ...base,
          id: `mov-man-${i + 1}`,
          tipo: 'manutencao',
          descricao: `1 un. enviada para manutenção: ${linha.observacao}`,
          data: emprestimo.dataDevolucao,
        })
      }
    }

    return emprestimo
  })

  movimentacoes.push({
    id: 'mov-baixa-1',
    tipo: 'edicao',
    ferramentaId: ferramentas[7].id,
    ferramentaCodigo: ferramentas[7].codigo,
    ferramentaNome: ferramentas[7].nome,
    descricao: 'Estado alterado para Baixada (resistência queimada, sem conserto).',
    responsavel: OPERADOR_PADRAO,
    data: momento(hoje, -45, 10, 30),
  })

  movimentacoes.sort((a, b) => b.data.localeCompare(a.data))

  return { ferramentas, emprestimos, movimentacoes }
}
