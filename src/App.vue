<template>
  <div class="login-container">
    <!-- Header with Logo -->
    <div class="header">
      <div class="logo">
        <div class="wifi-icon">📶</div>
        <div class="logo-text">
          Apfree<br>
          WiFi Dog
        </div>
      </div>
      <h1 class="title">登录</h1>
    </div>

    <!-- Main Content -->
    <div class="content">
      <!-- Wallet Connection Section -->
      <div class="wallet-section">
        <div v-if="!walletState.connected">
          <button 
            class="custom-button connect-button"
            @click="connectWallet"
            :disabled="connecting"
          >
            <span v-if="connecting" class="loading-spinner"></span>
            {{ connecting ? '连接中...' : '连接钱包' }}
          </button>
        </div>
        
        <div v-else class="wallet-info">
          <div class="wallet-address">
            地址: {{ formatAddress(walletState.address) }}
          </div>
          <div class="wallet-balance">
            余额: {{ walletState.balance }} tMON
          </div>
        </div>
      </div>

      <!-- Payment Section -->
      <div v-if="walletState.connected" class="payment-section">
        <div class="payment-info">
          <div class="amount-display">
            <div>WiFi访问费用: <span class="pay-amount">{{ paymentConfig.paidAmount }} tMON</span></div>
            <div class="fee-description">一次性支付，立即获得WiFi访问权限</div>
          </div>
        </div>

        <button 
          class="custom-button pay-button"
          @click="payAndUnlock"
          :disabled="paymentState.loading || paymentState.status === 'success'"
        >
          <span v-if="paymentState.loading" class="loading-spinner"></span>
          {{ getPayButtonText() }}
        </button>

        <!-- Status Message -->
        <div 
          v-if="paymentState.message" 
          class="status-message"
          :class="{
            'status-success': paymentState.status === 'success',
            'status-error': paymentState.status === 'failed',
            'status-warning': paymentState.status === 'pending'
          }"
        >
          {{ paymentState.message }}
        </div>
      </div>

      <!-- Terms -->
      <div class="terms">
        <span class="check-icon">✓</span>
        已阅读并同意 上网服务条款
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import type { WalletState, PaymentState } from './types'
import { useWallet } from './composables/useWalletFixed'
import { usePayment } from './composables/usePayment'
import { usePolling, type PollingConfig } from './composables/usePolling'
import { getClientMacAddress, redirectToWifiDogAuth, type WifiDogConfig } from './utils/wifidog'

const connecting = ref(false)

// 自定义消息提示
const showMessage = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  // 创建消息元素
  const messageEl = document.createElement('div')
  messageEl.textContent = message
  messageEl.className = `toast-message toast-${type}`
  messageEl.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#67c23a' : type === 'error' ? '#f56c6c' : '#e6a23c'};
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    transition: all 0.3s ease;
    opacity: 0;
  `
  
  document.body.appendChild(messageEl)
  
  // 显示动画
  requestAnimationFrame(() => {
    messageEl.style.opacity = '1'
    messageEl.style.transform = 'translateX(-50%) translateY(10px)'
  })
  
  // 3秒后移除
  setTimeout(() => {
    messageEl.style.opacity = '0'
    messageEl.style.transform = 'translateX(-50%) translateY(-10px)'
    setTimeout(() => {
      document.body.removeChild(messageEl)
    }, 300)
  }, 3000)
}

const walletState = reactive<WalletState>({
  connected: false,
  address: '',
  balance: '0',
  chainId: null
})

const paymentState = reactive<PaymentState>({
  loading: false,
  txHash: null,
  status: 'idle',
  message: ''
})

const paymentConfig = {
  paidAmount: 0.01, // 固定支付 0.01 tMON
  returnedAmount: 0  // 不再有返还，而是直接扣费
}

const wifiDogConfig: WifiDogConfig = {
  authServerUrl: 'http://.1.254:2060/wifidog/temporary_pass',
  timeout: 10
}

// 轮询配置
const pollingConfig: PollingConfig = {
  endpoint: 'http://192.168.1.254:2060/wifidog/temporary_pass',
  interval: 3000 // 3秒间隔
}

const {
  connectWallet: connectWalletFn, 
  checkConnection,
  getBalance,
  provider: walletProvider,
  signer: walletSigner
} = useWallet()

const { payAndReturn } = usePayment()

// 初始化轮询
const { state: pollingState, startPolling, stopPolling, cleanup } = usePolling(pollingConfig)

const formatAddress = (address: string): string => {
  if (!address) return ''
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

const connectWallet = async () => {
  try {
    connecting.value = true
    const result = await connectWalletFn()
    
    if (result.success) {
      walletState.connected = true
      walletState.address = result.address!
      walletState.chainId = result.chainId!
      
      // 获取余额
      const balance = await getBalance(result.address!)
      walletState.balance = balance
      
      showMessage('钱包连接成功', 'success')
    } else {
      showMessage(result.error || '钱包连接失败', 'error')
    }
  } catch (error) {
    console.error('Connect wallet error:', error)
    showMessage('连接钱包时发生错误', 'error')
  } finally {
    connecting.value = false
  }
}

const payAndUnlock = async () => {
  try {
    console.log('💰 Payment button clicked')
    console.log('🔍 Wallet state before payment:', {
      connected: walletState.connected,
      hasProvider: !!walletProvider.value,
      hasSigner: !!walletSigner.value
    })
    
    paymentState.loading = true
    paymentState.status = 'pending'
    paymentState.message = '正在发起支付...'

    const result = await payAndReturn(
      paymentConfig.paidAmount,
      paymentConfig.returnedAmount
    )

    if (result.success) {
      paymentState.txHash = result.txHash!
      paymentState.status = 'success'
      paymentState.message = `支付成功！已扣除 ${paymentConfig.paidAmount} tMON，正在获取WiFi访问权限...`
      
      // 更新余额
      const newBalance = await getBalance(walletState.address)
      walletState.balance = newBalance
      
      showMessage('支付成功！后台轮询将自动检测WiFi访问权限', 'success')
      
      // 支付成功后，轮询会自动检测到访问权限并重定向到百度
      // 不再需要手动重定向到WiFiDog认证服务器
    } else {
      paymentState.status = 'failed'
      paymentState.message = result.error || '支付失败，请重试'
      showMessage(result.error || '支付失败', 'error')
    }
  } catch (error) {
    console.error('Payment error:', error)
    paymentState.status = 'failed'
    paymentState.message = '支付过程中发生错误，请重试'
    showMessage('支付失败', 'error')
  } finally {
    paymentState.loading = false
  }
}

const getPayButtonText = (): string => {
  if (paymentState.loading) {
    switch (paymentState.status) {
      case 'pending':
        return '支付中...'
      default:
        return '处理中...'
    }
  }
  if (paymentState.status === 'success') {
    return '支付完成'
  }
  return `支付 ${paymentConfig.paidAmount} tMON 获得WiFi访问`
}

onMounted(async () => {
  console.log('App mounted, checking wallet connection...')
  
  // 启动后台轮询
  console.log('🚀 Starting background polling for WiFi access...')
  startPolling()
  
  // 检查是否已连接钱包
  const connection = await checkConnection()
  console.log('Connection result:', connection)
  
  if (connection.success && connection.address) {
    console.log('Wallet already connected, updating state...')
    walletState.connected = true
    walletState.address = connection.address
    walletState.chainId = connection.chainId!
    
    // 获取余额
    const balance = await getBalance(connection.address)
    walletState.balance = balance
    console.log('Wallet state updated:', { connected: true, address: connection.address, balance })
    
    // 检查provider和signer状态
    console.log('🔍 Global wallet state after connection:', {
      hasProvider: !!walletProvider.value,
      hasSigner: !!walletSigner.value,
      provider: walletProvider.value,
      signer: walletSigner.value
    })
  } else {
    console.log('Wallet not connected or connection failed')
  }
})

// 组件卸载时清理轮询
// 组件卸载时清理轮询
onUnmounted(() => {
  console.log('App unmounting, cleaning up polling...')
  cleanup()
})

// 页面卸载时也清理轮询（防止内存泄漏）
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cleanup()
  })
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.wifi-icon {
  margin-right: 12px;
  font-size: 24px;
  color: #fff;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  line-height: 1.2;
}

.title {
  font-size: 24px;
  margin: 0;
  font-weight: 300;
}

.content {
  width: 100%;
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.wallet-section, .payment-section {
  margin-bottom: 30px;
}

.custom-button {
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.connect-button {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}

.connect-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.pay-button {
  background: linear-gradient(45deg, #56ab2f, #a8e6cf);
  color: white;
}

.pay-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(86, 171, 47, 0.4);
}

.custom-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.wallet-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.wallet-address, .wallet-balance {
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.wallet-balance {
  margin-bottom: 0;
  font-weight: 600;
  color: #333;
}

.payment-info {
  background: #f0f8ff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e1f0ff;
}

.amount-display {
  text-align: center;
}

.pay-amount {
  font-size: 20px;
  font-weight: bold;
  color: #667eea;
}

.fee-description {
  font-size: 12px;
  color: #888;
  margin-top: 8px;
}

.status-message {
  margin-top: 15px;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.status-success {
  background: #f0f9ff;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.status-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.status-warning {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}

.terms {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #666;
  margin-top: 20px;
}

.check-icon {
  margin-right: 8px;
  color: #67c23a;
  font-weight: bold;
}
</style>