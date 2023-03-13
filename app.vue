<template>
  <div>
    <NuxtPage />
  </div>
</template>
<script setup lang="ts">
import { existsSync } from 'fs-extra';
import { join } from 'upath';

onMounted(() => {
  const doSomethingWithFsExtra = existsSync('path/to/file')
  const doSomethingWithUpath = join('path', 'to', 'file')
})
</script>