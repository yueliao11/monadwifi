// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PayAndReturnContract
 * @notice WiFi认证支付合约 - 用户支付后自动返还部分资金
 * @dev 适用于 Monad 测试网的 DePIN WiFi 认证场景
 */
contract PayAndReturnContract {
    address public owner;
    uint256 public returnPercentage; // 返还百分比 (1-100)
    uint256 public totalPayments;
    uint256 public totalReturned;
    
    // 事件定义
    event PaymentMade(
        address indexed user, 
        uint256 paidAmount, 
        uint256 returnedAmount,
        uint256 timestamp
    );
    
    event ReturnMade(
        address indexed user, 
        uint256 amount,
        uint256 timestamp
    );
    
    event OwnershipTransferred(
        address indexed previousOwner, 
        address indexed newOwner
    );
    
    // 用户支付记录
    struct PaymentRecord {
        uint256 paidAmount;
        uint256 returnedAmount;
        uint256 timestamp;
        bool isReturned;
    }
    
    mapping(address => PaymentRecord[]) public userPayments;
    mapping(address => uint256) public userTotalPaid;
    mapping(address => uint256) public userTotalReturned;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }
    
    modifier validPercentage(uint256 _percentage) {
        require(_percentage > 0 && _percentage <= 100, "Invalid percentage");
        _;
    }
    
    constructor(uint256 _returnPercentage) validPercentage(_returnPercentage) {
        owner = msg.sender;
        returnPercentage = _returnPercentage;
    }
    
    /**
     * @notice 用户支付并自动返还部分资金
     * @dev 核心支付函数，用户支付后立即返还指定百分比的资金
     */
    function payAndReturn() external payable {
        require(msg.value > 0, "Payment amount must be greater than 0");
        
        uint256 paidAmount = msg.value;
        uint256 returnAmount = (paidAmount * returnPercentage) / 100;
        
        // 检查合约余额是否足够返还
        uint256 contractBalance = address(this).balance - paidAmount;
        if (contractBalance < returnAmount) {
            returnAmount = contractBalance;
        }
        
        // 记录支付信息
        userPayments[msg.sender].push(PaymentRecord({
            paidAmount: paidAmount,
            returnedAmount: returnAmount,
            timestamp: block.timestamp,
            isReturned: true
        }));
        
        // 更新统计数据
        userTotalPaid[msg.sender] += paidAmount;
        userTotalReturned[msg.sender] += returnAmount;
        totalPayments += paidAmount;
        totalReturned += returnAmount;
        
        // 发送返还资金
        if (returnAmount > 0) {
            payable(msg.sender).transfer(returnAmount);
            emit ReturnMade(msg.sender, returnAmount, block.timestamp);
        }
        
        emit PaymentMade(msg.sender, paidAmount, returnAmount, block.timestamp);
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
     * @return totalReturnedAmount 总返还金额
     * @return paymentCount 支付次数
     */
    function getUserStats(address user) 
        external 
        view 
        returns (uint256 totalPaid, uint256 totalReturnedAmount, uint256 paymentCount) 
    {
        return (
            userTotalPaid[user],
            userTotalReturned[user],
            userPayments[user].length
        );
    }
    
    /**
     * @notice 获取合约统计信息
     * @return contractBalance 合约余额
     * @return totalPayments_ 总支付金额
     * @return totalReturned_ 总返还金额
     * @return currentReturnPercentage 当前返还百分比
     */
    function getContractStats() 
        external 
        view 
        returns (
            uint256 contractBalance,
            uint256 totalPayments_,
            uint256 totalReturned_,
            uint256 currentReturnPercentage
        ) 
    {
        return (
            address(this).balance,
            totalPayments,
            totalReturned,
            returnPercentage
        );
    }
    
    /**
     * @notice 设置返还百分比
     * @param _newPercentage 新的返还百分比 (1-100)
     */
    function setReturnPercentage(uint256 _newPercentage) 
        external 
        onlyOwner 
        validPercentage(_newPercentage) 
    {
        returnPercentage = _newPercentage;
    }
    
    /**
     * @notice 向合约充值，用于支持返还功能
     */
    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
    }
    
    /**
     * @notice 提取合约余额（仅限所有者）
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
        // 允许合约接收直接转账，用于充值
    }
    
    /**
     * @notice Fallback 函数
     */
    fallback() external payable {
        revert("Function not found");
    }
}