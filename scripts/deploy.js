const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 开始部署 PayAndReturnContract 到 Monad 测试网...\n');

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log('部署账户:', deployer.address);
  
  // 获取账户余额
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('账户余额:', ethers.formatEther(balance), 'tMON\n');

  // 设置返还百分比为 80%
  const returnPercentage = 80;
  
  console.log('合约参数:');
  console.log('- 返还百分比:', returnPercentage + '%');
  console.log('- 即用户支付 1 tMON，返还 0.8 tMON\n');

  // 部署合约
  console.log('⏳ 正在部署合约...');
  const PayAndReturnContract = await ethers.getContractFactory('PayAndReturnContract');
  const contract = await PayAndReturnContract.deploy(returnPercentage);

  await contract.waitForDeployment();

  console.log('✅ 合约部署成功！');
  console.log('📍 合约地址:', await contract.getAddress());
  console.log('🔗 交易哈希:', contract.deploymentTransaction().hash);
  console.log('⛽ Gas 使用量:', contract.deploymentTransaction().gasLimit.toString());
  
  // 向合约充值，确保有足够资金进行返还
  console.log('\n💰 向合约充值...');
  const depositAmount = ethers.parseEther('10'); // 充值 10 tMON
  const contractAddress = await contract.getAddress();
  const depositTx = await deployer.sendTransaction({
    to: contractAddress,
    value: depositAmount
  });
  
  await depositTx.wait();
  console.log('✅ 充值完成:', ethers.formatEther(depositAmount), 'tMON');
  
  // 验证合约状态
  console.log('\n📊 合约状态验证:');
  const contractBalance = await ethers.provider.getBalance(contractAddress);
  const contractReturnPercentage = await contract.returnPercentage();
  const contractOwner = await contract.owner();
  
  console.log('- 合约余额:', ethers.formatEther(contractBalance), 'tMON');
  console.log('- 返还百分比:', contractReturnPercentage.toString() + '%');
  console.log('- 合约所有者:', contractOwner);
  console.log('- 部署者地址:', deployer.address);
  console.log('- 所有者验证:', contractOwner === deployer.address ? '✅' : '❌');

  // 保存部署信息到文件
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    transactionHash: contract.deploymentTransaction().hash,
    returnPercentage: returnPercentage,
    deployedAt: new Date().toISOString(),
    network: 'Monad Testnet',
    chainId: 10143,
    contractBalance: ethers.formatEther(contractBalance)
  };

  const fs = require('fs');
  const path = require('path');
  
  // 确保 deployments 目录存在
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // 保存部署信息
  fs.writeFileSync(
    path.join(deploymentsDir, 'monad-testnet.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('\n📝 部署信息已保存到 deployments/monad-testnet.json');
  
  // 输出前端集成代码示例
  console.log('\n🔧 前端集成代码:');
  console.log('```javascript');
  console.log('const CONTRACT_ADDRESS =', `"${contractAddress}";`);
  console.log('const CONTRACT_ABI = [');
  console.log('  "function payAndReturn() external payable",');
  console.log('  "function getUserStats(address user) external view returns (uint256, uint256, uint256)",');
  console.log('  "function getContractStats() external view returns (uint256, uint256, uint256, uint256)",');
  console.log('  "event PaymentMade(address indexed user, uint256 paidAmount, uint256 returnedAmount, uint256 timestamp)"');
  console.log('];');
  console.log('```');

  console.log('\n🎉 部署完成！你现在可以:');
  console.log('1. 更新前端代码中的合约地址');
  console.log('2. 启动前端应用进行测试');
  console.log('3. 使用 MetaMask 连接 Monad 测试网');
  console.log('4. 测试支付和返还功能');
  
  console.log('\n📋 测试流程:');
  console.log('1. 确保 MetaMask 连接到 Monad 测试网');
  console.log('2. 确保账户有足够的 tMON 余额');
  console.log('3. 在前端界面点击"支付并返还"');
  console.log('4. 确认 MetaMask 交易');
  console.log('5. 等待交易确认和自动返还');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 部署失败:', error);
    process.exit(1);
  });