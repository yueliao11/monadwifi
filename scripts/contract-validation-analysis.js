const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 PayAndReturnContract 校验规则详细分析...\n');
  
  // 分析合约源码中的校验规则
  console.log('📋 合约源码校验规则:');
  console.log('1. payAndReturn() 函数校验:');
  console.log('   ✅ require(msg.value > 0, "Payment amount must be greater than 0")');
  console.log('   ✅ 最小支付金额: 大于 0 wei (理论上最小 0.000000000000000001 tMON)');
  console.log('   ✅ 最大支付金额: 无限制 (受钱包余额限制)');
  
  console.log('\n2. 返还机制校验:');
  console.log('   ✅ returnPercentage = 80% (固定配置)');
  console.log('   ✅ returnAmount = (paidAmount * 80) / 100');
  console.log('   ✅ 如果合约余额不足，returnAmount = 合约可用余额');
  console.log('   ✅ 返还失败不会导致整个交易回滚');
  
  console.log('\n3. 安全检查:');
  console.log('   ✅ 防重入攻击: 使用 transfer() 而非 call()');
  console.log('   ✅ 整数溢出: Solidity 0.8+ 自动检查');
  console.log('   ✅ 权限控制: owner-only 函数受保护');
  
  // 计算实际的最小值限制
  const minWei = 1n; // 1 wei
  const minEther = ethers.formatEther(minWei);
  
  console.log('\n💰 理论最小支付分析:');
  console.log('- 合约理论最小支付:', minWei.toString(), 'wei');
  console.log('- 转换为 tMON:', minEther, 'tMON');
  console.log('- 实际意义: 微不足道，可忽略');
  
  // 实际Gas费用详细分析
  const gasPrice = ethers.parseUnits('52', 'gwei'); // 从上面的结果
  
  console.log('\n⛽ Gas 费用详细分析:');
  
  // 不同操作的Gas消耗估算
  const gasEstimates = {
    simpleTransfer: 21000,           // 简单转账
    contractCall: 50000,             // 基础合约调用
    payAndReturn: 150000,            // payAndReturn函数
    firstTimeCall: 180000,           // 首次调用(更多存储写入)
  };
  
  for (const [operation, gasLimit] of Object.entries(gasEstimates)) {
    const gasCost = gasPrice * BigInt(gasLimit);
    console.log(`- ${operation}: ${gasLimit.toLocaleString()} Gas = ${ethers.formatEther(gasCost)} tMON`);
  }
  
  // 前端配置的实际要求
  console.log('\n🎯 前端配置实际要求:');
  const frontendPayment = ethers.parseEther('1.0');
  const expectedReturn = ethers.parseEther('0.8');
  const actualCost = frontendPayment - expectedReturn;
  
  console.log('- 用户支付:', ethers.formatEther(frontendPayment), 'tMON');
  console.log('- 预期返还:', ethers.formatEther(expectedReturn), 'tMON'); 
  console.log('- 实际消费:', ethers.formatEther(actualCost), 'tMON');
  console.log('- WiFi访问成本: 仅', ethers.formatEther(actualCost), 'tMON');
  
  // 不同场景的钱包余额要求
  console.log('\n📊 不同使用场景的余额要求:');
  
  const scenarios = [
    { name: '测试场景', payment: '0.01', desc: '最小测试支付' },
    { name: '经济场景', payment: '0.1', desc: '小额支付测试' },
    { name: '标准场景', payment: '1.0', desc: '前端默认配置' },
    { name: '高额场景', payment: '5.0', desc: '高价值支付' },
  ];
  
  const standardGasCost = gasPrice * BigInt(gasEstimates.payAndReturn);
  const buffer = ethers.parseEther('0.01');
  
  scenarios.forEach(scenario => {
    const payment = ethers.parseEther(scenario.payment);
    const totalRequired = payment + standardGasCost + buffer;
    const returnAmount = (payment * 80n) / 100n;
    const netCost = payment - returnAmount + standardGasCost;
    
    console.log(`\n${scenario.name} (${scenario.desc}):`);
    console.log(`  支付金额: ${ethers.formatEther(payment)} tMON`);
    console.log(`  预期返还: ${ethers.formatEther(returnAmount)} tMON`);
    console.log(`  所需余额: ${ethers.formatEther(totalRequired)} tMON`);
    console.log(`  实际花费: ${ethers.formatEther(netCost)} tMON`);
  });
  
  // 边界条件分析
  console.log('\n🚨 边界条件和失败场景:');
  
  console.log('\n失败场景 1: 余额不足');
  console.log('- 条件: 钱包余额 < 支付金额');
  console.log('- 错误: "insufficient funds for intrinsic transaction cost"');
  console.log('- 解决: 确保余额 ≥ 支付金额 + Gas费 + 缓冲');
  
  console.log('\n失败场景 2: Gas费不足');
  console.log('- 条件: 钱包余额 < 支付金额 + Gas费');
  console.log('- 错误: "out of gas" 或 "insufficient funds"');
  console.log('- 解决: 保留足够的Gas费用');
  
  console.log('\n失败场景 3: 合约余额不足');
  console.log('- 条件: 合约余额 < 应返还金额');
  console.log('- 结果: 返还金额减少，但交易成功');
  console.log('- 影响: 用户获得的返还 < 预期');
  
  console.log('\n成功场景: 正常执行');
  console.log('- 条件: 钱包余额充足 + 合约余额充足');
  console.log('- 结果: 支付成功，返还80%');
  console.log('- 用户体验: 仅消费20%获得WiFi访问');
  
  // 最终建议
  console.log('\n📋 最终建议总结:');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                  钱包余额要求建议                          ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║ 绝对最小值: 1.018 tMON (1.0支付 + 0.008Gas + 0.01缓冲)    ║');
  console.log('║ 安全推荐值: 2.036 tMON (2倍安全系数)                      ║');
  console.log('║ 充裕余额值: 5.0+ tMON (多次使用无忧)                      ║');
  console.log('║ 理想余额值: 10.0+ tMON (长期稳定使用)                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  return {
    minimumRequired: '1.018 tMON',
    recommended: '2.036 tMON',
    ideal: '10.0 tMON',
    actualCostPerUse: '0.208 tMON' // 0.2支付 + 0.008Gas
  };
}

main()
  .then((result) => {
    console.log('\n🎯 核心结论:');
    console.log(`✅ 钱包最少需要保留 ${result.minimumRequired} 才能通过校验`);
    console.log(`✅ 建议保留 ${result.recommended} 以确保稳定使用`);
    console.log(`✅ 每次实际花费仅约 ${result.actualCostPerUse}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('分析失败:', error);
    process.exit(1);
  });
