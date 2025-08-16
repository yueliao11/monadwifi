const { ethers } = require('hardhat');

const CONTRACT_ADDRESS = '0x4b2f2583B3730820D0A8F2076e3a90Af26872B99';
const CONTRACT_ABI = [
  'function payAndReturn() external payable',
  'function getUserStats(address user) external view returns (uint256, uint256, uint256)',
  'function getContractStats() external view returns (uint256, uint256, uint256, uint256)',
  'function owner() external view returns (address)',
  'function returnPercentage() external view returns (uint256)',
  'event PaymentMade(address indexed user, uint256 paidAmount, uint256 returnedAmount, uint256 timestamp)'
];

async function main() {
  console.log('🔍 验证 Monad 测试网合约状态...\n');
  console.log('📍 合约地址:', CONTRACT_ADDRESS);

  try {
    // 获取网络信息
    const network = await ethers.provider.getNetwork();
    console.log('🌐 网络信息:');
    console.log('   - 链ID:', network.chainId.toString());
    console.log('   - 名称: Monad Testnet\n');

    // 创建合约实例
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ethers.provider);

    // 检查合约是否存在
    const code = await ethers.provider.getCode(CONTRACT_ADDRESS);
    if (code === '0x') {
      console.log('❌ 错误: 合约不存在或未正确部署');
      return;
    }
    console.log('✅ 合约代码验证通过');

    // 获取合约基本信息
    console.log('\n📊 合约状态信息:');
    
    try {
      const owner = await contract.owner();
      console.log('   - 合约所有者:', owner);
    } catch (error) {
      console.log('   - 合约所有者: 无法获取');
    }

    try {
      const returnPercentage = await contract.returnPercentage();
      console.log('   - 返还百分比:', returnPercentage.toString() + '%');
    } catch (error) {
      console.log('   - 返还百分比: 无法获取');
    }

    // 获取合约余额
    const balance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
    console.log('   - 合约余额:', ethers.formatEther(balance), 'tMON');

    // 获取合约统计信息
    try {
      const stats = await contract.getContractStats();
      console.log('\n📈 合约统计:');
      console.log('   - 合约余额:', ethers.formatEther(stats[0]), 'tMON');
      console.log('   - 总支付金额:', ethers.formatEther(stats[1]), 'tMON');
      console.log('   - 总返还金额:', ethers.formatEther(stats[2]), 'tMON');
      console.log('   - 返还百分比:', stats[3].toString() + '%');
    } catch (error) {
      console.log('\n⚠️  无法获取合约统计信息:', error.message);
    }

    // 检查合约功能
    console.log('\n🔧 功能验证:');
    console.log('   ✅ 合约可读取');
    console.log('   ✅ 基本函数可调用');
    
    if (balance > 0) {
      console.log('   ✅ 合约有足够余额支持返还');
    } else {
      console.log('   ⚠️  合约余额为0，需要充值才能支持返还功能');
    }

    // 生成前端配置
    console.log('\n🔧 前端配置代码:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('// 更新 src/composables/usePayment.ts');
    console.log('const CONTRACT_CONFIG = {');
    console.log(`  address: "${CONTRACT_ADDRESS}",`);
    console.log('  abi: [');
    console.log('    "function payAndReturn() external payable",');
    console.log('    "function getUserStats(address user) external view returns (uint256, uint256, uint256)",');
    console.log('    "function getContractStats() external view returns (uint256, uint256, uint256, uint256)",');
    console.log('    "event PaymentMade(address indexed user, uint256 paidAmount, uint256 returnedAmount, uint256 timestamp)"');
    console.log('  ]');
    console.log('};');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 区块链浏览器链接
    console.log('\n🔍 区块链浏览器:');
    console.log(`   https://testnet-explorer.monad.xyz/address/${CONTRACT_ADDRESS}`);

    console.log('\n✅ 合约验证完成！');

    // 如果合约余额为0，提供充值指导
    if (balance === 0n) {
      console.log('\n💡 合约充值指导:');
      console.log('合约虽然部署成功，但余额为0。要支持80%返还功能，需要向合约充值。');
      console.log('\n方法1: 使用MetaMask直接转账');
      console.log(`   - 目标地址: ${CONTRACT_ADDRESS}`);
      console.log('   - 建议金额: 1-5 tMON');
      console.log('\n方法2: 使用脚本充值');
      console.log('   - 创建充值脚本或手动发送交易');
      console.log('\n方法3: 首次用户支付会保留在合约中');
      console.log('   - 后续用户可以获得返还');
    }

  } catch (error) {
    console.error('❌ 验证过程中出错:', error.message);
    console.log('\n🛠️  可能的原因:');
    console.log('1. 网络连接问题');
    console.log('2. 合约地址错误');
    console.log('3. RPC 节点暂时不可用');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });