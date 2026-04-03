import { useRouter } from 'vue-router';

/**
 * 通用导航（稳定版）
 * - 支持 path/name
 * - 支持 replace/newTab/forceReload
 * - path 直接用字符串 push：router.push('/dashboard')
 * - 自动检测目标是否存在
 */
export function useNavigator() {
  const router = useRouter()
  function goTo(pathOrName, params = {}, options = {}) {
    if (!pathOrName) return
    
    const isExternal = typeof pathOrName === 'string' && pathOrName.startsWith('http')
    const isPath = typeof pathOrName === 'string' && pathOrName.startsWith('/')
    
    // 当前路由
    const current = router.currentRoute.value
    const currentPath = current.fullPath
    
    // 新标签页
    if (options.newTab) {
      if (isExternal) {
        window.open(pathOrName, '_blank')
        return
      }
      const target = isPath
        ? router.resolve({ path: pathOrName, query: params })
        : router.resolve({ name: pathOrName, params })
      
      if (!target.matched.length) return
      window.open(target.href, '_blank')
      return
    }
    
    // 相同路由处理
    if (!isExternal) {
      const target = isPath
        ? router.resolve({ path: pathOrName, query: params })
        : router.resolve({ name: pathOrName, params })
      
      if (!target.matched.length) return
      
      if (currentPath === target.fullPath) {
        if (options.forceReload) {
          router.go(0)
        }
        return
      }
    }
    
    const navigate = options.replace ? router.replace : router.push
    
    // 真正跳转
    if (isExternal) {
      // 外链（当前页）
      location.href = pathOrName
      return
    }
    
    // path 优先用字符串，带参数时再用对象
    if (isPath) {
      const hasQuery = params && Object.keys(params).length > 0
      const target = hasQuery ? { path: pathOrName, query: params } : pathOrName
      navigate(target).catch(() => {})
    } else {
      navigate({ name: pathOrName, params }).catch(() => {})
    }
  }
  
  return { goTo }
}
