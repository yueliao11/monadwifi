const fs = require('fs');
const path = require('path');

const CONTRACT_ADDRESS = '0x4b2f2583B3730820D0A8F2076e3a90Af26872B99';

async function main() {
  console.log('🔧 更新前端配置...\n');

  try {
    // 读取编译后的合约ABI
    const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'PayAndReturnContract.sol', 'PayAndReturnContract.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    console.log('📋 合约信息:');
    console.log('   - 合约名称:', artifact.contractName);
    console.log('   - 部署地址:', CONTRACT_ADDRESS);
    
    // 提取需要的函数签名
    const requiredFunctions = [
      'payAndReturn() external payable',
      'getUserStats(address user) external view returns (uint256, uint256, uint256)',
      'getContractStats() external view returns (uint256, uint256, uint256, uint256)',
      'owner() external view returns (address)',
      'returnPercentage() external view returns (uint256)',
      'deposit() external payable',
      'withdraw(uint256 amount) external',
      'emergencyWithdraw() external'
    ];

    // 提取需要的事件签名
    const requiredEvents = [
      'event PaymentMade(address indexed user, uint256 paidAmount, uint256 returnedAmount, uint256 timestamp)',
      'event ReturnMade(address indexed user, uint256 amount, uint256 timestamp)',
      'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)'
    ];

    // 生成前端配置代码
    const frontendConfig = `// 合约配置 - 自动生成，请勿手动修改
const CONTRACT_CONFIG = {
  // Monad测试网已部署合约地址
  address: '${CONTRACT_ADDRESS}',
  abi: [
    // 核心函数
    'function payAndReturn() external payable',
    'function getUserStats(address user) external view returns (uint256, uint256, uint256)',
    'function getContractStats() external view returns (uint256, uint256, uint256, uint256)',
    'function owner() external view returns (address)',
    'function returnPercentage() external view returns (uint256)',
    
    // 管理函数
    'function deposit() external payable',
    'function withdraw(uint256 amount) external',
    'function emergencyWithdraw() external',
    
    // 事件
    'event PaymentMade(address indexed user, uint256 paidAmount, uint256 returnedAmount, uint256 timestamp)',
    'event ReturnMade(address indexed user, uint256 amount, uint256 timestamp)',
    'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)'
  ]
}`;

    // 读取当前的usePayment.ts文件
    const usePaymentPath = path.join(__dirname, '..', 'src', 'composables', 'usePayment.ts');
    let usePaymentContent = fs.readFileSync(usePaymentPath, 'utf8');

    // 替换合约配置部分
    const configStart = '// 合约配置';
    const configEnd = '}';
    
    const startIndex = usePaymentContent.indexOf(configStart);
    if (startIndex === -1) {
      console.log('❌ 未找到合约配置部分');
      return;
    }

    // 找到配置结束位置
    let braceCount = 0;
    let endIndex = startIndex;
    let foundFirstBrace = false;
    
    for (let i = startIndex; i < usePaymentContent.length; i++) {
      if (usePaymentContent[i] === '{') {
        foundFirstBrace = true;
        braceCount++;
      } else if (usePaymentContent[i] === '}') {
        braceCount--;
        if (foundFirstBrace && braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }

    // 替换配置
    const beforeConfig = usePaymentContent.substring(0, startIndex);
    const afterConfig = usePaymentContent.substring(endIndex);
    const newContent = beforeConfig + frontendConfig + afterConfig;

    // 写入更新的文件
    fs.writeFileSync(usePaymentPath, newContent);
    console.log('✅ 前端配置已更新');

    // 创建环境变量文件
    const envContent = `# Monad WiFi Simple 配置
# 合约部署信息
VITE_CONTRACT_ADDRESS=${CONTRACT_ADDRESS}
VITE_CHAIN_ID=10143
VITE_RPC_URL=https://testnet-rpc.monad.xyz
VITE_EXPLORER_URL=https://testnet-explorer.monad.xyz

# 可选的后端服务
VITE_BACKEND_URL=https://your.backend/authorize

# 开发模式设置
VITE_DEV_MODE=true
VITE_MOCK_PAYMENT=false
`;

    const envPath = path.join(__dirname, '..', '.env.local');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ 环境变量配置已创建');

    // 输出验证信息
    console.log('\n📊 配置验证:');
    console.log('   - 合约地址:', CONTRACT_ADDRESS);
    console.log('   - 网络: Monad Testnet (10143)');
    console.log('   - ABI函数数量:', requiredFunctions.length);
    console.log('   - ABI事件数量:', requiredEvents.length);

    // 输出前端集成示例
    console.log('\n🔧 前端集成验证:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('// 在前端代码中验证配置');
    console.log('import { CONTRACT_CONFIG } from "./usePayment";');
    console.log('');
    console.log('console.log("合约地址:", CONTRACT_CONFIG.address);');
    console.log('console.log("ABI:", CONTRACT_CONFIG.abi);');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n📋 下一步操作:');
    console.log('1. npm run dev - 启动前端应用');
    console.log('2. 连接 MetaMask 到 Monad 测试网');
    console.log('3. 测试钱包连接功能');
    console.log('4. 获取测试代币后测试支付功能');

    console.log('\n✅ 前端配置更新完成！');

  } catch (error) {
    console.error('❌ 更新配置失败:', error.message);
    console.log('\n🛠️  故障排除:');
    console.log('1. 确保合约已正确编译');
    console.log('2. 检查文件路径是否正确');
    console.log('3. 验证合约地址是否有效');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });