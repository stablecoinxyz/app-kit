import { baseSepolia } from 'viem/chains';
import { 
  SbcProvider, 
  useSbcApp, 
  useUserOperation,
  type SbcAppKitConfig
} from '@stablecoin.xyz/react';
import './App.css';
import { Hex, encodeFunctionData } from 'viem';
import { useState, useEffect, useCallback } from 'react';

/**
 * SBC Account Abstraction Demo
 * 
 * Features:
 * - Smart SBC token transfers with automatic permit fallback
 * - Gas estimation (hidden for demo - see comments to re-enable)
 * - Real-time balance tracking for both Owner and Smart Account
 * 
 * Gas Estimation Feature:
 * The gas estimation functionality is fully implemented but hidden from the UI.
 * To re-enable, uncomment the marked sections in the JSX below.
 */

// Configuration Constants
const SBC_TOKEN_ADDRESS = '0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16'; // Base Sepolia
const SBC_DECIMALS = 6;
const TRANSFER_AMOUNT = BigInt('1000000'); // 1 SBC (6 decimals)
const PERMIT_DURATION_SECONDS = 600; // 10 minutes

const config: SbcAppKitConfig = {
  apiKey: process.env.REACT_APP_SBC_API_KEY || 'your_api_key_here',
  chain: baseSepolia,
  debug: true,
  privateKey: process.env.REACT_APP_MY_PRIVATE_KEY as Hex,
};

// ABI Definitions
const ERC20_ABI = {
  balanceOf: [{
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }],
  transfer: [{
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ]
  }],
  transferFrom: [{
    name: 'transferFrom',
    type: 'function',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ]
  }],
  permit: [{
    name: 'permit',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' }
    ]
  }],
  nonces: [{
    name: 'nonces',
    type: 'function',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }],
  name: [{
    name: 'name',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  }]
};

function Dashboard() {
  const { 
    sbcAppKit, 
    isInitialized, 
    error, 
    account, 
    isLoadingAccount, 
    accountError,
    refreshAccount 
  } = useSbcApp();

  const { 
    sendUserOperation, 
    // estimateUserOperatestimateUserOperationion,
    isLoading, 
    isSuccess, 
    isError, 
    error: txError, 
    data: txResult,
    reset 
  } = useUserOperation({
    onSuccess: (result) => {
      console.log('Transaction successful!', result);
      // Refresh balances after successful transaction
      refreshAccount();
      fetchAllBalances();
    },
    onError: (error) => {
      console.error('Transaction failed:', error);
    }
  });

  // State for target address input
  const [targetAddress, setTargetAddress] = useState<string>('');
  const [addressError, setAddressError] = useState<string>('');

  // State for gas estimation
  // const [gasEstimate, setGasEstimate] = useState<any>(null);
  // const [isEstimating, setIsEstimating] = useState(false);
  // const [estimationError, setEstimationError] = useState<string | null>(null);

  // State for balances
  const [ownerBalances, setOwnerBalances] = useState<{eth: string | null, sbc: string | null}>({eth: null, sbc: null});
  const [smartAccountBalances, setSmartAccountBalances] = useState<{eth: string | null, sbc: string | null}>({eth: null, sbc: null});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Function to fetch balances for a specific address
  const fetchBalancesForAddress = useCallback(async (address: string): Promise<{eth: string, sbc: string}> => {
    if (!sbcAppKit) return {eth: '0', sbc: '0'};

    try {
      const publicClient = (sbcAppKit as any).publicClient;
      
      // Fetch ETH and SBC balances in parallel
      const [ethBalance, sbcBalance] = await Promise.all([
        publicClient.getBalance({ address: address as `0x${string}` }),
        publicClient.readContract({
          address: SBC_TOKEN_ADDRESS,
          abi: ERC20_ABI.balanceOf,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
        })
      ]);

      return {
        eth: ethBalance.toString(),
        sbc: sbcBalance.toString()
      };
    } catch (error) {
      console.error(`Failed to fetch balances for ${address}:`, error);
      return {eth: '0', sbc: '0'};
    }
  }, [sbcAppKit]);

  // Helper function to format SBC balance
  const formatSbcBalance = (balance: string | null): string => {
    if (!balance) return '0.00';
    return (parseFloat(balance) / Math.pow(10, SBC_DECIMALS)).toFixed(SBC_DECIMALS);
  };

  // Helper function to format ETH balance
  const formatEthBalance = (balance: string | null): string => {
    if (!balance) return '0.000000';
    return (parseFloat(balance) / 1e18).toFixed(6);
  };

  // Helper function to get explorer URL for transaction hash
  const getExplorerUrl = (txHash: string): string => {
    if (!sbcAppKit) throw new Error('SBC AppKit not initialized');
    const chainConfig = sbcAppKit.getChainConfig();
    return `${chainConfig.blockExplorerUrl}/tx/${txHash}`;
  };

  // Function to fetch all balances
  const fetchAllBalances = useCallback(async () => {
    if (!sbcAppKit || !account?.address) return;

    setIsLoadingBalances(true);
    try {
      const ownerAddress = sbcAppKit.getOwnerAddress();
      
      // Fetch balances for both addresses in parallel
      const [ownerBals, smartAccountBals] = await Promise.all([
        fetchBalancesForAddress(ownerAddress),
        fetchBalancesForAddress(account.address)
      ]);

      setOwnerBalances(ownerBals);
      setSmartAccountBalances(smartAccountBals);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      setOwnerBalances({eth: null, sbc: null});
      setSmartAccountBalances({eth: null, sbc: null});
    } finally {
      setIsLoadingBalances(false);
    }
  }, [sbcAppKit, account?.address, fetchBalancesForAddress]);

  // Fetch balances when account changes
  useEffect(() => {
    if (account?.address && sbcAppKit) {
      fetchAllBalances();
    }
  }, [account?.address, sbcAppKit, fetchAllBalances]);

  // Helper function to create permit signature for EIP-2612
  const createPermitSignature = async (amount: bigint, deadline: number) => {
    if (!sbcAppKit || !account?.address) throw new Error('SBC App Kit not initialized');

    const ownerAddress = sbcAppKit.getOwnerAddress();
    const smartAccountAddress = account.address;
    const publicClient = (sbcAppKit as any).publicClient;

    // Fetch required contract data in parallel
    const [nonce, tokenName] = await Promise.all([
      publicClient.readContract({
        address: SBC_TOKEN_ADDRESS,
        abi: ERC20_ABI.nonces,
        functionName: 'nonces',
        args: [ownerAddress]
      }),
      publicClient.readContract({
        address: SBC_TOKEN_ADDRESS,
        abi: ERC20_ABI.name,
        functionName: 'name',
        args: []
      })
    ]);

    // EIP-712 domain structure
    const domain = {
      name: tokenName,
      version: '1',
      chainId: config.chain.id,
      verifyingContract: SBC_TOKEN_ADDRESS,
    };

    // EIP-712 permit type structure  
    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    // Permit message values
    const values = {
      owner: ownerAddress,
      spender: smartAccountAddress,
      value: amount,
      nonce: nonce,
      deadline: BigInt(deadline),
    };

    // Sign the EIP-712 typed data
    const walletClient = (sbcAppKit as any).walletClient;
    const signature = await walletClient.signTypedData({
      domain,
      types,
      primaryType: 'Permit',
      message: values,
    });

    // Parse signature components (v, r, s)
    const sig = {
      r: signature.slice(0, 66) as Hex,
      s: ('0x' + signature.slice(66, 130)) as Hex,
      v: parseInt(signature.slice(130, 132), 16),
    };

    return { sig, deadline, amount };
  };

  // Helper function to create transfer call data
  const createTransferCallData = (to: string, amount: bigint) => {
    return encodeFunctionData({
      abi: ERC20_ABI.transfer,
      functionName: 'transfer',
      args: [to, amount]
    });
  };

  // Helper function to create transferFrom call data
  const createTransferFromCallData = (from: string, to: string, amount: bigint) => {
    return encodeFunctionData({
      abi: ERC20_ABI.transferFrom,
      functionName: 'transferFrom',
      args: [from, to, amount]
    });
  };

  // Helper function to create permit call data
  const createPermitCallData = (owner: string, spender: string, amount: bigint, deadline: number, sig: any) => {
    return encodeFunctionData({
      abi: ERC20_ABI.permit,
      functionName: 'permit',
      args: [owner, spender, amount, BigInt(deadline), sig.v, sig.r, sig.s]
    });
  };

  // Helper function to validate Ethereum address
  const validateAddress = (address: string): boolean => {
    // Check if it's a valid hex string starting with 0x and 42 characters long
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(address);
  };

  // Handle address input change
  const handleAddressChange = (value: string) => {
    setTargetAddress(value);
    
    if (value === '') {
      setAddressError('');
    } else if (!validateAddress(value)) {
      setAddressError('Please enter a valid Ethereum address (0x followed by 40 hex characters)');
    } else {
      setAddressError('');
    }
  };

  // Helper function to send simple SBC transfer
  const sendSimpleTransfer = async (toAddress: string) => {
    console.log('Smart account has sufficient balance, sending simple transfer');
    
    const transferData = createTransferCallData(toAddress, TRANSFER_AMOUNT);
    
    await sendUserOperation({
      to: SBC_TOKEN_ADDRESS,
      data: transferData,
      value: '0'
    });
  };

  // Helper function to send permit + transferFrom + transfer multi-call
  const sendPermitTransfer = async (toAddress: string) => {
    console.log('Owner has sufficient balance, creating permit + transferFrom + transfer multi-call');
    
    const deadline = Math.floor(Date.now() / 1000) + PERMIT_DURATION_SECONDS;
    const { sig } = await createPermitSignature(TRANSFER_AMOUNT, deadline);
    const ownerAddress = sbcAppKit!.getOwnerAddress();
    const smartAccountAddress = account!.address;

    const permitData = createPermitCallData(ownerAddress, smartAccountAddress, TRANSFER_AMOUNT, deadline, sig);
    const transferFromData = createTransferFromCallData(ownerAddress, smartAccountAddress, TRANSFER_AMOUNT);
    const finalTransferData = createTransferCallData(toAddress, TRANSFER_AMOUNT);

    await sendUserOperation({
      calls: [
        { to: SBC_TOKEN_ADDRESS, data: permitData, value: 0n },
        { to: SBC_TOKEN_ADDRESS, data: transferFromData, value: 0n },
        { to: SBC_TOKEN_ADDRESS, data: finalTransferData, value: 0n }
      ]
    });
  };

  const handleSendTransaction = async () => {
    if (!sbcAppKit || !targetAddress || addressError) return;

    try {
      // Get current balances
      const smartAccountSbcBalance = smartAccountBalances.sbc ? BigInt(smartAccountBalances.sbc) : 0n;
      const ownerSbcBalance = ownerBalances.sbc ? BigInt(ownerBalances.sbc) : 0n;

      // Determine transaction strategy based on available balances
      if (smartAccountSbcBalance >= TRANSFER_AMOUNT) {
        // Smart account has sufficient balance - simple transfer
        await sendSimpleTransfer(targetAddress);
      } else if (ownerSbcBalance >= TRANSFER_AMOUNT) {
        // Owner has sufficient balance - permit + transferFrom + transfer
        await sendPermitTransfer(targetAddress);
      } else {
        // Neither account has sufficient balance
        const smartAccountSbc = (Number(smartAccountSbcBalance) / Math.pow(10, SBC_DECIMALS)).toFixed(SBC_DECIMALS);
        const ownerSbc = (Number(ownerSbcBalance) / Math.pow(10, SBC_DECIMALS)).toFixed(SBC_DECIMALS);
        const requiredSbc = (Number(TRANSFER_AMOUNT) / Math.pow(10, SBC_DECIMALS)).toFixed(SBC_DECIMALS);
        
        throw new Error(
          `Insufficient SBC balance. Need ${requiredSbc} SBC. ` +
          `Smart account has ${smartAccountSbc} SBC, Owner has ${ownerSbc} SBC.`
        );
      }
    } catch (error) {
      console.error('Failed to send transaction:', error);
    }
  };

  // Gas Estimation Functions
  // To re-enable: Uncomment the gas estimation button and results UI sections below
  
  // // Helper function to estimate gas for simple transfer
  // const estimateSimpleTransfer = async () => {
  //   console.log('Estimating gas for simple transfer');
  //   const transferData = createTransferCallData(targetAddress, TRANSFER_AMOUNT);
    
  //   return await estimateUserOperation({
  //     to: SBC_TOKEN_ADDRESS,
  //     data: transferData,
  //     value: '0'
  //   });
  // };

  // // Helper function to estimate gas for permit transfer
  // const estimatePermitTransfer = async () => {
  //   console.log('Estimating gas for permit + transferFrom + transfer multi-call');
    
  //   const deadline = Math.floor(Date.now() / 1000) + PERMIT_DURATION_SECONDS;
  //   const { sig } = await createPermitSignature(TRANSFER_AMOUNT, deadline);
  //   const ownerAddress = sbcAppKit!.getOwnerAddress();
  //   const smartAccountAddress = account!.address;

  //   const permitData = createPermitCallData(ownerAddress, smartAccountAddress, TRANSFER_AMOUNT, deadline, sig);
  //   const transferFromData = createTransferFromCallData(ownerAddress, smartAccountAddress, TRANSFER_AMOUNT);
  //   const finalTransferData = createTransferCallData(targetAddress, TRANSFER_AMOUNT);

  //   return await estimateUserOperation({
  //     calls: [
  //       { to: SBC_TOKEN_ADDRESS, data: permitData, value: 0n },
  //       { to: SBC_TOKEN_ADDRESS, data: transferFromData, value: 0n },
  //       { to: SBC_TOKEN_ADDRESS, data: finalTransferData, value: 0n }
  //     ]
  //   });
  // };

  // const handleEstimateGas = async () => {
  //   if (!sbcAppKit) return;

  //   setIsEstimating(true);
  //   setEstimationError(null);
  //   setGasEstimate(null);

  //   try {
  //     // Get current balances
  //     const smartAccountSbcBalance = smartAccountBalances.sbc ? BigInt(smartAccountBalances.sbc) : 0n;
  //     const ownerSbcBalance = ownerBalances.sbc ? BigInt(ownerBalances.sbc) : 0n;

  //     let estimate;

  //     // Determine estimation strategy based on available balances
  //     if (smartAccountSbcBalance >= TRANSFER_AMOUNT) {
  //       // Smart account has sufficient balance - estimate simple transfer
  //       estimate = await estimateSimpleTransfer();
  //     } else if (ownerSbcBalance >= TRANSFER_AMOUNT) {
  //       // Owner has sufficient balance - estimate permit transfer
  //       estimate = await estimatePermitTransfer();
  //     } else {
  //       // Neither account has sufficient balance
  //       const smartAccountSbc = (Number(smartAccountSbcBalance) / Math.pow(10, SBC_DECIMALS)).toFixed(SBC_DECIMALS);
  //       const ownerSbc = (Number(ownerSbcBalance) / Math.pow(10, SBC_DECIMALS)).toFixed(SBC_DECIMALS);
  //       const requiredSbc = (Number(TRANSFER_AMOUNT) / Math.pow(10, SBC_DECIMALS)).toFixed(SBC_DECIMALS);
        
  //       throw new Error(
  //         `Insufficient SBC balance. Need ${requiredSbc} SBC. ` +
  //         `Smart account has ${smartAccountSbc} SBC, Owner has ${ownerSbc} SBC.`
  //       );
  //     }

  //     console.log('Gas estimate:', estimate);
  //     setGasEstimate(estimate);
  //   } catch (error) {
  //     console.error('Failed to estimate gas:', error);
  //     setEstimationError(error instanceof Error ? error.message : 'Unknown error');
  //   } finally {
  //     setIsEstimating(false);
  //   }
  // };

  if (error) {
    return (
      <div className="error">
        <h2>❌ Initialization Error</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="loading">
        <h2>🔄 Initializing SBC App Kit...</h2>
        <p>Setting up your smart account...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>🏦 SBC Account Abstraction Demo</h1>

      {/* Account Info */}
      <div className="card">
        <h3>📱 Account Information</h3>
        {isLoadingAccount ? (
          <p>Loading account info...</p>
        ) : accountError ? (
          <div className="error">
            <p>Error: {accountError.message}</p>
            <button onClick={refreshAccount}>Retry</button>
          </div>
        ) : account ? (
          <div>
            {/* Owner Section */}
            <div style={{marginBottom: '20px', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px'}}>
              <h4 style={{margin: '0 0 8px 0'}}>👤 Owner (EOA)</h4>
              <p style={{margin: '4px 0'}}><strong>Address:</strong> {sbcAppKit?.getOwnerAddress()}</p>
              <p style={{margin: '4px 0'}}><strong>ETH Balance:</strong> {
                isLoadingBalances ? 'Loading...' : formatEthBalance(ownerBalances.eth)
              } ETH</p>
              <p style={{margin: '4px 0'}}><strong>SBC Balance:</strong> {
                isLoadingBalances ? 'Loading...' : formatSbcBalance(ownerBalances.sbc)
              } SBC</p>
            </div>

            {/* Smart Account Section */}
            <div style={{marginBottom: '20px', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px'}}>
              <h4 style={{margin: '0 0 8px 0'}}>🤖 Smart Account</h4>
              <p style={{margin: '4px 0'}}><strong>Address:</strong> {account.address}</p>
              <p style={{margin: '4px 0'}}><strong>Deployed:</strong> {account.isDeployed ? '✅ Yes' : '❌ No'}</p>
              <p style={{margin: '4px 0'}}><strong>Nonce:</strong> {account.nonce}</p>
              <p style={{margin: '4px 0'}}><strong>ETH Balance:</strong> {
                isLoadingBalances ? 'Loading...' : formatEthBalance(smartAccountBalances.eth)
              } ETH</p>
              <p style={{margin: '4px 0'}}><strong>SBC Balance:</strong> {
                isLoadingBalances ? 'Loading...' : formatSbcBalance(smartAccountBalances.sbc)
              } SBC</p>
            </div>

            {smartAccountBalances.eth && parseFloat(smartAccountBalances.eth) > 0 && parseFloat(smartAccountBalances.eth) < 1000000000000000 && (
              <div className="warning" style={{color: 'orange', marginTop: '8px'}}>
                ⚠️ Low ETH balance on smart account. Recommended: at least 0.001 ETH for reliable transactions.
                <br />
                <a 
                  href={`https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{color: '#0052ff', textDecoration: 'underline'}}
                >
                  Get more Base Sepolia ETH from faucet
                </a>
              </div>
            )}
            
            <button onClick={() => {
              refreshAccount();
              fetchAllBalances();
            }}>Refresh</button>
          </div>
        ) : null}
      </div>

      {/* Transaction Controls */}
      <div className="card">
        <h3>💸 Send SBC Transaction</h3>
        <p>Send 1 SBC to any address</p>
        
        {/* Address Input */}
        <div style={{marginBottom: '16px'}}>
          <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
            Recipient Address:
          </label>
          <input
            type="text"
            value={targetAddress}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="0x... (Enter recipient's Ethereum address)"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${addressError ? '#ff4444' : '#ddd'}`,
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          />
          {addressError && (
            <p style={{color: '#ff4444', fontSize: '0.85em', marginTop: '4px'}}>
              {addressError}
            </p>
          )}
          {targetAddress && !addressError && (
            <p style={{fontSize: '0.85em', color: '#666', marginTop: '4px'}}>
              ✅ Valid address
            </p>
          )}
        </div>

        <p style={{fontSize: '0.85em', color: '#666', marginBottom: '12px'}}>
          💡 Smart Transaction: the smart account can have zero SBC balance and will transfer SBC from Owner's balance if it has enough.
        </p>
        <div className="button-group">
          {/* Gas Estimation Button - Hidden for demo but functional
              Uncomment to show gas estimation feature:
              <button 
                onClick={handleEstimateGas}
                disabled={isLoading || isEstimating}
              >
                {isEstimating ? '⏳ Estimating...' : '📊 Estimate Gas'}
              </button>
          */}
          <button 
            onClick={handleSendTransaction}
            disabled={isLoading || !targetAddress || !!addressError || (
              smartAccountBalances.sbc !== null && 
              ownerBalances.sbc !== null && 
              (BigInt(smartAccountBalances.sbc) + BigInt(ownerBalances.sbc)) < TRANSFER_AMOUNT
            )}
            className="primary"
          >
            {isLoading ? '⏳ Sending...' : `🚀 Send 1 SBC`}
          </button>
        </div>

        {!targetAddress && (
          <p style={{fontSize: '0.85em', color: '#999', marginTop: '8px', textAlign: 'center'}}>
            👆 Enter a recipient address to enable sending
          </p>
        )}

        {targetAddress && addressError && (
          <p style={{fontSize: '0.85em', color: '#ff4444', marginTop: '8px', textAlign: 'center'}}>
            ❌ Please enter a valid address to enable sending
          </p>
        )}

        {smartAccountBalances.sbc !== null && 
         ownerBalances.sbc !== null && 
         (BigInt(smartAccountBalances.sbc) + BigInt(ownerBalances.sbc)) < TRANSFER_AMOUNT && (
          <p style={{fontSize: '0.85em', color: '#ff4444', marginTop: '8px', textAlign: 'center'}}>
            ❌ Insufficient SBC balance across both accounts
          </p>
        )}

        {/* Transaction Status */}
        {isLoading && (
          <div className="status loading">
            <p>🔄 Transaction in progress...</p>
          </div>
        )}

        {isSuccess && txResult && (
          <div className="status success">
            <p>✅ Transaction successful!</p>
            <p>
              <strong>TX Hash:</strong>{' '}
              <a 
                href={getExplorerUrl(txResult.transactionHash)} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: '#0052ff',
                  textDecoration: 'underline',
                  fontFamily: 'monospace',
                  fontSize: '0.9em',
                  wordBreak: 'break-all'
                }}
              >
                {txResult.transactionHash}
              </a>
            </p>
            <p><strong>Gas Used:</strong> {txResult.gasUsed}</p>
            <button onClick={reset}>Clear</button>
          </div>
        )}

        {isError && txError && (
          <div className="status error">
            <p>❌ Transaction failed:</p>
            <p>{txError.message}</p>
            <button onClick={reset}>Clear</button>
          </div>
        )}
      </div>

      {/* Gas Estimation Results - Hidden for demo but functional
          Uncomment to show gas estimation results:
          
      {(gasEstimate || estimationError || isEstimating) && (
        <div className="card">
          <h3>⛽ Gas Estimation</h3>
          
          {isEstimating && (
            <div className="status loading">
              <p>🔄 Estimating gas costs...</p>
            </div>
          )}

          {estimationError && (
            <div className="status error">
              <p>❌ Gas estimation failed:</p>
              <p>{estimationError}</p>
              <button onClick={() => setEstimationError(null)}>Clear</button>
            </div>
          )}

          {gasEstimate && (
            <div className="status success">
              <p>✅ Gas estimation successful!</p>
              <div style={{ textAlign: 'left', marginTop: '12px' }}>
                <p><strong>Call Gas Limit:</strong> {gasEstimate.callGasLimit?.toString() || 'N/A'}</p>
                <p><strong>Verification Gas Limit:</strong> {gasEstimate.verificationGasLimit?.toString() || 'N/A'}</p>
                <p><strong>Pre-verification Gas:</strong> {gasEstimate.preVerificationGas?.toString() || 'N/A'}</p>
                <p><strong>Max Fee Per Gas:</strong> {gasEstimate.maxFeePerGas?.toString() || 'N/A'} wei</p>
                <p><strong>Max Priority Fee Per Gas:</strong> {gasEstimate.maxPriorityFeePerGas?.toString() || 'N/A'} wei</p>
                {gasEstimate.paymasterAndData && (
                  <p><strong>Paymaster:</strong> {gasEstimate.paymasterAndData.slice(0, 42)}...</p>
                )}
              </div>
              <button onClick={() => setGasEstimate(null)} style={{ marginTop: '12px' }}>Clear</button>
            </div>
          )}
        </div>
      )}
      */}

      {/* Debug Info */}
      {config.debug && (
        <div className="card debug">
          <h3>🔧 Debug Information</h3>
          <p><strong>Chain:</strong> {config.chain.name} (ID: {config.chain.id})</p>
          <p><strong>SDK Initialized:</strong> {isInitialized ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <SbcProvider 
      config={config}
      onError={(error) => {
        console.error('SBC Provider Error:', error);
      }}
    >
      <div className="App">
        <Dashboard />
      </div>
    </SbcProvider>
  );
}

export default App; 