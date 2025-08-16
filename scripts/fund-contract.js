const { ethers } = require('hardhat');

async function main() {
  console.log('💰 正在向合约充值...\n');
  
  const contractAddress = '0x4b2f2583B3730820D0A8F2076e3a90Af26872B99';
  const fundAmount = ethers.parseEther('5.0'); // 充值 5 tMON
  
  try {
    const [signer] = await ethers.getSigners();
    
    // 检查账户余额
    const userBalance = await ethers.provider.getBalance(signer.address);
    console.log('当前账户:', signer.address);
    console.log('账户余额:', ethers.formatEther(userBalance), 'tMON');
    
    if (userBalance < fundAmount) {
      console.log('❌ 账户余额不足，无法充值');
      console.log('请先向账户充值 tMON 代币');
      console.log('获取测试币地址: https://testnet-faucet.monad.xyz');
      return;
    }
    
    // 检查合约当前余额
    const contractBalance = await ethers.provider.getBalance(contractAddress);
    console.log('合约当前余额:', ethers.formatEther(contractBalance), 'tMON');
    
    // 向合约发送资金
    console.log(`正在向合约充值 ${ethers.formatEther(fundAmount)} tMON...`);
    
    const tx = await signer.sendTransaction({
      to: contractAddress,
      value: fundAmount,
      gasLimit: 21000, // 标准转账的Gas限制
    });
    
    console.log('交易已发送:', tx.hash);
    console.log('等待交易确认...');
    
    const receipt = await tx.wait();
    console.log('✅ 交易确认完成!');
    console.log('区块号:', receipt.blockNumber);
    console.log('Gas 使用:', receipt.gasUsed.toString());
    
    // 检查充值后的余额
    const newContractBalance = await ethers.provider.getBalance(contractAddress);
    console.log('\n📊 充值结果:');
    console.log('合约新余额:', ethers.formatEther(newContractBalance), 'tMON');
    console.log('充值金额:', ethers.formatEther(fundAmount), 'tMON');
    
    // 更新部署记录
    const fs = require('fs');
    const path = require('path');
    
    const deploymentPath = path.join(__dirname, '..', 'deployments', 'monad-testnet-production.json');
    if (fs.existsSync(deploymentPath)) {
      const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      deploymentData.contractBalance = ethers.formatEther(newContractBalance);
      deploymentData.needsFunding = parseFloat(ethers.formatEther(newContractBalance)) < 1.0;
      deploymentData.lastFunded = new Date().toISOString();
      deploymentData.fundingTxHash = tx.hash;
      
      fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
      console.log('✅ 部署记录已更新');
    }
    
    console.log('\n🎉 合约充值完成！现在可以正常使用支付返还功能了。');
    
  } catch (error) {
    console.error('❌ 充值失败:', error.message);
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log('\n💡 建议: 请先获取 Monad 测试网代币');
      console.log('水龙头地址: https://testnet-faucet.monad.xyz');
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });