// 钱包状态接口
export interface WalletState {
  connected: boolean
  address: string
  balance: string
  chainId: number | null
}

// 支付状态接口
export interface PaymentState {
  loading: boolean
  txHash: string | null
  status: 'idle' | 'pending' | 'success' | 'failed'
  message: string
}

// 支付请求接口
export interface PaymentRequest {
  userAddress: string
  amount: number
  txHash: string
  timestamp: number
}

// 服务器响应接口
export interface ServerResponse {
  success: boolean
  message: string
  allowAccess: boolean
}