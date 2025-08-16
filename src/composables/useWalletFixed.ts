import { ref } from 'vue'
import { EthersCompat } from '../utils/ethersCompat'

interface ConnectResult {
  success: boolean
  address?: string
  chainId?: number
  error?: string
}

const MONAD_TESTNET = {
  chainId: '0x279F', // 10143 in hex
  chainName: 'Monad Testnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: ['https://testnet-rpc.monad.xyz'],
  blockExplorerUrls: ['https://testnet-explorer.monad.xyz'],
}

// 全局共享的钱包状态
const provider = ref<any>(null)
const signer = ref<any>(null)

export function useWallet() {
  // 使用全局共享的ref，而不是每次创建新的

  const checkMetaMask = (): boolean => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  }

  const switchToMonadTestnet = async (): Promise<boolean> => {
    if (!window.ethereum) return false

    try {
      // 尝试切换到 Monad 测试网
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_TESTNET.chainId }],
      })
      return true
    } catch (switchError: any) {
      // 如果网络不存在，则添加网络
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [MONAD_TESTNET],
          })
          return true
        } catch (addError) {
          console.error('Failed to add Monad Testnet:', addError)
          return false
        }
      }
      console.error('Failed to switch to Monad Testnet:', switchError)
      return false
    }
  }

  const connectWallet = async (): Promise<ConnectResult> => {
    if (!checkMetaMask()) {
      return {
        success: false,
        error: '请安装 MetaMask 钱包'
      }
    }

    try {
      console.log('Starting wallet connection...')
      
      // 请求连接钱包
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      console.log('Accounts received:', accounts)
      
      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          error: '未获取到钱包账户'
        }
      }

      // 切换到 Monad 测试网
      const switched = await switchToMonadTestnet()
      if (!switched) {
        return {
          success: false,
          error: '无法切换到 Monad 测试网，请手动添加网络'
        }
      }

      console.log('Creating provider...')
      // 使用兼容性层创建 provider
      provider.value = await EthersCompat.createProvider(window.ethereum)
      console.log('Provider created successfully')
      
      // 获取网络信息
      const network = await EthersCompat.getNetwork(provider.value)
      console.log('Network info:', network)

      // 获取地址
      const address = accounts[0]

      // 尝试获取 signer
      try {
        console.log('Creating signer...')
        signer.value = await EthersCompat.getSigner(provider.value)
        console.log('Signer created successfully')
      } catch (signerError) {
        console.warn('Signer creation failed, continuing without signer:', signerError)
        signer.value = null
      }

      return {
        success: true,
        address,
        chainId: Number(network.chainId)
      }
    } catch (error: any) {
      console.error('Connect wallet error:', error)
      
      // 重置状态
      provider.value = null
      signer.value = null
      
      return {
        success: false,
        error: error.message || '连接钱包失败'
      }
    }
  }

  const checkConnection = async (): Promise<ConnectResult> => {
    if (!checkMetaMask()) {
      return { success: false }
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (!accounts || accounts.length === 0) {
        return { success: false }
      }

      // 检查当前链ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      if (parseInt(chainId, 16) !== 10143) {
        return { success: false, error: '请切换到 Monad 测试网' }
      }

      // 创建 provider（如果需要）
      if (!provider.value) {
        provider.value = await EthersCompat.createProvider(window.ethereum)
      }

      // 尝试创建 signer（如果需要）
      if (!signer.value) {
        try {
          signer.value = await EthersCompat.getSigner(provider.value)
        } catch (signerError) {
          console.warn('Signer creation failed in checkConnection:', signerError)
          signer.value = null
        }
      }

      return {
        success: true,
        address: accounts[0],
        chainId: 10143
      }
    } catch (error) {
      console.error('Check connection error:', error)
      return { success: false }
    }
  }

  const getBalance = async (address: string): Promise<string> => {
    try {
      // 如果没有 provider，创建一个临时的
      let tempProvider = provider.value
      if (!tempProvider) {
        tempProvider = await EthersCompat.createProvider(window.ethereum)
      }

      return await EthersCompat.getBalance(tempProvider, address)
    } catch (error) {
      console.error('Get balance error:', error)
      return '0'
    }
  }

  const disconnect = () => {
    provider.value = null
    signer.value = null
  }

  return {
    provider,
    signer,
    connectWallet,
    checkConnection,
    getBalance,
    disconnect,
    checkMetaMask
  }
}