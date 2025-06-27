import { baseSepolia } from 'viem/chains';
import { 
  SbcProvider, 
  useSbcKit, 
  useUserOperation,
  type SbcAppKitConfig
} from '@sbc/react';
import './App.css';
import { Hex, encodeFunctionData } from 'viem';
import { useState, useEffect } from 'react';

const config: SbcAppKitConfig = {
  apiKey: process.env.REACT_APP_SBC_API_KEY || 'your_api_key_here',
  chain: baseSepolia, // No casting needed when peer deps are properly managed!
  debug: true,
  privateKey: process.env.REACT_APP_MY_PRIVATE_KEY as Hex,
};

function Dashboard() {
  const { 
    sbcKit, 
    isInitialized, 
    error, 
    account, 
    isLoadingAccount, 
    accountError,
    refreshAccount 
  } = useSbcKit();

  const { 
    sendUserOperation, 
    estimateUserOperation,
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

  // State for gas estimation
  const [gasEstimate, setGasEstimate] = useState<any>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationError, setEstimationError] = useState<string | null>(null);

  // State for balances
  const [ownerBalances, setOwnerBalances] = useState<{eth: string | null, sbc: string | null}>({eth: null, sbc: null});
  const [smartAccountBalances, setSmartAccountBalances] = useState<{eth: string | null, sbc: string | null}>({eth: null, sbc: null});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Function to fetch both ETH and SBC balances for a specific address
  const fetchBalancesForAddress = async (address: string): Promise<{eth: string, sbc: string}> => {
    const publicClient = (sbcKit as any).publicClient;

    // Fetch ETH balance
    const ethBalance = await publicClient.getBalance({ address });
    
    // Fetch SBC token balance
    const sbcBalance = await publicClient.readContract({
      address: '0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16', // SBC token contract on Base Sepolia
      abi: [{
        name: 'balanceOf',
        type: 'function',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      }],
      functionName: 'balanceOf',
      args: [address]
    });

    return {
      eth: ethBalance.toString(),
      sbc: sbcBalance.toString()
    };
  };

  // Function to fetch all balances
  const fetchAllBalances = async () => {
    if (!sbcKit || !account?.address) return;

    setIsLoadingBalances(true);
    try {
      const ownerAddress = sbcKit.getOwnerAddress();
      
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
  };

  // Fetch balances when account changes
  useEffect(() => {
    if (account?.address && sbcKit) {
      fetchAllBalances();
    }
  }, [account?.address, sbcKit]);

  const handleSendTransaction = async () => {
    if (!sbcKit) return;

    try {
      // Create ERC20 transfer data for 1 SBC token
      const transferData = encodeFunctionData({
        abi: [{
          name: 'transfer',
          type: 'function',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ]
        }],
        functionName: 'transfer',
        args: [
          '0xbb46C0C1792d7b606Db07cead656efd93b433222', // SBC Deployer
          BigInt('1000000') // 1 SBC (6 decimals)
        ]
      });

      // Send 1 SBC token to the address
      await sendUserOperation({
        to: '0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16', // SBC token contract on Base Sepolia
        data: transferData,
        value: '0' // No ETH value for ERC20 transfer
      });
    } catch (error) {
      console.error('Failed to send transaction:', error);
    }
  };

  const handleEstimateGas = async () => {
    if (!sbcKit) return;

    setIsEstimating(true);
    setEstimationError(null);
    setGasEstimate(null);

    try {
      // Create ERC20 transfer data for 1 SBC token (same as send transaction)
      const transferData = encodeFunctionData({
        abi: [{
          name: 'transfer',
          type: 'function',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ]
        }],
        functionName: 'transfer',
        args: [
          '0xbb46C0C1792d7b606Db07cead656efd93b433222', // SBC Deployer
          BigInt('1000000') // 1 SBC (6 decimals)
        ]
      });

      const estimate = await estimateUserOperation({
        to: '0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16', // SBC token contract on Base Sepolia
        data: transferData,
        value: '0'
      });
      console.log('Gas estimate:', estimate);
      setGasEstimate(estimate);
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      setEstimationError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsEstimating(false);
    }
  };

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
              <p style={{margin: '4px 0'}}><strong>Address:</strong> {sbcKit?.getOwnerAddress()}</p>
              <p style={{margin: '4px 0'}}><strong>ETH Balance:</strong> {
                isLoadingBalances ? 'Loading...' : 
                ownerBalances.eth ? (parseFloat(ownerBalances.eth) / 1e18).toFixed(6) : '0.00'
              } ETH</p>
              <p style={{margin: '4px 0'}}><strong>SBC Balance:</strong> {
                isLoadingBalances ? 'Loading...' : 
                ownerBalances.sbc ? (parseFloat(ownerBalances.sbc) / 1e6).toFixed(2) : '0.00'
              } SBC</p>
            </div>

            {/* Smart Account Section */}
            <div style={{marginBottom: '20px', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px'}}>
              <h4 style={{margin: '0 0 8px 0'}}>🤖 Smart Account</h4>
              <p style={{margin: '4px 0'}}><strong>Address:</strong> {account.address}</p>
              <p style={{margin: '4px 0'}}><strong>Deployed:</strong> {account.isDeployed ? '✅ Yes' : '❌ No'}</p>
              <p style={{margin: '4px 0'}}><strong>Nonce:</strong> {account.nonce}</p>
              <p style={{margin: '4px 0'}}><strong>ETH Balance:</strong> {
                isLoadingBalances ? 'Loading...' : 
                smartAccountBalances.eth ? (parseFloat(smartAccountBalances.eth) / 1e18).toFixed(6) : '0.00'
              } ETH</p>
              <p style={{margin: '4px 0'}}><strong>SBC Balance:</strong> {
                isLoadingBalances ? 'Loading...' : 
                smartAccountBalances.sbc ? (parseFloat(smartAccountBalances.sbc) / 1e6).toFixed(2) : '0.00'
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
        <h3>💸 Send Transaction</h3>
        <p>This will send 1 SBC token to the address 0xbb46C0C1792d7b606Db07cead656efd93b433222</p>
        <div className="button-group">
          <button 
            onClick={handleEstimateGas}
            disabled={isLoading || isEstimating}
          >
            {isEstimating ? '⏳ Estimating...' : '📊 Estimate Gas'}
          </button>
          <button 
            onClick={handleSendTransaction}
            disabled={isLoading || (smartAccountBalances.sbc !== null && parseFloat(smartAccountBalances.sbc) < 1000000)}
            className="primary"
          >
            {isLoading ? '⏳ Sending...' : '🚀 Send 1 SBC'}
          </button>
        </div>

        {/* Transaction Status */}
        {isLoading && (
          <div className="status loading">
            <p>🔄 Transaction in progress...</p>
          </div>
        )}

        {isSuccess && txResult && (
          <div className="status success">
            <p>✅ Transaction successful!</p>
            <p><strong>TX Hash:</strong> {txResult.transactionHash}</p>
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

      {/* Gas Estimation Results */}
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