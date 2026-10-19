<script setup lang="ts">
import { useToast, type TipoToast } from '@/composables/useToast'
import AppIcon from './AppIcon.vue'

const { toasts, remover } = useToast()

const ICONE: Record<TipoToast, string> = {
  sucesso: 'check-circle',
  erro: 'alert',
  info: 'info',
  aviso: 'alert',
}
</script>

<template>
  <!-- aria-live: leitores de tela anunciam cada novo aviso sem tirar o foco do usuário -->
  <div class="toasts" aria-live="polite" aria-relevant="additions">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.tipo}`"
        :role="toast.tipo === 'erro' ? 'alert' : 'status'"
      >
        <AppIcon :nome="ICONE[toast.tipo]" :tamanho="20" class="toast__icone" />
        <div class="toast__texto">
          <p class="toast__titulo">{{ toast.titulo }}</p>
          <p v-if="toast.mensagem" class="toast__mensagem">{{ toast.mensagem }}</p>
        </div>
        <button type="button" class="toast__fechar" aria-label="Fechar aviso" @click="remover(toast.id)">
          <AppIcon nome="x" :tamanho="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  z-index: 200;
  inset: auto var(--space-4) calc(var(--bottom-nav-height) + var(--space-4));
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  pointer-events: none;
}

@media (min-width: 900px) {
  .toasts {
    inset: auto var(--space-6) var(--space-6) auto;
    width: 380px;
  }
}

.toast {
  --toast-accent: var(--color-steel);

  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-ink);
  border-left: 6px solid var(--toast-accent);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-hard);
  pointer-events: auto;
}

.toast--sucesso {
  --toast-accent: var(--color-success);
}
.toast--erro {
  --toast-accent: var(--color-danger);
}
.toast--info {
  --toast-accent: var(--color-info);
}
.toast--aviso {
  --toast-accent: var(--color-primary);
}

.toast__icone {
  margin-top: 1px;
  color: var(--toast-accent);
}

.toast--aviso .toast__icone {
  color: var(--color-warning);
}

.toast__texto {
  flex: 1;
  min-width: 0;
}

.toast__titulo {
  font-weight: 700;
  font-size: var(--text-sm);
}

.toast__mensagem {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.toast__fechar {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
}

.toast__fechar:hover {
  background: var(--color-surface-2);
  color: var(--color-ink);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
.toast-move {
  transition: transform var(--duration-base) var(--ease-out);
}
</style>
