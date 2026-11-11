<script setup>
import { loginUrl, logoutUrl } from '../auth.js'

defineProps({
  state: { type: Object, required: true },
})
defineEmits(['retry'])
</script>

<template>
  <section class="account-controls" :data-state="state.status" aria-label="Account">
    <p class="account-status" role="status" aria-live="polite">{{ state.message }}</p>
    <a v-if="state.status === 'signed-out'" class="button auth-action" :href="loginUrl">
      Log in
    </a>
    <a v-else-if="state.status === 'signed-in'" class="button auth-action" :href="logoutUrl">
      Log out
    </a>
    <button
      v-else-if="state.status === 'error'"
      class="button auth-action"
      type="button"
      @click="$emit('retry')"
    >
      Retry sign-in check
    </button>
  </section>
</template>

<style scoped>
.account-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1.75rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #dce3ee;
}

.account-status {
  flex: 1 1 14rem;
  margin: 0;
  color: #4a5568;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.account-controls[data-state='error'] .account-status {
  color: #b42318;
}

.auth-action {
  flex: none;
  padding: 0.625rem 0.875rem;
  border: 0;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.auth-action:focus-visible {
  outline: 3px solid #6c7fe0;
  outline-offset: 2px;
}
</style>
