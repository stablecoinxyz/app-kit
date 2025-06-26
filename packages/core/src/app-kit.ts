import { Address, PublicClient, WalletClient, parseEther, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { entryPoint07Address, createPaymasterClient, createBundlerClient } from 'viem/account-abstraction';
import { toKernelSmartAccount } from 'permissionless/accounts';
import { createSmartAccountClient, } from 'permissionless';
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
  private smartAccountClient: any; // permissionless smart account client
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
    
    // Build AA proxy URL - this follows SBC's pattern
    this.aaProxyUrl = buildAaProxyUrl(
      config.chain,
      config.apiKey,
      config.staging,
      config.paymasterUrl
    );

    console.log(`SBC Kit initialized for ${config.chain.name} (Chain ID: ${config.chain.id}) with owner: ${this.walletClient.account?.address || 'No account attached'}`);
    console.log(`🎯 Ready to use Kernel smart accounts via SBC AA infrastructure`);
  }

  /**
   * Initialize the SimpleAccount client using SBC's infrastructure
   */
  private async initializeSmartAccountClient() {
    if (this.smartAccountClient) {
      return this.smartAccountClient;
    }

    console.log('🏗️ Initializing Kernel smart account...');

    // Create Kernel account following SBC documentation
    const kernelAccount = await toKernelSmartAccount({
      client: this.publicClient,
      owners: [this.walletClient.account as any],
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

    console.log(`✅ Kernel smart account initialized at: ${kernelAccount.address}`);
    return this.smartAccountClient;
  }

  /**
   * Convert and validate params to calls array format
   */
  private validateAndConvertToCalls(params: SendUserOperationParams): CallParams[] {
    if ('calls' in params) {
      // Validate calls array
      if (!Array.isArray(params.calls) || params.calls.length === 0) {
        throw new Error('Calls array must be non-empty');
      }
      return params.calls;
    } else {
      // Convert UserOperationParams to calls array
      return [{
        to: params.to,
        data: params.data,
        value: params.value ? parseEther(params.value) : 0n
      }];
    }
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
      console.log(`📤 Sending gasless user operation via SBC paymaster...`);

      const smartAccountClient = await this.initializeSmartAccountClient();
      
      // Convert params to calls array and validate
      const calls = this.validateAndConvertToCalls(params);
      
      // Send user operation through permissionless with SBC's bundler and paymaster
      const userOpHash = await smartAccountClient.sendUserOperation({ calls });

      console.log(`✅ User operation sent with hash: ${userOpHash}`);

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
      console.error(`Failed to send user operation: ${message}`);
      throw new Error(`Failed to send user operation: ${message}`);
    }
  }

  /**
   * Get Kernel smart account information
   */
  async getAccount(): Promise<AccountInfo> {
    try {
      const smartAccountClient = await this.initializeSmartAccountClient();
      const address = smartAccountClient.account.address;
      
      // Check if account is deployed by looking at bytecode
      const bytecode = await this.publicClient.getBytecode({ address });
      const isDeployed = !!bytecode && bytecode !== '0x';
      
      // Get nonce using standard ERC-4337 method
      let nonce = 0;
      if (isDeployed) {
        try {
          nonce = await smartAccountClient.account.getNonce();
        } catch (error) {
          console.warn('Failed to get nonce, using 0');
        }
      }

      return {
        address,
        isDeployed,
        nonce
      };

    } catch (error) {
      const message = formatError(error);
      console.error(`Failed to get account info: ${message}`);
      throw new Error(`Failed to get account info: ${message}`);
    }
  }

  /**
   * Estimate gas costs for a user operation using SBC's bundler
   */
  async estimateUserOperation(params: SendUserOperationParams): Promise<UserOperationEstimate> {
    try {
      console.log(`Estimating user operation gas costs via SBC bundler...`);

      const smartAccountClient = await this.initializeSmartAccountClient();
      
      // Convert params to calls array and validate
      const calls = this.validateAndConvertToCalls(params);
      
      if (calls.length === 0) {
        throw new Error('No calls to estimate');
      }

      // Use prepareUserOperation for more accurate gas estimation
      const userOperation = await smartAccountClient.prepareUserOperation({
        calls,
      });

      // Get current block for base fee calculation
      const block = await this.publicClient.getBlock();

      // Calculate effective gas price (using min like your sample)
      const gasPrice = userOperation.maxFeePerGas < (userOperation.maxPriorityFeePerGas + (block.baseFeePerGas ?? 0n))
        ? userOperation.maxFeePerGas
        : userOperation.maxPriorityFeePerGas + (block.baseFeePerGas ?? 0n);

      // Calculate total expected gas used (including paymaster costs)
      const totalGasUsed = 
        BigInt(userOperation.preVerificationGas) +
        BigInt(userOperation.callGasLimit) +
        BigInt(userOperation.verificationGasLimit) +
        BigInt(userOperation.paymasterPostOpGasLimit ?? 0) +
        BigInt(userOperation.paymasterVerificationGasLimit ?? 0);

      // Add 10% buffer for gas cost estimation
      const feeBuffer = 10n;
      const totalGasCost = (totalGasUsed * gasPrice * (100n + feeBuffer)) / 100n;

      console.log('✅ Gas estimation successful via SBC bundler');
      console.log(`Total gas used: ${totalGasUsed}, Gas price: ${gasPrice}, Total cost: ${totalGasCost} wei`);
      
      return {
        preVerificationGas: userOperation.preVerificationGas.toString(),
        verificationGasLimit: userOperation.verificationGasLimit.toString(),
        callGasLimit: userOperation.callGasLimit.toString(),
        maxFeePerGas: userOperation.maxFeePerGas.toString(),
        maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas.toString(),
        totalGasUsed: totalGasUsed.toString(),
        totalGasCost: totalGasCost.toString(),
        paymasterVerificationGasLimit: userOperation.paymasterVerificationGasLimit?.toString(),
        paymasterPostOpGasLimit: userOperation.paymasterPostOpGasLimit?.toString()
      };

    } catch (error) {
      const message = parseUserOperationError(error);
      console.error(`Failed to estimate user operation: ${message}`);
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
