import { ref } from 'vue'
import { ethers } from 'ethers'

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

export function useWallet() {
  const provider = ref<ethers.BrowserProvider | null>(null)
  const signer = ref<ethers.JsonRpcSigner | null>(null)

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
      // 请求连接钱包
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      
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

      // 创建 provider
      provider.value = new ethers.BrowserProvider(window.ethereum)
      
      // 等待 provider 初始化
      await provider.value.send('eth_requestAccounts', [])
      
      // 获取 signer
      signer.value = await provider.value.getSigner()

      const address = await signer.value.getAddress()
      const network = await provider.value.getNetwork()

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

      // 创建 provider
      provider.value = new ethers.BrowserProvider(window.ethereum)
      
      // 检查网络
      const network = await provider.value.getNetwork()
      if (Number(network.chainId) !== 10143) {
        return { success: false, error: '请切换到 Monad 测试网' }
      }

      // 获取 signer
      try {
        signer.value = await provider.value.getSigner()
        const address = await signer.value.getAddress()

        return {
          success: true,
          address,
          chainId: Number(network.chainId)
        }
      } catch (signerError) {
        console.error('Signer error:', signerError)
        
        // 如果 getSigner 失败，使用账户地址
        return {
          success: true,
          address: accounts[0],
          chainId: Number(network.chainId)
        }
      }
    } catch (error) {
      console.error('Check connection error:', error)
      
      // 重置状态
      provider.value = null
      signer.value = null
      
      return { success: false }
    }
  }

  const getBalance = async (address: string): Promise<string> => {
    if (!provider.value) return '0'

    try {
      const balance = await provider.value.getBalance(address)
      return ethers.formatEther(balance)
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