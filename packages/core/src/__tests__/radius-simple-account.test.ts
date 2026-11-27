import { createPublicClient, createWalletClient, custom } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { radius } from '../lib/radius-network';
import { toRadiusSimpleSmartAccount } from '../lib/radius-simple-account';
import { SbcAppKit } from '../app-kit';

jest.mock('permissionless/actions', () => ({
  getSenderAddress: jest.fn().mockResolvedValue('0xabcdef1234567890abcdef1234567890abcdef12'),
  getAccountNonce: jest.fn().mockResolvedValue(0n),
}));

describe('toRadiusSimpleSmartAccount', () => {
  it('creates an account with a viem wallet client without requesting RPC accounts', async () => {
    const request = jest.fn(async ({ method }: { method: string }) => {
      if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
        return [];
      }
      throw new Error(`Unexpected RPC method: ${method}`);
    });
    const transport = custom({ request });
    const client = createPublicClient({ chain: radius, transport });
    const owner = privateKeyToAccount(
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    );
    const walletClient = createWalletClient({ account: owner, chain: radius, transport });

    const account = await toRadiusSimpleSmartAccount({ client, owner: walletClient });

    const signature = await account.signUserOperation({
      chainId: radius.id,
      sender: account.address,
      nonce: 0n,
      callData: '0x',
      callGasLimit: 100000n,
      verificationGasLimit: 100000n,
      preVerificationGas: 50000n,
      maxFeePerGas: 1000000000n,
      maxPriorityFeePerGas: 1000000000n,
      signature: '0x',
    });

    expect(account.address).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
    expect(signature).toHaveLength(132);
    expect(request).not.toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
    expect(request).not.toHaveBeenCalledWith({ method: 'eth_accounts' });
    expect(request).not.toHaveBeenCalledWith({ method: 'personal_sign' });
  });

  it('preserves EIP-1193 account discovery and signing', async () => {
    const owner = privateKeyToAccount(
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    );
    const request = jest.fn(async ({ method, params }: { method: string; params?: unknown[] }) => {
      if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
        return [owner.address];
      }
      if (method === 'personal_sign') {
        return owner.signMessage({ message: { raw: params?.[0] as `0x${string}` } });
      }
      throw new Error(`Unexpected RPC method: ${method}`);
    });
    const client = createPublicClient({ chain: radius, transport: custom({ request }) });

    const account = await toRadiusSimpleSmartAccount({
      client,
      owner: { request } as any,
    });
    const signature = await account.signUserOperation({
      chainId: radius.id,
      sender: account.address,
      nonce: 0n,
      callData: '0x',
      callGasLimit: 100000n,
      verificationGasLimit: 100000n,
      preVerificationGas: 50000n,
      maxFeePerGas: 1000000000n,
      maxPriorityFeePerGas: 1000000000n,
      signature: '0x',
    });

    expect(signature).toHaveLength(132);
    expect(request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
  });

  it('initializes the high-level SDK with a private key', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn(async (_input, init) => {
      const body = JSON.parse(init?.body as string);
      const result = body.method === 'eth_getCode' ? '0x1234' : '0x0';
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    try {
      const kit = new SbcAppKit({
        apiKey: 'sbc-test123456',
        chain: radius,
        privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        rpcUrl: 'http://localhost',
      });

      const account = await kit.getAccount();

      expect(account.address).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
