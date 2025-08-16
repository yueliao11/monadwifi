export interface WalletState {
  connected: boolean
  address: string
  balance: string
  chainId: number | null
}

export interface PaymentState {
  loading: boolean
  txHash: string | null
  status: 'idle' | 'pending' | 'success' | 'failed'
  message: string
}

export interface ContractConfig {
  address: string
  abi: any[]
}

export interface ServerResponse {
  success: boolean
  message: string
  allowAccess: boolean
}

export interface PaymentRequest {
  txHash: string
  userAddress: string
  paidAmount: number
  returnedAmount: number
  timestamp?: number
}