// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title WiFiPaymentContract
 * @notice WiFi认证支付合约 - 固定扣费0.01 tMON
 * @dev 适用于 Monad 测试网的 DePIN WiFi 认证场景
 */
contract WiFiPaymentContract {
    address public owner;
    uint256 public constant PAYMENT_FEE = 0.01 ether; // 固定支付费用 0.01 tMON
    uint256 public totalPayments;
    uint256 public totalUsers;
    
    // 事件定义
    event PaymentMade(
        address indexed user, 
        uint256 paymentAmount,
        uint256 timestamp
    );
    
    event OwnershipTransferred(
        address indexed previousOwner, 
        address indexed newOwner
    );
    
    // 用户支付记录
    struct PaymentRecord {
        uint256 paymentAmount;
        uint256 timestamp;
        bool isValid;
    }
    
    mapping(address => PaymentRecord[]) public userPayments;
    mapping(address => uint256) public userTotalPaid;
    mapping(address => bool) public hasUsedService;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @notice 用户支付固定费用获得WiFi访问权限
     * @dev 核心支付函数，用户支付0.01 tMON获得服务
     */
    function payForWiFi() external payable {
        require(msg.value >= PAYMENT_FEE, "Insufficient payment amount");
        
        uint256 paidAmount = msg.value;
        
        // 记录支付信息
        userPayments[msg.sender].push(PaymentRecord({
            paymentAmount: paidAmount,
            timestamp: block.timestamp,
            isValid: true
        }));
        
        // 更新统计数据
        userTotalPaid[msg.sender] += paidAmount;
        totalPayments += paidAmount;
        
        // 如果是新用户，增加用户计数
        if (!hasUsedService[msg.sender]) {
            hasUsedService[msg.sender] = true;
            totalUsers++;
        }
        
        // 如果用户支付超过0.01 tMON，返还多余部分
        if (paidAmount > PAYMENT_FEE) {
            uint256 refundAmount = paidAmount - PAYMENT_FEE;
            payable(msg.sender).transfer(refundAmount);
        }
        
        emit PaymentMade(msg.sender, PAYMENT_FEE, block.timestamp);
    }
    
    /**
     * @notice 检查用户是否有有效的支付记录
     * @param user 用户地址
     * @return isValid 是否有有效支付
     * @return lastPaymentTime 最后支付时间
     */
    function checkPaymentStatus(address user) 
        external 
        view 
        returns (bool isValid, uint256 lastPaymentTime) 
    {
        PaymentRecord[] memory payments = userPayments[user];
        if (payments.length == 0) {
            return (false, 0);
        }
        
        PaymentRecord memory lastPayment = payments[payments.length - 1];
        
        // 支付有效期为1小时（3600秒）
        bool isCurrentlyValid = lastPayment.isValid && 
                               (block.timestamp - lastPayment.timestamp) <= 3600;
        
        return (isCurrentlyValid, lastPayment.timestamp);
    }
    
    /**
     * @notice 获取用户支付历史
     * @param user 用户地址
     * @return PaymentRecord[] 支付记录数组
     */
    function getUserPaymentHistory(address user) 
        external 
        view 
        returns (PaymentRecord[] memory) 
    {
        return userPayments[user];
    }
    
    /**
     * @notice 获取用户支付统计
     * @param user 用户地址
     * @return totalPaid 总支付金额
     * @return paymentCount 支付次数
     * @return hasUsed 是否使用过服务
     */
    function getUserStats(address user) 
        external 
        view 
        returns (uint256 totalPaid, uint256 paymentCount, bool hasUsed) 
    {
        return (
            userTotalPaid[user],
            userPayments[user].length,
            hasUsedService[user]
        );
    }
    
    /**
     * @notice 获取合约统计信息
     * @return contractBalance 合约余额
     * @return totalPayments_ 总支付金额
     * @return totalUsers_ 总用户数
     * @return paymentFee 单次支付费用
     */
    function getContractStats() 
        external 
        view 
        returns (
            uint256 contractBalance,
            uint256 totalPayments_,
            uint256 totalUsers_,
            uint256 paymentFee
        ) 
    {
        return (
            address(this).balance,
            totalPayments,
            totalUsers,
            PAYMENT_FEE
        );
    }
    
    /**
     * @notice 获取支付费用
     * @return 固定支付费用
     */
    function getPaymentFee() external pure returns (uint256) {
        return PAYMENT_FEE;
    }
    
    /**
     * @notice 提取合约收益（仅限所有者）
     * @param amount 提取金额
     */
    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient contract balance");
        payable(owner).transfer(amount);
    }
    
    /**
     * @notice 紧急提取所有余额（仅限所有者）
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner).transfer(balance);
    }
    
    /**
     * @notice 转移合约所有权
     * @param newOwner 新所有者地址
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    /**
     * @notice 接收以太币的函数
     */
    receive() external payable {
        // 直接调用支付函数
        this.payForWiFi();
    }
    
    /**
     * @notice Fallback 函数
     */
    fallback() external payable {
        revert("Function not found");
    }
}