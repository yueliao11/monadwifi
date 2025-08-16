const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 简单合约检查...\n');
  
  const contractAddress = '0x4b2f2583B3730820D0A8F2076e3a90Af26872B99';
  
  try {
    // 检查合约余额
    const balance = await ethers.provider.getBalance(contractAddress);
    console.log('合约地址:', contractAddress);
    console.log('合约余额:', ethers.formatEther(balance), 'tMON');
    
    // 检查网络
    const network = await ethers.provider.getNetwork();
    console.log('网络 Chain ID:', network.chainId.toString());
    
    // 检查当前账户
    const [signer] = await ethers.getSigners();
    const userBalance = await ethers.provider.getBalance(signer.address);
    console.log('当前账户:', signer.address);
    console.log('账户余额:', ethers.formatEther(userBalance), 'tMON');
    
    // 检查合约代码
    const code = await ethers.provider.getCode(contractAddress);
    console.log('合约是否部署:', code !== '0x' ? '✅ 是' : '❌ 否');
    console.log('合约代码长度:', code.length);
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

main().catch(console.error);
