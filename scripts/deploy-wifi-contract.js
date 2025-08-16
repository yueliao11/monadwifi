const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🌟 正在部署 WiFi支付合约 到 Monad 测试网...\n');

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log('🔐 部署账户:', deployer.address);
  
  // 检查账户余额
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInEther = ethers.formatEther(balance);
  console.log('💰 账户余额:', balanceInEther, 'tMON');
  
  // 验证余额是否足够
  const minRequiredBalance = ethers.parseEther('0.1'); // 至少需要0.1 tMON
  if (balance < minRequiredBalance) {
    console.log('❌ 错误: 账户余额不足!');
    console.log('💡 请通过以下方式获取测试代币:');
    console.log('   1. 访问 Monad 测试网水龙头');
    console.log('   2. 加入 Monad Discord 获取测试代币');
    console.log('   3. 确保账户至少有 0.1 tMON');
    process.exit(1);
  }

  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  console.log('🌐 网络信息:');
  console.log('   - 名称: Monad Testnet');
  console.log('   - 链ID:', network.chainId.toString());
  console.log('   - RPC: https://testnet-rpc.monad.xyz\n');

  console.log('📋 合约配置:');
  console.log('   - 支付费用: 0.01 tMON (固定)');
  console.log('   - 模式: 直接扣费，无返还');
  console.log('   - 用途: WiFi访问权限\n');

  // 预估Gas费用
  console.log('⛽ 预估Gas费用...');
  const WiFiPaymentContract = await ethers.getContractFactory('WiFiPaymentContract');
  
  try {
    const deploymentData = WiFiPaymentContract.getDeployTransaction();
    const gasEstimate = await ethers.provider.estimateGas(deploymentData);
    const gasPrice = await ethers.provider.getFeeData();
    const estimatedCost = gasEstimate * gasPrice.gasPrice;
    
    console.log('   - 预估Gas量:', gasEstimate.toString());
    console.log('   - Gas价格:', ethers.formatUnits(gasPrice.gasPrice, 'gwei'), 'gwei');
    console.log('   - 预估费用:', ethers.formatEther(estimatedCost), 'tMON\n');
    
    if (balance < estimatedCost * 2n) { // 预留2倍Gas费用
      console.log('⚠️  警告: 余额可能不足以支付Gas费用');
      console.log('   建议至少准备:', ethers.formatEther(estimatedCost * 3n), 'tMON\n');
    }
  } catch (error) {
    console.log('⚠️  无法预估Gas费用，继续部署...\n');
  }

  // 确认部署
  console.log('🚀 开始部署合约...');
  
  const contract = await WiFiPaymentContract.deploy({
    gasLimit: 3000000, // 设置足够的Gas限制
  });

  console.log('⏳ 等待部署确认...');
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();
  
  console.log('✅ 合约部署成功!');
  console.log('📍 合约地址:', contractAddress);
  console.log('🔗 交易哈希:', deployTx.hash);
  console.log('⛽ 实际Gas使用:', deployTx.gasLimit.toString());
  
  // 等待更多确认
  console.log('⏳ 等待区块确认...');
  const receipt = await deployTx.wait(3); // 等待3个区块确认
  console.log('✅ 已获得', receipt.confirmations, '个确认\n');

  // 验证合约状态
  console.log('📊 验证合约状态...');
  const contractBalance = await ethers.provider.getBalance(contractAddress);
  const paymentFee = await contract.getPaymentFee();
  const contractOwner = await contract.owner();
  
  console.log('✅ 合约验证通过:');
  console.log('   - 合约余额:', ethers.formatEther(contractBalance), 'tMON');
  console.log('   - 支付费用:', ethers.formatEther(paymentFee), 'tMON');
  console.log('   - 合约所有者:', contractOwner);
  console.log('   - 部署者地址:', deployer.address);
  console.log('   - 所有权验证:', contractOwner === deployer.address ? '✅' : '❌');

  // 保存部署信息
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    transactionHash: deployTx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    gasPrice: deployTx.gasPrice.toString(),
    paymentFee: ethers.formatEther(paymentFee),
    deployedAt: new Date().toISOString(),
    network: 'Monad Testnet',
    chainId: Number(network.chainId),
    contractBalance: ethers.formatEther(contractBalance),
    confirmations: receipt.confirmations,
    contractType: 'WiFiPaymentContract'
  };

  // 确保目录存在
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // 保存到文件
  const deploymentFile = path.join(deploymentsDir, 'wifi-contract-monad.json');
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log('\n📝 部署信息已保存到:', deploymentFile);

  // 输出前端配置代码
  console.log('\n🔧 前端集成配置:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('// 1. 更新 src/composables/usePayment.ts');
  console.log('const CONTRACT_CONFIG = {');
  console.log(`  address: "${contractAddress}",`);
  console.log('  abi: [');
  console.log('    "function payForWiFi() external payable",');
  console.log('    "function getPaymentFee() external pure returns (uint256)",');
  console.log('    "function checkPaymentStatus(address user) external view returns (bool, uint256)",');
  console.log('    "function getUserStats(address user) external view returns (uint256, uint256, bool)",');
  console.log('    "function getContractStats() external view returns (uint256, uint256, uint256, uint256)",');
  console.log('    "event PaymentMade(address indexed user, uint256 paymentAmount, uint256 timestamp)"');
  console.log('  ]');
  console.log('};');
  console.log('\n// 2. 更新 .env 文件');
  console.log(`VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 区块链浏览器链接
  console.log('\n🔍 区块链浏览器链接:');
  console.log(`   合约: https://testnet-explorer.monad.xyz/address/${contractAddress}`);
  console.log(`   交易: https://testnet-explorer.monad.xyz/tx/${deployTx.hash}`);

  // 下一步指引
  console.log('\n🎯 部署完成！接下来的步骤:');
  console.log('1. ✅ 更新前端合约地址配置');
  console.log('2. ✅ 启动前端应用: npm run dev');
  console.log('3. ✅ 用MetaMask连接Monad测试网');
  console.log('4. ✅ 测试0.01 tMON支付功能');
  console.log('5. ✅ 验证WiFi访问权限');

  // 功能说明
  console.log('\n📋 合约功能说明:');
  console.log('• 固定支付: 0.01 tMON');
  console.log('• 无返还机制');
  console.log('• 支付即获得WiFi访问权限');
  console.log('• 支持多余金额自动退还');
  console.log('• 1小时访问有效期');

  // 安全提醒
  console.log('\n🔒 安全提醒:');
  console.log('• 合约已部署到测试网，请勿用于生产环境');
  console.log('• 测试代币无实际价值，仅用于功能验证');
  console.log('• 支付金额低，适合频繁测试');
  
  console.log('\n🎉 感谢使用 Monad WiFi Payment System!');
  console.log('   展示了DePIN微支付的实际应用 ✨');
}

main()
  .then(() => {
    console.log('\n✅ 部署脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 部署失败:', error.message);
    console.log('\n🛠️  故障排除建议:');
    console.log('1. 检查网络连接');
    console.log('2. 确认私钥正确');
    console.log('3. 验证账户余额充足');
    console.log('4. 尝试提高Gas价格');
    console.log('5. 检查Monad测试网状态');
    process.exit(1);
  });