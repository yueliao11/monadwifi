const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 检查 PayAndReturnContract 状态...\n');
  
  const contractAddress = '0x4b2f2583B3730820D0A8F2076e3a90Af26872B99';
  
  try {
    // 检查合约余额
    const balance = await ethers.provider.getBalance(contractAddress);
    console.log('📊 合约基本信息:');
    console.log('- 合约地址:', contractAddress);
    console.log('- 合约余额:', ethers.formatEther(balance), 'tMON');
    
    // 连接合约
    const contract = await ethers.getContractAt('PayAndReturnContract', contractAddress);
    
    // 检查合约配置
    const returnPercentage = await contract.returnPercentage();
    const owner = await contract.owner();
    
    console.log('\n⚙️ 合约配置:');
    console.log('- 返还百分比:', returnPercentage.toString() + '%');
    console.log('- 合约所有者:', owner);
    
    // 获取合约统计
    const stats = await contract.getContractStats();
    console.log('\n📈 使用统计:');
    console.log('- 总支付金额:', ethers.formatEther(stats[1]), 'tMON');
    console.log('- 总返还金额:', ethers.formatEther(stats[2]), 'tMON');
    
    // 检查当前用户账户
    const [signer] = await ethers.getSigners();
    const userBalance = await ethers.provider.getBalance(signer.address);
    console.log('\n👛 当前账户:');
    console.log('- 账户地址:', signer.address);
    console.log('- 账户余额:', ethers.formatEther(userBalance), 'tMON');
    console.log('- 是否为合约所有者:', signer.address === owner ? '✅' : '❌');
    
    // 判断合约状态
    const needsFunding = parseFloat(ethers.formatEther(balance)) < 1.0;
    console.log('\n🚨 状态评估:');
    console.log('- 合约是否需要充值:', needsFunding ? '⚠️ 是' : '✅ 否');
    
    if (needsFunding) {
      console.log('\n💡 建议操作:');
      console.log('1. 向合约充值至少 5-10 tMON 以支持返还功能');
      console.log('2. 运行 npm run fund-contract 进行充值');
      console.log('3. 或手动向合约地址转账');
    } else {
      console.log('\n✅ 合约状态良好，可以正常使用！');
    }
    
  } catch (error) {
    console.error('❌ 检查合约时出错:', error.message);
    
    if (error.code === 'NETWORK_ERROR') {
      console.log('\n💡 网络连接问题建议:');
      console.log('1. 检查网络连接');
      console.log('2. 确认 Monad 测试网 RPC 正常');
      console.log('3. 检查 .env 文件中的私钥配置');
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
