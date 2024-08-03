import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  // 路由动画是否已经结束
  const isRouteAnimationEnd = ref(false)

  // 是否显示加载面板
  const showLoadingPanel = computed(() => {
    return !isRouteAnimationEnd.value
  })

  return { isRouteAnimationEnd, showLoadingPanel }
})
