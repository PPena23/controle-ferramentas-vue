<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { CATEGORIAS, ESTADOS, type FerramentaInput } from '@/types'
import { useFormValidation, validadores as v, type Regras } from '@/composables/useFormValidation'
import { formatarMoeda } from '@/utils/formatadores'
import { META_ESTADO } from '@/utils/estoque'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import EstadoBadge from './EstadoBadge.vue'

const props = withDefaults(
  defineProps<{
    inicial: FerramentaInput
    /** Códigos já usados por OUTRAS ferramentas (para validar unicidade). */
    codigosEmUso: string[]
    /** Unidades emprestadas no momento (edição): o total não pode ficar abaixo disso. */
    emprestadas?: number
    enviando?: boolean
    modoEdicao?: boolean
  }>(),
  { emprestadas: 0 },
)

const emit = defineEmits<{
  enviar: [dados: FerramentaInput]
  cancelar: []
  /** Avisa o pai se há alterações não salvas (usado pelo guard de rota). */
  sujo: [valor: boolean]
}>()

// Cópia local editável: o formulário nunca altera a prop diretamente (fluxo de dados unidirecional).
const form = reactive<FerramentaInput>({ ...props.inicial })

const regras: Regras<FerramentaInput> = {
  codigo: [
    v.obrigatorio('Informe o código.'),
    v.padrao(/^FER-\d{4}$/i, 'Use o formato FER-0000.'),
    (codigo) => !props.codigosEmUso.includes(codigo.toUpperCase()) || 'Este código já está em uso.',
  ],
  nome: [v.obrigatorio('Informe o nome.'), v.minCaracteres(3), v.maxCaracteres(80)],
  categoria: [v.obrigatorio('Escolha uma categoria.')],
  marca: [v.obrigatorio('Informe a marca.'), v.maxCaracteres(40)],
  local: [v.obrigatorio('Informe onde a ferramenta fica guardada.')],
  quantidadeTotal: [
    v.numero(),
    v.inteiro(),
    v.minimo(0, 'A quantidade não pode ser negativa.'),
    (total, f) => {
      const ocupadas = props.emprestadas + f.emManutencao
      return total >= ocupadas || `Há ${ocupadas} unidade(s) emprestada(s) ou em manutenção: o total precisa ser ao menos ${ocupadas}.`
    },
  ],
  estoqueMinimo: [v.numero(), v.inteiro(), v.minimo(0, 'O estoque mínimo não pode ser negativo.')],
  valorUnitario: [v.numero(), v.minimo(0, 'O valor não pode ser negativo.')],
  emManutencao: [
    v.numero(),
    v.inteiro(),
    v.minimo(0, 'Não pode ser negativo.'),
    (qtd, f) =>
      qtd <= Math.max(0, f.quantidadeTotal - props.emprestadas) || 'Mais unidades em manutenção do que as que estão no almoxarifado.',
  ],
}

const { erro, tocar, valido, erros, validarTudo } = useFormValidation(form, regras)

const sujo = computed(() => JSON.stringify(form) !== JSON.stringify(props.inicial))
watch(sujo, (valor) => emit('sujo', valor), { immediate: true })

// Se o estado sai de "Manutenção", zera as unidades na oficina (campo condicional).
watch(
  () => form.estado,
  (estado, anterior) => {
    if (estado !== 'manutencao') form.emManutencao = 0
    else if (anterior && form.emManutencao === 0) form.emManutencao = 1
  },
)

const pendencias = computed(() => Object.keys(erros.value).length)

// ---------- Resumo ao vivo (computed derivados do formulário) ----------
const valorEmEstoque = computed(() => {
  const total = Number.isFinite(form.quantidadeTotal) ? form.quantidadeTotal : 0
  const valor = Number.isFinite(form.valorUnitario) ? form.valorUnitario : 0
  return total * valor
})

const disponivelPrevisto = computed(() => {
  if (form.estado === 'baixada') return 0
  const total = Number.isFinite(form.quantidadeTotal) ? form.quantidadeTotal : 0
  return Math.max(0, total - props.emprestadas - (form.emManutencao || 0))
})

const opcoesCategoria = CATEGORIAS.map((c) => ({ valor: c, rotulo: c }))

function enviar() {
  if (!validarTudo()) return
  emit('enviar', { ...form, codigo: form.codigo.toUpperCase(), nome: form.nome.trim(), marca: form.marca.trim(), local: form.local.trim() })
}
</script>

<template>
  <form class="formulario" novalidate @submit.prevent="enviar">
    <div class="formulario__principal card">
      <fieldset class="secao">
        <legend class="secao__titulo"><span>01</span> Identificação</legend>
        <div class="form-grid">
          <BaseInput
            :model-value="form.codigo"
            rotulo="Código"
            obrigatorio
            placeholder="FER-0000"
            dica="Padrão FER-0000, único no catálogo."
            :erro="erro('codigo')"
            autocomplete="off"
            maxlength="8"
            class="mono-input"
            @update:model-value="(valor) => (form.codigo = String(valor).toUpperCase())"
            @blur="tocar('codigo')"
          />
          <BaseSelect
            v-model="form.categoria"
            rotulo="Categoria"
            obrigatorio
            placeholder="Selecione…"
            :opcoes="opcoesCategoria"
            :erro="erro('categoria')"
            @blur="tocar('categoria')"
          />
          <BaseInput
            v-model="form.nome"
            class="span-2"
            rotulo="Nome da ferramenta"
            obrigatorio
            placeholder="Ex.: Furadeira de impacto 650W"
            :erro="erro('nome')"
            @blur="tocar('nome')"
          />
          <BaseInput
            v-model="form.marca"
            rotulo="Marca"
            obrigatorio
            placeholder="Ex.: Bosch"
            :erro="erro('marca')"
            @blur="tocar('marca')"
          />
          <BaseInput
            v-model="form.local"
            rotulo="Local de armazenamento"
            obrigatorio
            placeholder="Ex.: Prateleira A1"
            :erro="erro('local')"
            @blur="tocar('local')"
          />
        </div>
      </fieldset>

      <fieldset class="secao">
        <legend class="secao__titulo"><span>02</span> Estoque e valor</legend>
        <div class="form-grid form-grid--3">
          <BaseInput
            v-model="form.quantidadeTotal"
            tipo="number"
            rotulo="Quantidade total"
            obrigatorio
            min="0"
            step="1"
            inputmode="numeric"
            :erro="erro('quantidadeTotal')"
            @blur="tocar('quantidadeTotal')"
          />
          <BaseInput
            v-model="form.estoqueMinimo"
            tipo="number"
            rotulo="Estoque mínimo"
            obrigatorio
            min="0"
            step="1"
            inputmode="numeric"
            dica="Abaixo disso, a ferramenta entra no alerta."
            :erro="erro('estoqueMinimo')"
            @blur="tocar('estoqueMinimo')"
          />
          <BaseInput
            v-model="form.valorUnitario"
            tipo="number"
            rotulo="Valor unitário"
            prefixo="R$"
            obrigatorio
            min="0"
            step="0.01"
            inputmode="decimal"
            :erro="erro('valorUnitario')"
            @blur="tocar('valorUnitario')"
          />
        </div>
      </fieldset>

      <fieldset class="secao">
        <legend class="secao__titulo"><span>03</span> Estado de conservação</legend>
        <div class="estados" role="radiogroup" aria-label="Estado de conservação">
          <label v-for="opcao in ESTADOS" :key="opcao.valor" class="estado" :class="{ 'is-selecionado': form.estado === opcao.valor }">
            <input v-model="form.estado" type="radio" name="estado" :value="opcao.valor" class="sr-only" />
            <AppIcon :nome="META_ESTADO[opcao.valor].icone" :tamanho="20" />
            <span class="estado__rotulo">{{ opcao.rotulo }}</span>
            <span class="estado__descricao">
              {{
                opcao.valor === 'bom'
                  ? 'Pronta para uso.'
                  : opcao.valor === 'manutencao'
                    ? 'Parte das unidades na oficina.'
                    : 'Descartada; não pode ser retirada.'
              }}
            </span>
          </label>
        </div>

        <Transition name="fade">
          <div v-if="form.estado === 'manutencao'" class="secao__condicional">
            <BaseInput
              v-model="form.emManutencao"
              tipo="number"
              rotulo="Unidades em manutenção"
              min="0"
              step="1"
              inputmode="numeric"
              dica="Essas unidades ficam indisponíveis para retirada."
              :erro="erro('emManutencao')"
              @blur="tocar('emManutencao')"
            />
          </div>
        </Transition>
      </fieldset>
    </div>

    <aside class="formulario__resumo card" aria-label="Resumo do cadastro">
      <div class="hazard-stripe" aria-hidden="true" />
      <div class="resumo">
        <p class="eyebrow">Pré-visualização</p>
        <p class="resumo__codigo mono">{{ form.codigo || 'FER-????' }}</p>
        <h2 class="resumo__nome">{{ form.nome || 'Nova ferramenta' }}</h2>
        <p class="muted">{{ [form.categoria, form.marca].filter(Boolean).join(' · ') || 'Categoria · Marca' }}</p>
        <EstadoBadge :estado="form.estado" />

        <dl class="resumo__numeros">
          <div>
            <dt>Disponível para retirada</dt>
            <dd>{{ disponivelPrevisto }}</dd>
          </div>
          <div v-if="modoEdicao">
            <dt>Emprestadas agora</dt>
            <dd>{{ emprestadas }}</dd>
          </div>
          <div>
            <dt>Valor em estoque</dt>
            <dd>{{ formatarMoeda(valorEmEstoque) }}</dd>
          </div>
        </dl>

        <div class="resumo__acoes">
          <BaseButton tipo="submit" variante="primario" tamanho="lg" icone="check" bloco-inteiro :carregando="enviando" :desabilitado="!valido">
            {{ modoEdicao ? 'Salvar alterações' : 'Cadastrar ferramenta' }}
          </BaseButton>
          <BaseButton variante="fantasma" bloco-inteiro :desabilitado="enviando" @click="emit('cancelar')">Cancelar</BaseButton>
          <p class="resumo__status" aria-live="polite">
            <template v-if="!valido">
              <AppIcon nome="alert" :tamanho="14" />
              {{ pendencias }} campo(s) precisam de atenção.
            </template>
            <template v-else-if="sujo">
              <AppIcon nome="info" :tamanho="14" />
              Alterações ainda não salvas.
            </template>
          </p>
        </div>
      </div>
    </aside>
  </form>
</template>

<style scoped>
.formulario {
  display: grid;
  gap: var(--space-6);
  align-items: start;
}

@media (min-width: 1024px) {
  .formulario {
    grid-template-columns: minmax(0, 1fr) 320px;
  }

  .formulario__resumo {
    position: sticky;
    top: calc(var(--header-height) + var(--space-6));
  }
}

.formulario__principal {
  padding: var(--space-2) var(--space-5) var(--space-5);
}

.secao {
  border: 0;
  padding: var(--space-5) 0 var(--space-2);
  min-width: 0;
}

.secao + .secao {
  border-top: 1px dashed var(--color-border-strong);
}

.secao__titulo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  font-family: var(--font-display);
  font-stretch: 80%;
  font-weight: 800;
  font-size: var(--text-lg);
}

.secao__titulo span {
  display: inline-grid;
  place-items: center;
  height: 24px;
  padding: 0 6px;
  border-radius: var(--radius-sm);
  background: var(--color-ink);
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

@media (min-width: 640px) {
  .form-grid--3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.mono-input :deep(input) {
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
}

/* Radios como "cartões" selecionáveis */
.estados {
  display: grid;
  gap: var(--space-3);
}

@media (min-width: 640px) {
  .estados {
    grid-template-columns: repeat(3, 1fr);
  }
}

.estado {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px var(--space-2);
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  transition:
    border-color var(--duration-fast),
    background-color var(--duration-fast),
    box-shadow var(--duration-fast);
}

.estado:hover {
  border-color: var(--color-ink);
}

.estado:has(input:focus-visible) {
  box-shadow: var(--focus-ring);
}

.estado.is-selecionado {
  border-color: var(--color-ink);
  background: var(--color-primary-soft);
  box-shadow: inset 0 0 0 1px var(--color-ink);
}

.estado__rotulo {
  font-weight: 700;
}

.estado__descricao {
  grid-column: 2;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.secao__condicional {
  max-width: 280px;
  margin-top: var(--space-4);
}

/* Resumo lateral */
.formulario__resumo {
  overflow: hidden;
}

.resumo {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5);
}

.resumo__codigo {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.resumo__nome {
  font-size: var(--text-xl);
  overflow-wrap: anywhere;
}

.resumo__numeros {
  display: grid;
  gap: var(--space-3);
  margin: var(--space-3) 0;
  padding: var(--space-4) 0;
  border-block: 1px solid var(--color-border);
}

.resumo__numeros div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.resumo__numeros dt {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.resumo__numeros dd {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.resumo__acoes {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.resumo__status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: 1.4em;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
