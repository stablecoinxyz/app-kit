import { Address, PublicClient, WalletClient, parseEther, http, LocalAccount } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { entryPoint07Address, createPaymasterClient, createBundlerClient } from 'viem/account-abstraction';
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

  constructor(config: SbcAppKitConfig) {
    this.validateConfig(config);
    this.config = config;
    
    // Initialize clients
    this.publicClient = createSbcPublicClient(config.chain, config.rpcUrl);
    this.walletClient = createSbcWalletClient(config.chain, config.privateKey, config.rpcUrl);
    
    // Validate that wallet client has an account attached
    if (!this.walletClient.account) {
      throw new Error('No account attached to wallet client');
    }
    
    // Build Account Abstraction API URL
    this.aaProxyUrl = buildAaProxyUrl(
      config.chain,
      config.apiKey,
      config.staging,
      config.paymasterUrl
    );
  }

  /**
   * Initialize the SimpleAccount client using SBC's infrastructure
   */
  private async initializeSmartAccountClient() {
    if (this.smartAccountClient) {
      return this.smartAccountClient;
    }

    // Ensure wallet has account and it's a local account
    if (!this.walletClient.account) {
      throw new Error('No account attached to wallet client');
    }

    // Create Kernel account following SBC documentation
    const kernelAccount = await toKernelSmartAccount({
      client: this.publicClient,
      owners: [this.walletClient.account as LocalAccount],
      entryPoint: {
        address: entryPoint07Address,
        version: "0.7",
      },
      version: "0.3.1" // Using latest Kernel version as per SBC docs
    });

    // Create paymaster client
    const paymaster = createPaymasterClient({
      transport: http(this.aaProxyUrl),
    });

    // Create smart account client with SBC's bundler and paymaster following the pattern
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
            maxPriorityFeePerGas: gasPrice * BigInt(2),
          };
        },
      },
    });

    return this.smartAccountClient;
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
      value: params.value ? parseEther(params.value) : 0n
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
    const supportedChains: Chain[] = [base, baseSepolia];
    const supportedChainIds = supportedChains.map(chain => chain.id);
    if (!supportedChainIds.includes(config.chain.id)) {
      const supportedNames = supportedChains.map(chain => chain.name).join(', ');
      throw new Error(`Unsupported chain: ${config.chain.name}. Supported chains: ${supportedNames}`);
    }
  }

  /**
   * Send a user operation (gasless transaction)
   */
  async sendUserOperation(params: SendUserOperationParams): Promise<UserOperationResult> {
    try {
      const smartAccountClient = await this.initializeSmartAccountClient();
      
      // Convert params to calls array and validate
      const calls = this.normalizeToCalls(params);
      
      // Send user operation through permissionless with SBC's bundler and paymaster
      const userOpHash = await smartAccountClient.sendUserOperation({ calls });

      // Wait for the transaction to be mined
      const receipt = await smartAccountClient.waitForUserOperationReceipt({
        hash: userOpHash
      });
      
      return {
        userOperationHash: userOpHash,
        transactionHash: receipt.receipt.transactionHash,
        blockNumber: receipt.receipt.blockNumber.toString(),
        gasUsed: receipt.receipt.gasUsed.toString()
      };

    } catch (error) {
      const message = parseUserOperationError(error);
      throw new Error(`Failed to send user operation: ${message}`);
    }
  }

  /**
   * Get Kernel smart account information
   */
  async getAccount(): Promise<AccountInfo> {
    try {
      const smartAccountClient = await this.initializeSmartAccountClient();
      
      if (!smartAccountClient.account) {
        throw new Error('Smart account not initialized');
      }
      
      const address = smartAccountClient.account.address;
      
      // Check if account is deployed by looking at bytecode
      const bytecode = await this.publicClient.getBytecode({ address });
      const isDeployed = !!bytecode && bytecode !== '0x';
      
      // Get nonce using standard ERC-4337 method
      let nonce = 0;
      if (isDeployed) {
        try {
          const nonceResult = await smartAccountClient.account.getNonce();
          nonce = Number(nonceResult);
        } catch (error) {
          // Silently fallback to 0 if nonce retrieval fails
        }
      }

      return {
        address,
        isDeployed,
        nonce
      };

    } catch (error) {
      const message = formatError(error);
      throw new Error(`Failed to get account info: ${message}`);
    }
  }

  /**
   * Estimate gas costs for a user operation using SBC's bundler
   */
  async estimateUserOperation(params: SendUserOperationParams): Promise<UserOperationEstimate> {
    try {
      const smartAccountClient = await this.initializeSmartAccountClient();
      
      if (!smartAccountClient.account) {
        throw new Error('Smart account not initialized');
      }
      
      // Convert params to calls array and validate
      const calls = this.normalizeToCalls(params);
      
      if (calls.length === 0) {
        throw new Error('No calls to estimate');
      }

      // Use prepareUserOperation for more accurate gas estimation
      const userOperation = await smartAccountClient.prepareUserOperation({
        account: smartAccountClient.account,
        calls,
      });

      // Get current block for base fee calculation
      const block = await this.publicClient.getBlock();

      // Calculate effective gas price (using min like your sample)
      const gasPrice = userOperation.maxFeePerGas < (userOperation.maxPriorityFeePerGas + (block.baseFeePerGas ?? 0n))
        ? userOperation.maxFeePerGas
        : userOperation.maxPriorityFeePerGas + (block.baseFeePerGas ?? 0n);

      // Calculate total expected gas used (note: paymaster gas fields may not exist in this version)
      const totalGasUsed = 
        BigInt(userOperation.preVerificationGas) +
        BigInt(userOperation.callGasLimit) +
        BigInt(userOperation.verificationGasLimit);

      // Add 10% buffer for gas cost estimation
      const feeBuffer = 10n;
      const totalGasCost = (totalGasUsed * gasPrice * (100n + feeBuffer)) / 100n;
      
      return {
        preVerificationGas: userOperation.preVerificationGas.toString(),
        verificationGasLimit: userOperation.verificationGasLimit.toString(),
        callGasLimit: userOperation.callGasLimit.toString(),
        maxFeePerGas: userOperation.maxFeePerGas.toString(),
        maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas.toString(),
        totalGasUsed: totalGasUsed.toString(),
        totalGasCost: totalGasCost.toString(),
        // These fields may not exist in current permissionless version
        paymasterVerificationGasLimit: undefined,
        paymasterPostOpGasLimit: undefined
      };

    } catch (error) {
      const message = parseUserOperationError(error);
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
