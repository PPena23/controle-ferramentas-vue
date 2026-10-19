<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    aberto: boolean
    titulo: string
    descricao?: string
    largura?: 'sm' | 'md' | 'lg'
    /** Impede fechar clicando fora (útil durante um envio). */
    bloqueado?: boolean
  }>(),
  { largura: 'md' },
)

const emit = defineEmits<{ fechar: [] }>()

const idTitulo = useId()
const idDescricao = useId()
const painel = ref<HTMLElement | null>(null)
let focoAnterior: HTMLElement | null = null

const SELETOR_FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function fechar() {
  if (!props.bloqueado) emit('fechar')
}

/** Esc fecha; Tab fica preso dentro do modal (focus trap). */
function aoPressionarTecla(evento: KeyboardEvent) {
  if (evento.key === 'Escape') {
    evento.stopPropagation()
    fechar()
    return
  }
  if (evento.key !== 'Tab' || !painel.value) return
  const focaveis = [...painel.value.querySelectorAll<HTMLElement>(SELETOR_FOCAVEIS)]
  if (focaveis.length === 0) return
  const primeiro = focaveis[0]
  const ultimo = focaveis[focaveis.length - 1]
  if (evento.shiftKey && document.activeElement === primeiro) {
    evento.preventDefault()
    ultimo.focus()
  } else if (!evento.shiftKey && document.activeElement === ultimo) {
    evento.preventDefault()
    primeiro.focus()
  }
}

// watch na prop: ao abrir, trava a rolagem e move o foco; ao fechar, devolve o foco para quem abriu.
watch(
  () => props.aberto,
  async (aberto) => {
    if (aberto) {
      focoAnterior = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      await nextTick()
      const alvo =
        painel.value?.querySelector<HTMLElement>('[autofocus], input, select, textarea') ??
        painel.value?.querySelector<HTMLElement>(SELETOR_FOCAVEIS)
      alvo?.focus()
    } else {
      document.body.style.overflow = ''
      focoAnterior?.focus()
      focoAnterior = null
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="aberto" class="modal" @keydown="aoPressionarTecla">
        <div class="modal__fundo" aria-hidden="true" @click="fechar" />
        <div
          ref="painel"
          class="modal__painel"
          :class="`modal__painel--${largura}`"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="idTitulo"
          :aria-describedby="descricao ? idDescricao : undefined"
        >
          <header class="modal__cabecalho">
            <div>
              <h2 :id="idTitulo" class="modal__titulo">{{ titulo }}</h2>
              <p v-if="descricao" :id="idDescricao" class="modal__descricao">{{ descricao }}</p>
            </div>
            <button type="button" class="modal__fechar" aria-label="Fechar janela" :disabled="bloqueado" @click="fechar">
              <AppIcon nome="x" />
            </button>
          </header>
          <div class="modal__corpo">
            <slot />
          </div>
          <footer v-if="$slots.rodape" class="modal__rodape">
            <slot name="rodape" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: end center;
  padding: 0;
}

@media (min-width: 640px) {
  .modal {
    place-items: center;
    padding: var(--space-6);
  }
}

.modal__fundo {
  position: absolute;
  inset: 0;
  background: rgb(17 19 21 / 0.55);
  backdrop-filter: blur(2px);
}

.modal__painel {
  position: relative;
  width: 100%;
  max-height: 92dvh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

/* Faixa zebrada no topo do modal, como uma etiqueta de sinalização */
.modal__painel::before {
  content: '';
  display: block;
  height: 6px;
  flex-shrink: 0;
  background: var(--hazard);
}

@media (min-width: 640px) {
  .modal__painel {
    border-radius: var(--radius-lg);
    border: 1.5px solid var(--color-ink);
  }
  .modal__painel--sm {
    max-width: 440px;
  }
  .modal__painel--md {
    max-width: 560px;
  }
  .modal__painel--lg {
    max-width: 760px;
  }
}

.modal__cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-5) var(--space-3);
}

.modal__titulo {
  font-size: var(--text-xl);
}

.modal__descricao {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.modal__fechar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  transition: background-color var(--duration-fast);
}

.modal__fechar:hover {
  background: var(--color-surface-2);
  color: var(--color-ink);
}

.modal__corpo {
  padding: var(--space-2) var(--space-5) var(--space-5);
  overflow-y: auto;
}

.modal__rodape {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-2);
}

/* Transição: fundo esmaece, painel sobe (mobile) ou cresce levemente (desktop) */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--duration-base) var(--ease-out);
}
.modal-enter-active .modal__painel,
.modal-leave-active .modal__painel {
  transition: transform var(--duration-base) var(--ease-out);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal__painel,
.modal-leave-to .modal__painel {
  transform: translateY(24px);
}

@media (min-width: 640px) {
  .modal-enter-from .modal__painel,
  .modal-leave-to .modal__painel {
    transform: translateY(8px) scale(0.98);
  }
}
</style>
