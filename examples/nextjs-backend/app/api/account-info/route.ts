import { NextResponse } from 'next/server';
import { getSbcAppKit } from '@/app/lib/sbc-server';
import { formatEther } from 'viem';

// SBC token address on baseSepolia
const SBC_TOKEN_ADDRESS = '0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16';

export async function GET() {
  const kit = await getSbcAppKit();
  const account = await kit.getAccount();
  const publicClient = kit.getPublicClient();
  const ownerAddress = kit.getOwnerAddress();

  console.log('Owner (EOA) address:', ownerAddress);
  console.log('Smart account address:', account.address);

  // Fetch balances for both EOA and Smart Account
  const [
    eoaEthBalance,
    eoaSbcBalance,
    smartAccountEthBalance,
    smartAccountSbcBalance
  ] = await Promise.all([
    // EOA balances
    publicClient.getBalance({ address: ownerAddress }),
    fetchSbcBalance(publicClient, ownerAddress),
    // Smart account balances
    publicClient.getBalance({ address: account.address }),
    fetchSbcBalance(publicClient, account.address)
  ]);

  return NextResponse.json({
    ...account,
    owner: {
      address: ownerAddress,
      ethBalance: eoaEthBalance.toString(),
      sbcBalance: eoaSbcBalance.toString(),
    },
    smartAccount: {
      address: account.address,
      ethBalance: smartAccountEthBalance.toString(),
      sbcBalance: smartAccountSbcBalance.toString(),
    }
  });
}

async function fetchSbcBalance(publicClient: any, address: string): Promise<string> {
  try {
    const balance = await publicClient.readContract({
      address: SBC_TOKEN_ADDRESS,
      abi: [
        {
          "constant": true,
          "inputs": [{ "name": "owner", "type": "address" }],
          "name": "balanceOf",
          "outputs": [{ "name": "balance", "type": "uint256" }],
          "type": "function"
        }
      ],
      functionName: 'balanceOf',
      args: [address],
    });
    return balance.toString();
  } catch (e) {
    return '0';
  }
} 