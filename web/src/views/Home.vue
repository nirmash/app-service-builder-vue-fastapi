<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const controller = new AbortController()
const apiState = ref({
  status: 'loading',
  message: 'Contacting the FastAPI backend...',
})

const endpoints = [
  { href: '/api/health', label: 'API health', detail: 'GET /api/health' },
  { href: '/api/version', label: 'API version', detail: 'GET /api/version' },
  { href: '/version.json', label: 'frontend version', detail: 'GET /version.json' },
]

onMounted(async () => {
  try {
    const response = await fetch('/api/status', {
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    apiState.value = await response.json()
  } catch (error) {
    if (error.name !== 'AbortError') {
      apiState.value = {
        status: 'error',
        message: error.message,
      }
    }
  }
})

onBeforeUnmount(() => controller.abort())
</script>

<template>
  <main class="landing">
    <header class="hero">
      <p class="eyebrow">App Service Builder / Vue + FastAPI</p>
      <h1>Vue and FastAPI are running</h1>
      <p class="lede">
        The static Vue frontend and FastAPI backend share one public hostname.
      </p>
    </header>

    <ul class="stack" aria-label="Application components">
      <li>
        <span class="stack-path">/</span>
        <span class="stack-name">Vue 3 static frontend</span>
      </li>
      <li>
        <span class="stack-path">/api</span>
        <span class="stack-name">FastAPI backend</span>
      </li>
    </ul>

    <section
      class="api-card"
      :data-state="apiState.status"
      aria-labelledby="api-status-heading"
    >
      <span class="status-dot" aria-hidden="true"></span>
      <div>
        <h2 id="api-status-heading">Same-origin API status</h2>
        <p role="status" aria-live="polite">
          <strong>{{ apiState.status }}</strong>: {{ apiState.message }}
        </p>
      </div>
    </section>

    <nav aria-label="Test routes">
      <RouterLink class="button" to="/products/widget-1">
        Open the frontend deep route
        <span aria-hidden="true">&rarr;</span>
      </RouterLink>
      <ul class="endpoints">
        <li v-for="endpoint in endpoints" :key="endpoint.href">
          <a :href="endpoint.href">
            <span class="endpoint-label">View {{ endpoint.label }}</span>
            <code>{{ endpoint.detail }}</code>
          </a>
        </li>
      </ul>
    </nav>
  </main>
</template>

<style scoped>
.landing {
  position: relative;
  width: min(48rem, calc(100% - 2rem));
  margin: clamp(1.5rem, 6vw, 4.5rem) auto;
  padding: clamp(1.5rem, 5vw, 3rem);
  overflow: hidden;
}

.landing::before {
  position: absolute;
  inset: 0 0 auto;
  height: 0.375rem;
  background: linear-gradient(90deg, #3349ad, #6c5ce7, #0f9d8a);
  content: '';
}

.hero h1 {
  margin-bottom: 0.75rem;
  font-size: clamp(2rem, 5vw, 2.75rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.lede {
  max-width: 36rem;
  margin: 0;
  color: #4a5568;
  font-size: 1.125rem;
  line-height: 1.6;
}

.stack {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.75rem;
  margin: 2rem 0 0;
  padding: 0;
  list-style: none;
}

.stack li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: #f8fafc;
  border: 1px solid #dce3ee;
  border-radius: 0.75rem;
}

.stack-path {
  padding: 0.25rem 0.5rem;
  color: #3349ad;
  background: #e8ecff;
  border-radius: 0.375rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.875rem;
  font-weight: 700;
}

.stack-name {
  font-weight: 600;
}

.api-card {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
}

.api-card h2 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.api-card p {
  margin: 0;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.status-dot {
  flex: none;
  width: 0.75rem;
  height: 0.75rem;
  margin-top: 0.3rem;
  background: #4b5fc0;
  border-radius: 50%;
  box-shadow: 0 0 0 0.25rem rgb(75 95 192 / 18%);
}

.api-card[data-state='loading'] .status-dot {
  animation: pulse 1.2s ease-in-out infinite;
}

.api-card[data-state='available'] .status-dot {
  background: #1f8f4e;
  box-shadow: 0 0 0 0.25rem rgb(31 143 78 / 18%);
}

.api-card[data-state='error'] .status-dot {
  background: #c53030;
  box-shadow: 0 0 0 0.25rem rgb(197 48 48 / 18%);
}

nav {
  display: grid;
  gap: 1.25rem;
  margin-bottom: 0;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  font-weight: 600;
  transition: background-color 150ms ease, transform 150ms ease;
}

.button:hover {
  transform: translateY(-1px);
}

.endpoints {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.endpoints a {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  height: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid #dce3ee;
  border-radius: 0.75rem;
  text-decoration: none;
  transition: border-color 150ms ease, background-color 150ms ease;
}

.endpoints a:hover {
  background: #f5f7ff;
  border-color: #3349ad;
}

.endpoint-label {
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.endpoints code {
  color: #4a5568;
  font-size: 0.8125rem;
}

.button:focus-visible,
.endpoints a:focus-visible {
  outline: 3px solid #6c7fe0;
  outline-offset: 2px;
}

@keyframes pulse {
  50% {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .api-card[data-state='loading'] .status-dot {
    animation: none;
  }

  .button,
  .endpoints a {
    transition: none;
  }

  .button:hover {
    transform: none;
  }
}
</style>
