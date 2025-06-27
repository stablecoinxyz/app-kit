import { baseSepolia } from 'viem/chains';
import { 
  SbcProvider, 
  useSbcKit, 
  useUserOperation,
  type SbcAppKitConfig
} from '@sbc/react';
import './App.css';

// Your SBC configuration - now works without type casting!
const config: SbcAppKitConfig = {
  apiKey: process.env.REACT_APP_SBC_API_KEY || 'your_api_key_here',
  chain: baseSepolia, // No casting needed when peer deps are properly managed!
  staging: true, // Use staging for development
  debug: true,
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
    },
    onError: (error) => {
      console.error('Transaction failed:', error);
    }
  });

  const handleSendTransaction = async () => {
    if (!sbcKit) return;

    try {
      // Example: Send some ETH to another address
      await sendUserOperation({
        to: '0x742d35Cc6635C0532925a3b8c17f21c5F8E63231', // Replace with actual address
        data: '0x', // Empty data for ETH transfer
        value: '1000000000000000' // 0.001 ETH in wei
      });
    } catch (error) {
      console.error('Failed to send transaction:', error);
    }
  };

  const handleEstimateGas = async () => {
    if (!sbcKit) return;

    try {
      const estimate = await estimateUserOperation({
        to: '0x742d35Cc6635C0532925a3b8c17f21c5F8E63231',
        data: '0x',
        value: '1000000000000000'
      });
      console.log('Gas estimate:', estimate);
    } catch (error) {
      console.error('Failed to estimate gas:', error);
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
            <p><strong>Address:</strong> {account.address}</p>
            <p><strong>Deployed:</strong> {account.isDeployed ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Nonce:</strong> {account.nonce}</p>
            <button onClick={refreshAccount}>Refresh</button>
          </div>
        ) : null}
      </div>

      {/* Transaction Controls */}
      <div className="card">
        <h3>💸 Send Transaction</h3>
        <div className="button-group">
          <button 
            onClick={handleEstimateGas}
            disabled={isLoading}
          >
            📊 Estimate Gas
          </button>
          <button 
            onClick={handleSendTransaction}
            disabled={isLoading}
            className="primary"
          >
            {isLoading ? '⏳ Sending...' : '🚀 Send 0.001 ETH'}
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

      {/* Debug Info */}
      {config.debug && (
        <div className="card debug">
          <h3>🔧 Debug Information</h3>
          <p><strong>Chain:</strong> {config.chain.name} (ID: {config.chain.id})</p>
          <p><strong>Staging:</strong> {config.staging ? 'Yes' : 'No'}</p>
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