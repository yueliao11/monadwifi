const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 分析 PayAndReturnContract 钱包最小余额要求...\n');
  
  const contractAddress = '0x4b2f2583B3730820D0A8F2076e3a90Af26872B99';
  
  try {
    // 从前端配置获取支付金额
    const paymentAmount = ethers.parseEther('1.0'); // 1.0 tMON
    const expectedReturnAmount = ethers.parseEther('0.8'); // 0.8 tMON
    
    console.log('📊 支付配置分析:');
    console.log('- 用户支付金额:', ethers.formatEther(paymentAmount), 'tMON');
    console.log('- 预期返还金额:', ethers.formatEther(expectedReturnAmount), 'tMON');
    console.log('- 实际消费金额:', ethers.formatEther(paymentAmount - expectedReturnAmount), 'tMON');
    
    // 获取当前网络Gas价格
    const feeData = await ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits('50', 'gwei'); // 默认50 Gwei
    console.log('\n⛽ Gas 费用分析:');
    console.log('- 当前 Gas 价格:', ethers.formatUnits(gasPrice, 'gwei'), 'Gwei');
    
    // 估算payAndReturn函数的Gas消耗
    // 基于合约复杂度的估算
    const estimatedGasLimit = 150000; // 估算的Gas限制
    const totalGasCost = gasPrice * BigInt(estimatedGasLimit);
    
    console.log('- 估算 Gas 限制:', estimatedGasLimit.toLocaleString());
    console.log('- 估算 Gas 费用:', ethers.formatEther(totalGasCost), 'tMON');
    
    // 计算最小钱包余额要求
    const minimumForPayment = paymentAmount; // 支付金额
    const minimumForGas = totalGasCost; // Gas费用
    const safetyBuffer = ethers.parseEther('0.01'); // 0.01 tMON 安全缓冲
    
    const totalMinimumBalance = minimumForPayment + minimumForGas + safetyBuffer;
    
    console.log('\n💰 最小余额要求计算:');
    console.log('- 支付金额需求:', ethers.formatEther(minimumForPayment), 'tMON');
    console.log('- Gas 费用需求:', ethers.formatEther(minimumForGas), 'tMON');
    console.log('- 安全缓冲需求:', ethers.formatEther(safetyBuffer), 'tMON');
    console.log('- 总计最小余额:', ethers.formatEther(totalMinimumBalance), 'tMON');
    
    // 分析不同支付金额的要求
    console.log('\n📈 不同支付金额的最小余额要求:');
    const paymentAmounts = ['0.1', '0.5', '1.0', '2.0', '5.0'];
    
    for (const amount of paymentAmounts) {
      const payAmount = ethers.parseEther(amount);
      const totalRequired = payAmount + minimumForGas + safetyBuffer;
      console.log(`- 支付 ${amount} tMON 需要钱包余额: ${ethers.formatEther(totalRequired)} tMON`);
    }
    
    // 合约限制分析
    console.log('\n🔒 合约限制分析:');
    console.log('- 最小支付金额: > 0 tMON (合约要求)');
    console.log('- 最大支付金额: 无限制');
    console.log('- 返还百分比: 80%');
    console.log('- 实际消费比例: 20%');
    
    // 实际场景建议
    console.log('\n💡 实际使用建议:');
    console.log('✅ 推荐最小钱包余额:', ethers.formatEther(totalMinimumBalance), 'tMON');
    console.log('✅ 安全的钱包余额:', ethers.formatEther(totalMinimumBalance * 2n), 'tMON');
    console.log('✅ 充裕的钱包余额:', ethers.formatEther(totalMinimumBalance * 5n), 'tMON');
    
    // 失败场景分析
    console.log('\n❌ 可能的失败场景:');
    console.log('1. 余额 < 支付金额 → "insufficient funds" 错误');
    console.log('2. 余额 < 支付金额 + Gas费 → 交易失败');
    console.log('3. 合约余额不足 → 返还金额减少但不影响交易');
    
    // 获取测试网水龙头信息
    console.log('\n🚰 获取测试币:');
    console.log('- Monad 测试网水龙头: https://testnet-faucet.monad.xyz');
    console.log('- 建议申请金额: 10-20 tMON');
    console.log('- 申请频率: 通常24小时一次');
    
    return {
      minimumBalance: ethers.formatEther(totalMinimumBalance),
      recommendedBalance: ethers.formatEther(totalMinimumBalance * 2n),
      paymentAmount: ethers.formatEther(paymentAmount),
      gasCost: ethers.formatEther(totalGasCost)
    };
    
  } catch (error) {
    console.error('❌ 分析失败:', error.message);
    return null;
  }
}

main()
  .then((result) => {
    if (result) {
      console.log('\n📋 总结:');
      console.log(`钱包最少需要 ${result.minimumBalance} tMON 才能完成支付`);
      console.log(`建议保持 ${result.recommendedBalance} tMON 以确保稳定使用`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
