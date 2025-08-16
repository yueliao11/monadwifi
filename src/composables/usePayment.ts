import { ethers } from 'ethers'
import axios from 'axios'
import { useWallet } from './useWalletFixed'
import { EthersCompat } from '../utils/ethersCompat'
import type { PaymentRequest, ServerResponse } from '../types'

interface PaymentResult {
  success: boolean
  txHash?: string
  error?: string
}

// 合约配置 - WiFi支付合约
const CONTRACT_CONFIG = {
  // WiFi支付合约地址 - 0.01 tMON固定费用
  address: '0x870f01a9a4ebCbB1Aaeb2ee3ca09c447B9B8d9AA',
  abi: [
    // 核心支付函数
    'function payForWiFi() external payable',
    
    // 查询函数
    'function getPaymentFee() external pure returns (uint256)',
    'function checkPaymentStatus(address user) external view returns (bool, uint256)',
    'function getUserStats(address user) external view returns (uint256, uint256, bool)',
    'function getContractStats() external view returns (uint256, uint256, uint256, uint256)',
    
    // 事件
    'event PaymentMade(address indexed user, uint256 paymentAmount, uint256 timestamp)'
  ]
}

// 服务端验证 URL
const SERVER_VERIFY_URL = 'https://your.backend/authorize'

export function usePayment() {
  const { provider, signer } = useWallet()

  const payAndReturn = async (
    paidAmount: number,
    returnedAmount: number
  ): Promise<PaymentResult> => {
    console.log('🔄 payAndReturn called with:', { paidAmount, returnedAmount })
    console.log('🔍 Current wallet state:', { 
      hasProvider: !!provider.value, 
      hasSigner: !!signer.value,
      provider: provider.value,
      signer: signer.value
    })
    
    if (!provider.value) {
      console.error('❌ Provider is null, wallet not connected')
      return {
        success: false,
        error: '钱包未连接'
      }
    }

    // 如果没有signer，尝试创建一个
    if (!signer.value) {
      try {
        signer.value = await EthersCompat.getSigner(provider.value)
      } catch (error) {
        console.warn('无法创建signer，使用provider进行交易')
      }
    }

    try {
      // 创建合约实例，优先使用signer，否则使用provider
      const signerOrProvider = signer.value || provider.value
      const contract = await EthersCompat.createContract(
        CONTRACT_CONFIG.address,
        CONTRACT_CONFIG.abi,
        signerOrProvider
      )

      // 发送交易
      const tx = await contract.payForWiFi({
        value: EthersCompat.parseEther(paidAmount.toString())
      })

      console.log('Transaction sent:', tx.hash)

      // 等待交易确认
      const receipt = await tx.wait()
      console.log('Transaction confirmed:', receipt)

      // 支付成功，直接返回结果（不再需要后端验证）
      return {
        success: true,
        txHash: receipt.hash
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      
      // 处理用户拒绝交易的情况
      if (error.code === 4001) {
        return {
          success: false,
          error: '用户取消了交易'
        }
      }
      
      // 处理余额不足的情况
      if (error.code === 'INSUFFICIENT_FUNDS') {
        return {
          success: false,
          error: '余额不足'
        }
      }

      return {
        success: false,
        error: error.message || '支付失败'
      }
    }
  }

  const verifyPayment = async (
    paymentData: PaymentRequest
  ): Promise<ServerResponse> => {
    try {
      const response = await axios.post<ServerResponse>(
        SERVER_VERIFY_URL,
        paymentData,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data
    } catch (error: any) {
      console.error('Server verification error:', error)
      
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          message: '服务器响应超时',
          allowAccess: false
        }
      }

      if (error.response) {
        return {
          success: false,
          message: `服务器错误: ${error.response.status}`,
          allowAccess: false
        }
      }

      return {
        success: false,
        message: '网络连接失败',
        allowAccess: false
      }
    }
  }

  // 模拟支付 - 用于开发测试
  const mockPayment = async (
    paidAmount: number,
    returnedAmount: number
  ): Promise<PaymentResult> => {
    console.log('Using mock payment for development')
    
    // 模拟交易延迟
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 模拟成功交易
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
    
    // 模拟服务端验证
    const mockServerResponse: ServerResponse = {
      success: true,
      message: 'Mock payment verified successfully',
      allowAccess: true
    }

    return {
      success: true,
      txHash: mockTxHash
    }
  }

  return {
    payAndReturn,
    verifyPayment,
    mockPayment
  }
}