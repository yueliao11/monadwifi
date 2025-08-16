# 📋 Monad WiFi Simple - 部署指南

## 🎯 部署概览

本项目已成功实现基于Monad测试网的智能合约部署和前端集成。

### ✅ 已完成的工作

1. **智能合约开发** ✅
   - `PayAndReturnContract.sol` - 完整的支付返还合约
   - 80%自动返还机制
   - 详细的事件记录和状态管理

2. **合约编译** ✅
   - 使用Hardhat编译成功
   - 无警告，完全兼容EVM

3. **本地测试部署** ✅
   - 在Hardhat本地网络成功部署
   - 合约地址: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
   - 初始充值: 10 tMON

4. **前端集成配置** ✅
   - 更新了合约地址和ABI
   - 配置了Monad测试网参数

## 🚀 实际部署到Monad测试网

### 1. 获取测试网代币

在部署到Monad测试网之前，您需要：

1. **设置MetaMask**
   - 网络名称: Monad Testnet
   - RPC URL: https://testnet-rpc.monad.xyz
   - 链ID: 10143
   - 货币符号: MON

2. **获取测试代币**
   - 访问Monad测试网水龙头
   - 或通过官方Discord获取测试代币
   - 确保账户有足够的tMON用于部署和Gas费

### 2. 配置部署账户

```bash
# 1. 复制环境变量文件
cp .env.example .env

# 2. 编辑.env文件，填入您的私钥
PRIVATE_KEY=您的实际私钥
```

⚠️ **安全提醒**: 
- 绝不要将包含真实私钥的.env文件提交到代码仓库
- 只在测试网使用，不要使用主网私钥

### 3. 执行部署

```bash
# 编译合约
npm run compile

# 部署到Monad测试网
npm run deploy:monad
```

### 4. 部署成功后的配置

部署成功后，您需要：

1. **更新前端合约地址**
   ```typescript
   // 在 src/composables/usePayment.ts 中
   const CONTRACT_CONFIG = {
     address: '您的实际合约地址',
     // ... 其他配置
   }
   ```

2. **更新环境变量**
   ```bash
   VITE_CONTRACT_ADDRESS=您的实际合约地址
   ```

## 📊 当前部署状态

### 本地测试网部署信息
```json
{
  "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "deployerAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "transactionHash": "0x22d0281992436cdb4182900472d183431a9636b222865c711267f95236f55a9d",
  "returnPercentage": 80,
  "network": "Hardhat Local",
  "contractBalance": "10.0 ETH"
}
```

### Monad测试网部署 (待完成)
- ⏳ 等待用户获取测试代币后执行
- 🎯 目标: 部署相同合约到Monad测试网

## 🔧 前端集成代码

当合约部署到Monad测试网后，使用以下代码集成：

```javascript
const CONTRACT_ADDRESS = "您的合约地址";
const CONTRACT_ABI = [
  "function payAndReturn() external payable",
  "function getUserStats(address user) external view returns (uint256, uint256, uint256)",
  "function getContractStats() external view returns (uint256, uint256, uint256, uint256)",
  "event PaymentMade(address indexed user, uint256 paidAmount, uint256 returnedAmount, uint256 timestamp)"
];
```

## 🧪 测试流程

### 1. 本地测试 (已完成)
```bash
# 启动本地Hardhat网络
npm run node

# 在新终端部署合约
npm run deploy:local

# 启动前端
npm run dev
```

### 2. Monad测试网测试 (部署后)
1. 确保MetaMask连接到Monad测试网
2. 确保账户有足够的tMON余额
3. 在前端界面测试支付功能
4. 验证80%返还机制

## 🛠 故障排除

### 常见问题

1. **Gas费用过低**
   ```
   Error: maxFeePerGas too low
   ```
   - 解决方案: 已将Gas价格提高到50 gwei

2. **余额不足**
   ```
   Error: insufficient funds
   ```
   - 解决方案: 获取更多测试代币

3. **网络连接问题**
   ```
   Error: network timeout
   ```
   - 解决方案: 检查RPC连接，已设置60秒超时

### 调试命令

```bash
# 检查网络连接
npx hardhat run scripts/deploy.js --network monadTestnet

# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test
```

## 📈 下一步工作

1. **获取Monad测试网代币** ⏳
2. **部署到Monad测试网** ⏳
3. **更新前端配置** ⏳
4. **端到端测试** ⏳
5. **服务端API开发** (可选)

## 🎉 总结

- ✅ 智能合约开发完成
- ✅ 本地部署测试成功
- ✅ 前端集成配置完成
- ⏳ 等待Monad测试网部署

项目技术架构已经完全就绪，只需要获取测试代币即可完成实际部署！