<script setup lang="ts">
import LoadingPanel from '@/components/LoadingPanel.vue'
import { useUserStore } from '@/stores'

const userStore = useUserStore()
</script>

<template>
  <div
    class="flex h-full w-full flex-col items-stretch overflow-hidden transition-all duration-200"
  >
    <router-view v-slot="{ Component }">
      <Transition name="fade" mode="out-in" appear>
        <component :is="userStore.showLoadingPanel ? LoadingPanel : Component" />
      </Transition>
    </router-view>
  </div>
</template>
