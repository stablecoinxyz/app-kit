import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Turnkey } from '@turnkey/sdk-server';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Log environment variables BEFORE initialization
console.log('\n🔍 Environment Variables:');
console.log('  TURNKEY_ORGANIZATION_ID:', process.env.TURNKEY_ORGANIZATION_ID);
console.log('  TURNKEY_API_BASE_URL:', process.env.TURNKEY_API_BASE_URL);
console.log('  TURNKEY_API_PUBLIC_KEY:', process.env.TURNKEY_API_PUBLIC_KEY?.substring(0, 20) + '...');
console.log('  TURNKEY_API_PRIVATE_KEY:', process.env.TURNKEY_API_PRIVATE_KEY ? '[SET]' : '[NOT SET]');

// Initialize Turnkey SDK
const turnkey = new Turnkey({
  defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID!,
  apiBaseUrl: process.env.TURNKEY_API_BASE_URL || 'https://api.turnkey.com',
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
  apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
});

// Create API client for signing requests
const turnkeyClient = turnkey.apiClient();

console.log('\n✓ Turnkey SDK initialized');
console.log('  Using Organization ID:', process.env.TURNKEY_ORGANIZATION_ID);
console.log('  API Base URL:', process.env.TURNKEY_API_BASE_URL);

// Create sub-organization for new user
app.post('/api/create-sub-org', async (req, res) => {
  console.log('\n🚀 [BACKEND] POST /api/create-sub-org - Request received');

  try {
    const { userName, userEmail, attestation, challenge } = req.body;
    console.log('📝 [BACKEND] Request data:', {
      userName,
      userEmail,
      hasAttestation: !!attestation,
      hasChallenge: !!challenge,
      attestationLength: attestation?.length,
    });

    // Step 1: Create sub-organization
    console.log('🏢 [BACKEND] Step 1: Creating sub-organization...');
    console.log('🔑 [BACKEND] Forcing organization ID:', process.env.TURNKEY_ORGANIZATION_ID);

    const subOrgResponse = await turnkeyClient.createSubOrganization({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      subOrganizationName: `${userName}'s Organization`,
      rootUsers: [{
        userName,
        userEmail,
        apiKeys: [],
        authenticators: [{
          authenticatorName: `${userName}'s Passkey`,
          challenge,
          attestation,
        }],
        oauthProviders: [],
      }],
      rootQuorumThreshold: 1,
      wallet: {
        walletName: `${userName}'s Wallet`,
        accounts: [{
          curve: 'CURVE_SECP256K1',
          pathFormat: 'PATH_FORMAT_BIP32',
          path: "m/44'/60'/0'/0/0",
          addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
        }],
      },
    });
    console.log('✅ [BACKEND] Sub-org created successfully!', {
      subOrgId: subOrgResponse.subOrganizationId,
      wallet: subOrgResponse.wallet,
    });

    const subOrgId = subOrgResponse.subOrganizationId;
    const walletAddresses = subOrgResponse.wallet?.addresses || [];

    const responseData = {
      subOrganizationId: subOrgId,
      addresses: walletAddresses,
    };
    console.log('📤 [BACKEND] Sending success response:', responseData);
    res.json(responseData);
  } catch (error: any) {
    console.error('❌ [BACKEND] Error creating sub-org:', error);
    console.error('❌ [BACKEND] Error message:', error.message);
    console.error('❌ [BACKEND] Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Get wallets for a sub-org (for login)
app.get('/api/get-wallets', async (req, res) => {
  console.log('\n🔍 [BACKEND] GET /api/get-wallets - Request received');

  try {
    const { subOrgId } = req.query;
    console.log('📝 [BACKEND] Sub-org ID:', subOrgId);

    if (!subOrgId || typeof subOrgId !== 'string') {
      return res.status(400).json({ error: 'subOrgId is required' });
    }

    console.log('💼 [BACKEND] Fetching wallets for sub-org...');
    const walletsResponse = await turnkeyClient.getWallets({
      organizationId: subOrgId,
    });

    console.log('✅ [BACKEND] Wallets fetched:', walletsResponse);

    // Extract addresses from wallets
    const addresses: string[] = [];
    if (walletsResponse.wallets && walletsResponse.wallets.length > 0) {
      for (const wallet of walletsResponse.wallets) {
        const accountsResponse = await turnkeyClient.getWalletAccounts({
          organizationId: subOrgId,
          walletId: wallet.walletId,
        });
        if (accountsResponse.accounts) {
          addresses.push(...accountsResponse.accounts.map(acc => acc.address));
        }
      }
    }

    res.json({
      wallets: walletsResponse.wallets,
      addresses,
    });
  } catch (error: any) {
    console.error('❌ [BACKEND] Error fetching wallets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create wallet for user's sub-org
app.post('/api/create-wallet', async (req, res) => {
  try {
    const { subOrganizationId, walletName } = req.body;

    const walletResponse = await turnkeyClient.createWallet({
      organizationId: subOrganizationId,
      walletName: walletName || 'Default Wallet',
      accounts: [{
        curve: 'CURVE_SECP256K1',
        pathFormat: 'PATH_FORMAT_BIP32',
        path: "m/44'/60'/0'/0/0",
        addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
      }],
    });

    res.json({
      walletId: walletResponse.walletId,
      addresses: walletResponse.addresses,
    });
  } catch (error: any) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Turnkey backend server running on http://localhost:${port}`);
});
