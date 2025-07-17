import { NextResponse } from 'next/server';
import { getOwnerAddress } from '../../lib/sbc-server';

export async function GET() {
  try {
    const ownerAddress = getOwnerAddress();
    return NextResponse.json({ ownerAddress });
  } catch (error) {
    console.error('Failed to get owner address:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 