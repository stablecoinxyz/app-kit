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

/**
 * Create sub-organization with passkey authentication
 *
 * Creates a new Turnkey sub-organization for a user using WebAuthn passkey authentication.
 * This is the primary flow for biometric authentication (Face ID/Touch ID).
 * Also creates a Turnkey-managed wallet for the user.
 *
 * @route POST /api/create-sub-org
 * @param {string} req.body.userName - User's display name
 * @param {string} req.body.userEmail - User's email address
 * @param {string} req.body.attestation - WebAuthn attestation object from passkey creation
 * @param {string} req.body.challenge - WebAuthn challenge used for passkey creation
 * @returns {object} Response object
 * @returns {string} response.subOrganizationId - ID of the created sub-organization
 * @returns {string[]} response.addresses - Array of wallet addresses (Turnkey-managed wallet)
 * @throws {500} If sub-organization creation fails
 */
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

/**
 * Create sub-organization with wallet authentication
 *
 * Creates a new Turnkey sub-organization for a user using external wallet authentication
 * (MetaMask, Coinbase Wallet, etc.). The user's wallet becomes the smart account owner.
 * Does NOT create a Turnkey-managed wallet - uses user's existing wallet instead.
 *
 * @route POST /api/create-sub-org-with-wallet
 * @param {string} req.body.userName - User's display name
 * @param {string} req.body.userEmail - User's email address
 * @param {string} req.body.publicKey - Compressed secp256k1 public key derived from wallet signature
 * @param {string} req.body.walletAddress - User's wallet address (0x...)
 * @returns {object} Response object
 * @returns {string} response.subOrganizationId - ID of the created sub-organization
 * @returns {string[]} response.addresses - Array containing the user's wallet address
 * @throws {400} If required parameters are missing
 * @throws {500} If sub-organization creation fails
 */
app.post('/api/create-sub-org-with-wallet', async (req, res) => {
  console.log('\n🚀 [BACKEND] POST /api/create-sub-org-with-wallet - Request received');

  try {
    const { userName, userEmail, publicKey, walletAddress } = req.body;
    console.log('📝 [BACKEND] Request data:', {
      userName,
      userEmail,
      publicKey,
      walletAddress,
    });

    if (!userName || !userEmail || !publicKey || !walletAddress) {
      return res.status(400).json({ error: 'userName, userEmail, publicKey, and walletAddress are required' });
    }

    // Compressed public keys from secp256k1 start with 0x02 or 0x03 (33 bytes / 66 hex chars)
    console.log('📝 [BACKEND] Using public key:', publicKey);
    const formattedPublicKey = publicKey;

    // Create sub-organization with wallet-based API key (NO Turnkey wallet creation)
    console.log('🏢 [BACKEND] Creating sub-organization with wallet authentication...');
    console.log('🔑 [BACKEND] User will use their MetaMask wallet as owner:', walletAddress);

    const subOrgResponse = await turnkeyClient.createSubOrganization({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      subOrganizationName: `${userName}'s Organization`,
      rootUsers: [{
        userName,
        userEmail,
        apiKeys: [{
          apiKeyName: `${userName}'s Wallet Key`,
          publicKey: formattedPublicKey,
          curveType: 'API_KEY_CURVE_SECP256K1',
        }],
        authenticators: [], // No passkey authenticators for wallet-based auth
        oauthProviders: [],
      }],
      rootQuorumThreshold: 1,
      // NO wallet creation - user's MetaMask wallet will be the owner
    });

    console.log('✅ [BACKEND] Sub-org created with wallet auth!', {
      subOrgId: subOrgResponse.subOrganizationId,
      userWalletAddress: walletAddress,
    });

    const subOrgId = subOrgResponse.subOrganizationId;

    // Return the user's MetaMask wallet address, not a Turnkey wallet
    const responseData = {
      subOrganizationId: subOrgId,
      addresses: [walletAddress], // User's MetaMask wallet is the owner
    };
    console.log('📤 [BACKEND] Sending success response:', responseData);
    res.json(responseData);
  } catch (error: any) {
    console.error('❌ [BACKEND] Error creating sub-org with wallet:', error);
    console.error('❌ [BACKEND] Error message:', error.message);
    console.error('❌ [BACKEND] Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get sub-organization by wallet public key
 *
 * Looks up a sub-organization ID using the wallet's public key.
 * Used to check if a wallet user already has an existing sub-organization.
 * Also fetches wallet addresses associated with the sub-organization.
 *
 * @route POST /api/get-sub-org-by-wallet
 * @param {string} req.body.publicKey - Compressed secp256k1 public key to search for
 * @returns {object} Response object
 * @returns {string|null} response.subOrganizationId - ID of the found sub-organization, or null if not found
 * @returns {string[]} response.addresses - Array of wallet addresses (empty if not found)
 * @throws {400} If publicKey is missing or invalid
 * @throws {500} If sub-organization lookup fails
 */
app.post('/api/get-sub-org-by-wallet', async (req, res) => {
  console.log('\n🔍 [BACKEND] POST /api/get-sub-org-by-wallet - Request received');

  try {
    const { publicKey } = req.body;
    console.log('📝 [BACKEND] Public key:', publicKey);

    if (!publicKey || typeof publicKey !== 'string') {
      return res.status(400).json({ error: 'publicKey is required' });
    }

    console.log('🔎 [BACKEND] Searching for sub-org with public key...');
    const result = await turnkeyClient.getSubOrgIds({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      filterType: 'PUBLIC_KEY',
      filterValue: publicKey,
    });

    console.log('✅ [BACKEND] Sub-org IDs found:', result.organizationIds);

    const subOrgId = result.organizationIds?.[0] ?? null;

    if (subOrgId) {
      // Fetch wallet info for this sub-org
      console.log('💼 [BACKEND] Fetching wallet for sub-org:', subOrgId);
      const walletsResponse = await turnkeyClient.getWallets({
        organizationId: subOrgId,
      });

      const addresses: string[] = [];
      if (walletsResponse.wallets && walletsResponse.wallets.length > 0) {
        const wallet = walletsResponse.wallets[0];
        const accountsResponse = await turnkeyClient.getWalletAccounts({
          organizationId: subOrgId,
          walletId: wallet.walletId,
        });
        if (accountsResponse.accounts) {
          addresses.push(...accountsResponse.accounts.map(acc => acc.address));
        }
      }

      res.json({
        subOrganizationId: subOrgId,
        addresses,
      });
    } else {
      res.json({
        subOrganizationId: null,
        addresses: [],
      });
    }
  } catch (error: any) {
    console.error('❌ [BACKEND] Error fetching sub-org:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Turnkey backend server running on http://localhost:${port}`);
});
