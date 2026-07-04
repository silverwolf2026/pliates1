<script setup lang="ts">
// App shell — router drives all views
</script>

<template>
  <div class="app-shell">
    <router-view />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #f5f5fa;
  color: #1a1a2e;
  -webkit-font-smoothing: antialiased;
}

.app-shell {
  min-height: 100vh;
}
</style>
