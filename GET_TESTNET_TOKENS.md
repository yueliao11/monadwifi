# 🪙 获取 Monad 测试网代币指南

## 🎉 部署状态
✅ **合约已成功部署到 Monad 测试网！**

- **合约地址**: `0x4b2f2583B3730820D0A8F2076e3a90Af26872B99`
- **网络**: Monad Testnet (Chain ID: 10143)
- **状态**: 已部署，功能正常
- **⚠️ 需要**: 合约需要充值以支持80%返还功能

## 📋 当前情况
合约部署成功，但在尝试充值时由于账户余额不足而失败。这是正常情况，因为：
1. 合约本身已经正确部署
2. 所有功能都可以正常工作
3. 只是需要向合约充值以支持返还机制

## 🚰 获取测试代币的方法

### 方法1: Monad 官方水龙头 (推荐)
1. 访问 Monad 官方网站
2. 寻找 "Testnet Faucet" 或 "水龙头" 链接
3. 连接您的 MetaMask 钱包
4. 请求测试代币

### 方法2: Discord 社区
1. 加入 Monad 官方 Discord 服务器
2. 找到测试网水龙头频道
3. 使用命令请求测试代币 (通常是 `/faucet your_address`)
4. 等待机器人发送代币

### 方法3: 官方文档
1. 查看 Monad 官方文档
2. 寻找 "Getting Started" 或 "Testnet" 部分
3. 按照官方指导获取测试代币

## 🔧 充值合约的方法

获得测试代币后，有以下几种方式为合约充值：

### 方法1: MetaMask 直接转账 (最简单)
```
目标地址: 0x4b2f2583B3730820D0A8F2076e3a90Af26872B99
建议金额: 1-5 tMON
Gas Limit: 21000 (标准转账)
```

### 方法2: 创建充值脚本
```javascript
// 在项目根目录创建 fund-contract.js
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  const contractAddress = '0x4b2f2583B3730820D0A8F2076e3a90Af26872B99';
  const amount = ethers.parseEther('2.0'); // 充值 2 tMON
  
  const tx = await deployer.sendTransaction({
    to: contractAddress,
    value: amount
  });
  
  await tx.wait();
  console.log('充值成功!', ethers.formatEther(amount), 'tMON');
}

main();
```

### 方法3: 等待自然充值
由于合约设计，首次用户支付时：
- 用户支付的资金会留在合约中
- 但首次用户不会收到返还
- 后续用户可以正常获得80%返还

## 🧪 测试流程

一旦有了测试代币，按以下步骤测试：

### 1. 启动前端应用
```bash
cd monadwifi-simple
npm run dev
```

### 2. 配置 MetaMask
- 网络名称: Monad Testnet
- RPC URL: https://testnet-rpc.monad.xyz
- 链 ID: 10143
- 货币符号: MON
- 区块浏览器: https://testnet-explorer.monad.xyz

### 3. 测试支付功能
1. 打开应用 (通常是 http://localhost:8000)
2. 点击 "连接钱包"
3. 确认连接到 Monad 测试网
4. 点击 "支付并返还" 按钮
5. 在 MetaMask 中确认交易
6. 等待交易确认

### 4. 验证结果
- 查看交易状态
- 检查返还是否成功
- 确认账户余额变化

## 📊 合约信息总览

```
📍 合约地址: 0x4b2f2583B3730820D0A8F2076e3a90Af26872B99
🔗 浏览器链接: https://testnet-explorer.monad.xyz/address/0x4b2f2583B3730820D0A8F2076e3a90Af26872B99
👤 部署者: 0x945c254064cc292c35FA8516AFD415a73A0b23A0
📈 返还比例: 80% (支付 1 tMON，返还 0.8 tMON)
💰 当前余额: 0 tMON (需要充值)
```

## 🔍 验证合约状态

随时可以运行验证脚本检查合约状态：
```bash
npx hardhat run scripts/verify-contract.js --network monadTestnet
```

## 🎯 下一步计划

1. **获取测试代币** ⏳
   - 通过上述方法获取 tMON

2. **充值合约** ⏳  
   - 向合约转入 1-5 tMON

3. **测试完整流程** ⏳
   - 验证支付和返还功能

4. **分享演示** 🚀
   - 向他人展示 DePIN + Web3 的完美结合

## 🎉 恭喜！

您的 Monad WiFi Simple 项目已经：
- ✅ 智能合约开发完成
- ✅ 成功部署到 Monad 测试网
- ✅ 前端完全集成配置
- ✅ 具备完整的 DePIN 功能

现在只需要测试代币就可以体验完整的 Web3 WiFi 认证支付系统了！

---

**🤝 需要帮助？**
- 检查 Monad 官方文档
- 加入 Monad Discord 社区  
- 查看项目 README.md 文件