import { NextResponse } from 'next/server';
import { getSbcAppKit } from '@/app/lib/sbc-server';
import { PublicClient } from 'viem';
import { SBC_TOKEN_ADDRESS, CHAIN } from '@/app/lib/common';

export async function GET() {
  const sbcApp = await getSbcAppKit();
  const account = await sbcApp.getAccount();
  const publicClient = sbcApp.getPublicClient();
  const ownerAddress = sbcApp.getOwnerAddress();

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

async function fetchSbcBalance(publicClient: PublicClient, address: string): Promise<string> {
  try {
    const balance = await publicClient.readContract({
      address: SBC_TOKEN_ADDRESS(CHAIN),
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
    }) as bigint;
    return balance.toString();
  } catch (e) {
    return '0';
  }
} 