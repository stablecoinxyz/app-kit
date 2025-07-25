import { NextResponse } from 'next/server';
import { getSbcAppKit } from '../../lib/sbc-server';
import { encodeFunctionData, Chain } from 'viem';
import { SBC_TOKEN_ADDRESS, CHAIN } from '@/app/lib/common';

const PERMIT_DURATION_SECONDS = 600;

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

export async function POST(request: Request) {
  try {
    const { toAddress, amount } = await request.json();
    if (!toAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: toAddress, amount' },
        { status: 400 }
      );
    }

    const sbcApp = await getSbcAppKit();
    const ownerAddress = sbcApp.getOwnerAddress();
    const account = await sbcApp.getAccount();
    const smartAccountAddress = account.address;
    // Use helper methods to get publicClient, walletClient, and config
    const publicClient = sbcApp.getPublicClient();
    const walletClient = sbcApp.getWalletClient();
    const config = sbcApp.getConfig();

    // Fetch balances (use correct ABI for balanceOf)
    const [smartAccountSbcBalance, ownerSbcBalance] = await Promise.all([
      publicClient.readContract({
        address: SBC_TOKEN_ADDRESS(CHAIN),
        abi: ERC20_ABI.balanceOf,
        functionName: 'balanceOf',
        args: [smartAccountAddress]
      }),
      publicClient.readContract({
        address: SBC_TOKEN_ADDRESS(CHAIN),
        abi: ERC20_ABI.balanceOf,
        functionName: 'balanceOf',
        args: [ownerAddress]
      })
    ]);

    // If smart account has enough, send simple transfer
    if (BigInt(smartAccountSbcBalance) >= BigInt(amount)) {
      const transferCallData = encodeFunctionData({
        abi: ERC20_ABI.transfer,
        functionName: 'transfer',
        args: [toAddress, BigInt(amount)]
      });
      const userOperation = await sbcApp.sendUserOperation({
        to: SBC_TOKEN_ADDRESS(CHAIN),
        data: transferCallData,
        value: '0',
      });
      return NextResponse.json({ userOperation });
    }

    // If owner has enough, build permit + transferFrom + transfer multicall
    if (BigInt(ownerSbcBalance) >= BigInt(amount)) {
      // Fetch nonce and token name
      const [nonce, tokenName] = await Promise.all([
        publicClient.readContract({
          address: SBC_TOKEN_ADDRESS(CHAIN),
          abi: ERC20_ABI.nonces,
          functionName: 'nonces',
          args: [ownerAddress]
        }),
        publicClient.readContract({
          address: SBC_TOKEN_ADDRESS(CHAIN),
          abi: ERC20_ABI.name,
          functionName: 'name',
          args: []
        })
      ]);
      const deadline = Math.floor(Date.now() / 1000) + PERMIT_DURATION_SECONDS;
      const domain = {
        name: tokenName,
        version: '1',
        chainId: config.chain.id,
        verifyingContract: SBC_TOKEN_ADDRESS(CHAIN),
      };
      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      };
      const values = {
        owner: ownerAddress,
        spender: smartAccountAddress,
        value: BigInt(amount),
        nonce: nonce,
        deadline: BigInt(deadline),
      };
      const signature = await walletClient.signTypedData({
        domain,
        types,
        primaryType: 'Permit',
        message: values,
      });
      const sig = {
        r: signature.slice(0, 66),
        s: '0x' + signature.slice(66, 130),
        v: parseInt(signature.slice(130, 132), 16),
      };
      const permitData = encodeFunctionData({
        abi: ERC20_ABI.permit,
        functionName: 'permit',
        args: [ownerAddress, smartAccountAddress, BigInt(amount), BigInt(deadline), sig.v, sig.r, sig.s]
      });
      const transferFromData = encodeFunctionData({
        abi: ERC20_ABI.transferFrom,
        functionName: 'transferFrom',
        args: [ownerAddress, smartAccountAddress, BigInt(amount)]
      });
      const finalTransferData = encodeFunctionData({
        abi: ERC20_ABI.transfer,
        functionName: 'transfer',
        args: [toAddress, BigInt(amount)]
      });
      const userOperation = await sbcApp.sendUserOperation({
        calls: [
          { to: SBC_TOKEN_ADDRESS(publicClient.chain as Chain), data: permitData, value: 0n },
          { to: SBC_TOKEN_ADDRESS(publicClient.chain as Chain), data: transferFromData, value: 0n },
          { to: SBC_TOKEN_ADDRESS(publicClient.chain as Chain), data: finalTransferData, value: 0n }
        ]
      });
      return NextResponse.json({ userOperation });
    }

    // If neither has enough, return error
    return NextResponse.json(
      { error: 'Insufficient SBC balance in both smart account and owner account.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to send transaction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 