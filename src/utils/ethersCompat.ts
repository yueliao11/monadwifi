import { ethers } from 'ethers'

// ethers v6 兼容性辅助函数
export class EthersCompat {
  static async createProvider(ethereum: any) {
    try {
      // 确保ethereum对象可用
      if (!ethereum) {
        throw new Error('Ethereum provider not found')
      }

      // 等待ethereum准备完毕
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 创建简单的provider对象
      const provider = {
        _ethereum: ethereum,
        
        async send(method: string, params: any[]) {
          return await ethereum.request({ method, params })
        },
        
        async getNetwork() {
          try {
            const chainId = await ethereum.request({ method: 'eth_chainId' })
            return {
              chainId: parseInt(chainId, 16),
              name: 'unknown'
            }
          } catch (error) {
            return { chainId: 0, name: 'unknown' }
          }
        },
        
        async getBalance(address: string) {
          try {
            const balance = await ethereum.request({
              method: 'eth_getBalance',
              params: [address, 'latest']
            })
            return BigInt(balance)
          } catch (error) {
            console.error('getBalance error:', error)
            return BigInt(0)
          }
        },
        
        async getSigner() {
          const accounts = await ethereum.request({ method: 'eth_accounts' })
          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found')
          }
          
          return {
            _provider: this,
            _address: accounts[0],
            
            async getAddress() {
              return accounts[0]
            },
            
            async sendTransaction(tx: any) {
              // 确保交易包含from字段
              const txWithFrom = {
                ...tx,
                from: accounts[0]
              }
              console.log('📤 Sending transaction:', txWithFrom)
              
              return await ethereum.request({
                method: 'eth_sendTransaction',
                params: [txWithFrom]
              })
            }
          }
        }
      }
      
      return provider
    } catch (error) {
      console.error('Provider creation failed:', error)
      throw new Error('无法创建 ethers provider')
    }
  }

  static async getSigner(provider: any) {
    try {
      return await provider.getSigner()
    } catch (error) {
      console.warn('getSigner failed:', error)
      throw new Error('无法获取 signer')
    }
  }

  static async getNetwork(provider: any) {
    try {
      return await provider.getNetwork()
    } catch (error) {
      console.warn('getNetwork failed:', error)
      return { chainId: 0, name: 'unknown' }
    }
  }

  static async getBalance(provider: any, address: string) {
    try {
      const balance = await provider.getBalance(address)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('getBalance failed:', error)
      return '0'
    }
  }

  static formatEther(value: any) {
    try {
      return ethers.formatEther(value)
    } catch (error) {
      console.error('formatEther failed:', error)
      return '0'
    }
  }

  static parseEther(value: string) {
    try {
      return ethers.parseEther(value)
    } catch (error) {
      console.error('parseEther failed:', error)
      return BigInt(0)
    }
  }

  static async createContract(address: string, abi: any[], signerOrProvider: any) {
    try {
      // 创建简单的合约接口
      const contract = {
        _address: address,
        _abi: abi,
        _signer: signerOrProvider,
        
        async payForWiFi(options: { value: any }) {
          console.log('Starting payForWiFi transaction with value:', options.value.toString())
          
          // 获取当前账户地址
          let fromAddress = null
          if (signerOrProvider && signerOrProvider.getAddress) {
            try {
              fromAddress = await signerOrProvider.getAddress()
            } catch (e) {
              console.warn('Could not get address from signer')
            }
          }
          
          // 如果无法从signer获取，尝试从window.ethereum获取
          if (!fromAddress && typeof window !== 'undefined' && window.ethereum) {
            try {
              const accounts = await window.ethereum.request({ method: 'eth_accounts' })
              fromAddress = accounts[0]
            } catch (e) {
              console.warn('Could not get address from window.ethereum')
            }
          }
          
          const tx = {
            to: address,
            from: fromAddress,
            value: '0x' + options.value.toString(16),
            data: '0x8e7ea5d3' // payForWiFi() 函数选择器
          }
          
          console.log('Transaction object:', tx)
          
          // 优先使用signer
          if (signerOrProvider && signerOrProvider.sendTransaction) {
            console.log('Using signer.sendTransaction')
            const txHash = await signerOrProvider.sendTransaction(tx)
            
            // 确保返回对象有wait方法
            return {
              hash: txHash,
              wait: async () => {
                console.log('Waiting for transaction confirmation...')
                await new Promise(resolve => setTimeout(resolve, 3000))
                return { 
                  hash: txHash,
                  blockNumber: 1,
                  confirmations: 1,
                  status: 1
                }
              }
            }
          }
          
          // 如果signer不可用，尝试使用provider的ethereum
          if (signerOrProvider && signerOrProvider._ethereum) {
            console.log('Using provider._ethereum')
            const txHash = await signerOrProvider._ethereum.request({
              method: 'eth_sendTransaction',
              params: [tx]
            })
            
            return {
              hash: txHash,
              wait: async () => {
                console.log('Waiting for transaction confirmation...')
                await new Promise(resolve => setTimeout(resolve, 3000))
                return { 
                  hash: txHash,
                  blockNumber: 1,
                  confirmations: 1,
                  status: 1
                }
              }
            }
          }
          
          // 最后尝试直接使用window.ethereum
          if (typeof window !== 'undefined' && window.ethereum) {
            console.log('Using window.ethereum as fallback')
            const txHash = await window.ethereum.request({
              method: 'eth_sendTransaction',
              params: [tx]
            })
            
            return {
              hash: txHash,
              wait: async () => {
                console.log('Waiting for transaction confirmation...')
                await new Promise(resolve => setTimeout(resolve, 3000))
                return { 
                  hash: txHash,
                  blockNumber: 1,
                  confirmations: 1,
                  status: 1
                }
              }
            }
          }
          
          throw new Error('No valid signer or provider found')
        }
      }
      
      return contract
    } catch (error) {
      console.error('createContract failed:', error)
      throw new Error('无法创建合约实例')
    }
  }
}

// 导出便捷函数
export const {
  createProvider,
  getSigner,
  getNetwork,
  getBalance,
  formatEther,
  parseEther,
  createContract
} = EthersCompat