import { Address, PublicClient, WalletClient, http, LocalAccount } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { entryPoint07Address, createPaymasterClient } from 'viem/account-abstraction';
import { toKernelSmartAccount } from 'permissionless/accounts';
import { createSmartAccountClient, SmartAccountClient } from 'permissionless';
import {
  SbcAppKitConfig,
  UserOperationParams,
  SendUserOperationParams,
  CallParams,
  UserOperationResult,
  UserOperationEstimate,
  AccountInfo
} from './types';
import { Chain } from 'viem';
import {
  validateApiKey,
  createSbcPublicClient,
  createSbcWalletClient,
  buildAaProxyUrl,
  formatError,
  parseUserOperationError,
  getChainConfig
} from './utils';

export class SbcAppKit {
  private config: SbcAppKitConfig;
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  private smartAccountClient: SmartAccountClient | null = null;
  private aaProxyUrl: string;
  private debug: boolean;
  private sessionId: string;
  private logger?: (level: string, message: string, metadata: Record<string, any>) => void | Promise<void>;

  constructor(config: SbcAppKitConfig) {
    this.validateConfig(config);
    this.config = config;
    this.debug = config.debug ?? false;
    this.sessionId = this.generateSessionId();
    
    // Initialize logger based on configuration
    this.initializeLogger();
    
    // Initialize clients
    this.publicClient = createSbcPublicClient(config.chain, config.rpcUrl);
    
    // Use provided wallet client or create one from private key
    if (config.walletClient) {
      this.walletClient = config.walletClient;
      
      // Validate that the provided wallet client has an account attached
      if (!this.walletClient.account) {
        throw new Error('Provided wallet client must have an account attached');
      }
      
      // Validate that the wallet client is on the correct chain
      if (this.walletClient.chain?.id !== config.chain.id) {
        throw new Error(`Wallet client chain (${this.walletClient.chain?.id}) does not match config chain (${config.chain.id})`);
      }
    } else {
      this.walletClient = createSbcWalletClient(config.chain, config.privateKey, config.rpcUrl);
      
      // Validate that wallet client has an account attached
      if (!this.walletClient.account) {
        throw new Error('No account attached to wallet client');
      }
    }
    
    // Build Account Abstraction API URL
    this.aaProxyUrl = buildAaProxyUrl({
      chain: config.chain,
      apiKey: config.apiKey,
      staging: config.staging
    });

    // Log initialization
    this.logInfo('sdk_initialized', {
      chain: config.chain.name,
      chainId: config.chain.id,
      owner: this.walletClient.account.address,
      hasCustomRpc: !!config.rpcUrl,
      isStaging: !!config.staging,
      loggingEnabled: !!config.logging?.enabled,
      logLevel: config.logging?.level || 'none'
    });
  }

  /**
   * Generate a unique session ID for tracking operations
   */
  private generateSessionId(): string {
    return `sbc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Initialize the logger based on configuration
   */
  private initializeLogger(): void {
    if (this.config.logging?.enabled && this.config.logging.logger) {
      this.logger = this.config.logging.logger;
    }
  }

  /**
   * Enhanced logging system for both debug and production
   */
  private log(level: 'error' | 'warn' | 'info' | 'debug', event: string, metadata: Record<string, any> = {}): void {
    const baseMetadata = {
      sessionId: this.sessionId,
      chainId: this.config.chain.id,
      chainName: this.config.chain.name,
      timestamp: new Date().toISOString(),
      event,
      ...metadata,
      ...this.config.logging?.context
    };

    // Debug logging (development)
    if (this.debug) {
      console.log(`[SBC SDK] ${event}`, JSON.stringify(baseMetadata, null, 2));
    }

    // Production logging
    if (this.config.logging?.enabled && this.shouldLog(level)) {
      // Apply sampling for performance logs
      if (event.includes('performance') && !this.shouldSample()) {
        return;
      }

      // Remove sensitive data for production unless explicitly enabled
      const logMetadata = this.config.logging.includeSensitive 
        ? baseMetadata 
        : this.sanitizeMetadata(baseMetadata);

      this.logger?.(level, event, logMetadata);
    }
  }

  // Consolidated logging methods using arrow functions for better performance
  private readonly logError = (event: string, metadata: Record<string, any> = {}) => this.log('error', event, metadata);
  private readonly logWarn = (event: string, metadata: Record<string, any> = {}) => this.log('warn', event, metadata);
  private readonly logInfo = (event: string, metadata: Record<string, any> = {}) => this.log('info', event, metadata);
  private readonly logDebug = (event: string, metadata: Record<string, any> = {}) => this.log('debug', event, metadata);

  /**
   * Check if we should log based on configured level
   */
  private shouldLog(level: string): boolean {
    if (!this.config.logging?.level) return true;
    
    const levels = ['error', 'warn', 'info', 'debug'];
    const configLevel = levels.indexOf(this.config.logging.level);
    const currentLevel = levels.indexOf(level);
    
    return currentLevel <= configLevel;
  }

  /**
   * Apply sampling rate for performance logs
   */
  private shouldSample(): boolean {
    const rate = this.config.logging?.samplingRate ?? 1.0;
    return Math.random() < rate;
  }

  /**
   * Remove sensitive data from logs for production
   */
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized = { ...metadata };
    
    // Remove or mask sensitive fields
    const sensitiveFields = ['privateKey', 'apiKey', 'signature'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    // Mask addresses (keep first 6 and last 4 characters)
    if (sanitized.owner && typeof sanitized.owner === 'string') {
      sanitized.owner = this.maskAddress(sanitized.owner);
    }
    
    return sanitized;
  }

  /**
   * Mask blockchain addresses for privacy
   */
  private maskAddress(address: string): string {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Initialize the Smart Account client using SBC's infrastructure. 
   * Currently using Kernel Smart Account from ZeroDev.
   */
  private async initializeSmartAccountClient(): Promise<SmartAccountClient> {
    if (this.smartAccountClient) {
      return this.smartAccountClient;
    }

    if (!this.walletClient.account) {
      throw new Error('No account attached to wallet client');
    }

    this.logInfo('walletClient', this.walletClient);

    try {
      this.logInfo('initializing_smart_account_client');

      // Create Kernel account following SBC documentation
      this.logInfo('creating_kernel_account');
      const kernelAccount = await toKernelSmartAccount({
        client: this.publicClient,
        owners: [this.walletClient.account as LocalAccount],
        entryPoint: {
          address: entryPoint07Address,
          version: "0.7",
        },
        version: "0.3.1"
      });

      // Create paymaster and smart account clients
      this.logInfo('creating_paymaster_client', { aaProxyUrl: this.aaProxyUrl });
      const paymaster = createPaymasterClient({
        transport: http(this.aaProxyUrl),
      });

      this.logInfo('creating_smart_account_client');
      this.smartAccountClient = createSmartAccountClient({
        account: kernelAccount,
        chain: this.config.chain,
        bundlerTransport: http(this.aaProxyUrl),
        paymaster,
        userOperation: {
          estimateFeesPerGas: async () => {
            const gasPrice = await this.publicClient.getGasPrice();
            return {
              maxFeePerGas: gasPrice,
              maxPriorityFeePerGas: gasPrice * 2n,
            };
          },
        },
      });

      this.logInfo('smart_account_client_initialized', {
        accountAddress: kernelAccount.address
      });

      return this.smartAccountClient;
      
    } catch (error) {
      const message = formatError(error);
      this.logError('smart_account_initialization_failed', { error: message });
      throw new Error(`Failed to initialize smart account: ${message}`);
    }
  }

  /**
   * Type guard to check if params contain a calls array
   */
  private isBatchOperation(params: SendUserOperationParams): params is { calls: CallParams[] } {
    return 'calls' in params;
  }

  /**
   * Convert single operation params to calls array format
   */
  private toCallsArray(params: UserOperationParams): CallParams[] {
    return [{
      to: params.to,
      data: params.data,
      value: params.value ? BigInt(params.value) : 0n
    }];
  }

  /**
   * Validate that calls array is not empty
   */
  private validateCalls(calls: CallParams[]): void {
    if (!Array.isArray(calls) || calls.length === 0) {
      throw new Error('Operations array cannot be empty');
    }
  }

  /**
   * Normalize user operation parameters to calls array format
   */
  private normalizeToCalls(params: SendUserOperationParams): CallParams[] {
    const calls = this.isBatchOperation(params) 
      ? params.calls 
      : this.toCallsArray(params);
    
    this.validateCalls(calls);
    return calls;
  }

  /**
   * Validate the configuration
   */
  private validateConfig(config: SbcAppKitConfig): void {
    if (!config.apiKey || !validateApiKey(config.apiKey)) {
      throw new Error('Invalid API key. API key must start with "sbc-"');
    }

    if (!config.chain) {
      throw new Error('Chain is required');
    }

    // Validate chain is supported
    getChainConfig(config.chain);

    // Validate wallet configuration
    if (config.walletClient && config.privateKey) {
      throw new Error('Cannot specify both walletClient and privateKey. Use walletClient for production wallet integration or privateKey for backend operations.');
    }

    if (!config.walletClient && !config.privateKey) {
      // This is fine - we'll generate a random private key
    }
  }

  /**
   * Send a user operation (gasless transaction)
   */
  async sendUserOperation(params: SendUserOperationParams): Promise<UserOperationResult> {
    try {
      this.logInfo('sending_user_operation', { isBatch: this.isBatchOperation(params) });
      
      const smartAccountClient = await this.initializeSmartAccountClient();
      
      // Convert params to calls array and validate
      const calls = this.normalizeToCalls(params);
      this.logInfo('normalized_calls', { callsCount: calls.length });
      
      // Send user operation through permissionless with SBC's bundler and paymaster
      const userOpHash = await smartAccountClient.sendUserOperation({ calls });
      this.logInfo('user_operation_sent', { userOpHash });

      // Wait for the transaction to be mined
      this.logInfo('waiting_for_receipt');
      const receipt = await smartAccountClient.waitForUserOperationReceipt({
        hash: userOpHash
      });
      
      const result = {
        userOperationHash: userOpHash,
        transactionHash: receipt.receipt.transactionHash,
        blockNumber: receipt.receipt.blockNumber.toString(),
        gasUsed: receipt.receipt.gasUsed.toString()
      };
      
      this.logInfo('user_operation_confirmed', result);
      return result;

    } catch (error) {
      const message = parseUserOperationError(error);
      this.logError('user_operation_failed', { error: message });
      throw new Error(`Failed to send user operation: ${message}`);
    }
  }

  /**
   * Get Kernel smart account information
   */
  async getAccount(): Promise<AccountInfo> {
    try {
      this.logInfo('getting_account_info');
      
      const smartAccountClient = await this.initializeSmartAccountClient();
      const { account } = smartAccountClient;
      
      if (!account) {
        throw new Error('Smart account not initialized');
      }
      
      const { address } = account;
      this.logInfo('smart_account_address', { address });
      
      // Parallel execution for better performance
      const [bytecode, balance] = await Promise.all([
        this.publicClient.getBytecode({ address }),
        this.publicClient.getBalance({ address })
      ]);

      const isDeployed = !!bytecode && bytecode !== '0x';
      this.logInfo('account_deployment_status', { isDeployed, bytecodeLength: bytecode?.length });
      
      // Get nonce only if deployed to avoid unnecessary calls
      let nonce = 0;
      if (isDeployed) {
        try {
          nonce = Number(await account.getNonce());
          this.logInfo('account_nonce_retrieved', { nonce });
        } catch (error) {
          this.logInfo('failed_to_get_nonce_defaulting_to_0', { error: formatError(error) });
        }
      }

      this.logInfo('account_balance_retrieved', { balance: balance.toString() });

      const result = {
        address,
        isDeployed,
        nonce,
        balance: balance.toString()
      };
      
      this.logInfo('account_info_retrieved', result);
      return result;

    } catch (error) {
      const message = formatError(error);
      this.logError('failed_to_get_account_info', { error: message });
      throw new Error(`Failed to get account info: ${message}`);
    }
  }

  /**
   * Calculate total gas cost with buffer
   */
  private calculateGasCost(gasEstimate: any, gasPrice: bigint): { totalGasUsed: bigint; totalGasCost: bigint } {
    const totalGasUsed = 
      gasEstimate.preVerificationGas + 
      gasEstimate.verificationGasLimit + 
      gasEstimate.callGasLimit + 
      (gasEstimate.paymasterVerificationGasLimit || 0n) + 
      (gasEstimate.paymasterPostOpGasLimit || 0n);

    // Add 10% buffer for gas cost estimation
    const totalGasCost = (totalGasUsed * gasPrice * 110n) / 100n;
    
    return { totalGasUsed, totalGasCost };
  }

  /**
   * Estimate gas costs for a user operation using SBC's bundler
   */
  async estimateUserOperation(params: SendUserOperationParams): Promise<UserOperationEstimate> {
    try {
      this.logInfo('estimating_user_operation_gas', { isBatch: this.isBatchOperation(params) });
      
      const smartAccountClient = await this.initializeSmartAccountClient();
      
      if (!smartAccountClient.account) {
        throw new Error('Smart account not initialized');
      }
      
      // Convert params to calls array and validate
      const calls = this.normalizeToCalls(params);
      this.logInfo('prepared_calls_for_estimation', { callsCount: calls.length });

      // First prepare the user operation to get the proper structure with all required fields
      this.logInfo('preparing_user_operation_for_estimation');
      const preparedUserOp = await smartAccountClient.prepareUserOperation({
        account: smartAccountClient.account,
        calls,
      });

      this.logInfo('prepared_user_operation_details', {
        sender: preparedUserOp.sender,
        nonce: preparedUserOp.nonce.toString(),
        hasPaymasterAndData: !!preparedUserOp.paymasterAndData && preparedUserOp.paymasterAndData !== '0x',
        paymasterAndDataLength: preparedUserOp.paymasterAndData?.length || 0
      });

      // Now use the prepared user operation for gas estimation
      this.logInfo('estimating_gas_with_prepared_operation');
      const gasEstimate = await smartAccountClient.estimateUserOperationGas({
        account: smartAccountClient.account,
        calls,
        maxFeePerGas: preparedUserOp.maxFeePerGas,
        maxPriorityFeePerGas: preparedUserOp.maxPriorityFeePerGas,
      });

      this.logInfo('permissionless_gas_estimation_success', {
        preVerificationGas: gasEstimate.preVerificationGas.toString(),
        verificationGasLimit: gasEstimate.verificationGasLimit.toString(),
        callGasLimit: gasEstimate.callGasLimit.toString(),
        paymasterVerificationGasLimit: gasEstimate.paymasterVerificationGasLimit?.toString(),
        paymasterPostOpGasLimit: gasEstimate.paymasterPostOpGasLimit?.toString()
      });

      // Get account balance and calculate gas costs
      const accountBalance = await this.publicClient.getBalance({ 
        address: smartAccountClient.account.address 
      });
      const { totalGasUsed, totalGasCost } = this.calculateGasCost(gasEstimate, preparedUserOp.maxFeePerGas);

      this.logInfo('account_balance_during_estimation', { 
        balance: accountBalance.toString(),
        balanceInEth: (Number(accountBalance) / 1e18).toFixed(6)
      });
      
      const estimateResult = {
        preVerificationGas: gasEstimate.preVerificationGas.toString(),
        verificationGasLimit: gasEstimate.verificationGasLimit.toString(),
        callGasLimit: gasEstimate.callGasLimit.toString(),
        maxFeePerGas: preparedUserOp.maxFeePerGas.toString(),
        maxPriorityFeePerGas: preparedUserOp.maxPriorityFeePerGas.toString(),
        totalGasUsed: totalGasUsed.toString(),
        totalGasCost: totalGasCost.toString(),
        paymasterVerificationGasLimit: gasEstimate.paymasterVerificationGasLimit?.toString(),
        paymasterPostOpGasLimit: gasEstimate.paymasterPostOpGasLimit?.toString()
      };
      
      this.logInfo('gas_estimation_completed', { 
        totalGasUsed: estimateResult.totalGasUsed, 
        totalGasCost: estimateResult.totalGasCost,
        gasPrice: preparedUserOp.maxFeePerGas.toString(),
        paymasterWillCoverCosts: !!(gasEstimate.paymasterVerificationGasLimit || gasEstimate.paymasterPostOpGasLimit)
      });
      
      return estimateResult;

    } catch (error) {
      const message = parseUserOperationError(error);
      this.logError('gas_estimation_failed', { error: message });
      throw new Error(`Failed to estimate user operation: ${message}`);
    }
  }

  /**
   * Get the owner address (EOA that controls the smart account)
   */
  getOwnerAddress(): Address {
    if (!this.walletClient.account?.address) {
      throw new Error('No account attached to wallet client');
    }
    return this.walletClient.account.address;
  }

  /**
   * Get the chain being used
   */
  getChain(): Chain {
    return this.config.chain;
  }

  /**
   * Get chain configuration
   */
  getChainConfig() {
    return getChainConfig(this.config.chain);
  }
}
