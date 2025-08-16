import { ref, reactive, readonly } from 'vue'

export interface PollingConfig {
  endpoint: string
  interval: number
  maxRetries?: number
}

export interface PollingState {
  isPolling: boolean
  lastChecked: Date | null
  errorCount: number
}

export interface PollingResult {
  success: boolean
  shouldRedirect: boolean
  error?: string
}

export function usePolling(config: PollingConfig) {
  // 验证配置
  if (!config.endpoint || typeof config.endpoint !== 'string') {
    throw new Error('Invalid polling config: endpoint must be a valid URL string')
  }
  
  if (!config.interval || config.interval < 1000) {
    throw new Error('Invalid polling config: interval must be at least 1000ms')
  }

  // 状态管理
  const state = reactive<PollingState>({
    isPolling: false,
    lastChecked: null,
    errorCount: 0
  })

  // 内部变量
  let pollingTimer: number | null = null
  let abortController: AbortController | null = null
  let isRequestInProgress = false // 防止重复请求

  // 核心端点检查函数
  const checkEndpoint = async (): Promise<PollingResult> => {
    // 防止重复请求
    if (isRequestInProgress) {
      console.log('⏳ Request already in progress, skipping...')
      return { success: false, shouldRedirect: false }
    }

    isRequestInProgress = true

    try {
      // 创建新的 AbortController 用于请求取消
      abortController = new AbortController()
      
      // 设置10秒超时
      const timeoutId = setTimeout(() => {
        if (abortController) {
          abortController.abort()
        }
      }, 10000)

      const response = await fetch(config.endpoint, {
        method: 'GET',
        signal: abortController.signal,
        mode: 'cors', // 明确设置CORS模式
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
        // 不发送凭据以避免CORS问题
        credentials: 'omit'
      })

      // 清除超时定时器
      clearTimeout(timeoutId)

      // 更新最后检查时间
      state.lastChecked = new Date()

      // 检查响应状态
      if (response.ok) {
        // 重置错误计数
        state.errorCount = 0
        console.log('✅ Polling success: WiFi access granted')
        return { success: true, shouldRedirect: true }
      }

      // 处理不同的HTTP状态码
      if (response.status >= 400 && response.status < 500) {
        // 4xx错误 - 客户端错误，但继续轮询
        console.log(`⏳ Polling response: ${response.status} - client error, continuing...`)
      } else if (response.status >= 500) {
        // 5xx错误 - 服务器错误，但继续轮询
        console.log(`⏳ Polling response: ${response.status} - server error, continuing...`)
      } else {
        // 其他非200响应
        console.log(`⏳ Polling response: ${response.status} - not ready yet`)
      }

      return { success: false, shouldRedirect: false }

    } catch (error: any) {
      // 增加错误计数
      state.errorCount++
      state.lastChecked = new Date()

      // 处理不同类型的错误
      if (error.name === 'AbortError') {
        console.log('🔄 Polling request cancelled (timeout or manual)')
        return { success: false, shouldRedirect: false }
      }

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // 网络连接错误
        console.error('❌ Polling network error:', error.message)
        return { 
          success: false, 
          shouldRedirect: false, 
          error: 'Network connection failed'
        }
      }

      if (error.message.includes('CORS')) {
        // CORS错误
        console.error('❌ Polling CORS error:', error.message)
        return { 
          success: false, 
          shouldRedirect: false, 
          error: 'CORS policy blocked request'
        }
      }

      // 其他未知错误
      console.error('❌ Polling unknown error:', error.message || error)
      
      return { 
        success: false, 
        shouldRedirect: false, 
        error: error.message || 'Unknown network error'
      }
    } finally {
      abortController = null
      isRequestInProgress = false
    }
  }

  // 开始轮询
  const startPolling = () => {
    if (state.isPolling) {
      console.log('⚠️ Polling already active')
      return
    }

    console.log(`🚀 Starting polling: ${config.endpoint} every ${config.interval}ms`)
    state.isPolling = true
    state.errorCount = 0

    // 立即执行一次检查
    checkEndpoint().then(result => {
      if (result.shouldRedirect) {
        stopPolling()
        handleRedirection()
      }
    })

    // 设置定时器
    pollingTimer = window.setInterval(async () => {
      if (!state.isPolling) return

      const result = await checkEndpoint()
      
      // 如果需要重定向，停止轮询并触发重定向
      if (result.shouldRedirect) {
        stopPolling()
        handleRedirection()
      }
    }, config.interval)
  }

  // 停止轮询
  const stopPolling = () => {
    if (!state.isPolling) return

    console.log('🛑 Stopping polling')
    state.isPolling = false

    // 清除定时器
    if (pollingTimer !== null) {
      window.clearInterval(pollingTimer)
      pollingTimer = null
    }

    // 取消进行中的请求
    if (abortController) {
      abortController.abort()
      abortController = null
    }

    // 重置请求状态
    isRequestInProgress = false
  }

  // 处理重定向
  const handleRedirection = () => {
    console.log('🎉 WiFi access granted! Redirecting to Baidu...')
    
    try {
      // 显示成功消息
      const messageEl = document.createElement('div')
      messageEl.textContent = 'WiFi访问已开通，正在跳转到百度...'
      messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #67c23a;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `
      
      if (document.body) {
        document.body.appendChild(messageEl)
      }
      
      // 1秒后重定向到百度
      setTimeout(() => {
        try {
          window.location.href = 'https://www.baidu.com'
        } catch (redirectError) {
          console.error('❌ Redirection failed:', redirectError)
          // 如果重定向失败，尝试使用window.open
          window.open('https://www.baidu.com', '_self')
        }
      }, 1000)
    } catch (error) {
      console.error('❌ Error showing success message:', error)
      // 即使消息显示失败，也要尝试重定向
      setTimeout(() => {
        window.location.href = 'https://www.baidu.com'
      }, 500)
    }
  }

  // 清理资源
  const cleanup = () => {
    console.log('🧹 Cleaning up polling resources')
    stopPolling()
    
    // 重置状态
    state.lastChecked = null
    state.errorCount = 0
  }

  return {
    state: readonly(state),
    checkEndpoint,
    startPolling,
    stopPolling,
    cleanup
  }
}