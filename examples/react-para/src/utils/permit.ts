import { hexToBytes, bytesToHex } from 'viem/utils';
import { hashTypedData, recoverAddress } from 'viem';

export type PermitTypedData = {
  domain: {
    name: string;
    version: string;
    chainId: bigint;
    verifyingContract: `0x${string}`;
  };
  types: {
    EIP712Domain: Array<{ name: string; type: string }>;
    Permit: Array<{ name: string; type: string }>;
  };
  message: {
    owner: `0x${string}`;
    spender: `0x${string}`;
    value: bigint;
    nonce: bigint;
    deadline: bigint;
  };
  primaryType: 'Permit';
};

export function buildPermitTypedData(params: {
  tokenName: string;
  chainId: number;
  tokenAddress: `0x${string}`;
  owner: `0x${string}`;
  spender: `0x${string}`;
  value: bigint;
  nonce: bigint;
  deadline: bigint;
}): PermitTypedData {
  const { tokenName, chainId, tokenAddress, owner, spender, value, nonce, deadline } = params;
  return {
    domain: {
      name: tokenName,
      version: '1',
      chainId: BigInt(chainId),
      verifyingContract: tokenAddress,
    },
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    primaryType: 'Permit',
    message: { owner, spender, value, nonce, deadline },
  } as const;
}

export function hashPermitTypedData(typed: PermitTypedData): `0x${string}` {
  return hashTypedData({
    domain: typed.domain,
    types: typed.types,
    primaryType: typed.primaryType,
    message: typed.message,
  } as any);
}

export function hex32ToBase64(hex: `0x${string}`): string {
  const bytes = hexToBytes(hex);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  // btoa is available in browsers
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function isHexStringLike(s: string): boolean {
  return /^[0-9a-fA-F]+$/.test(s);
}

export function normalizeSignatureToRSV(sig: string | { signatureBase64?: string; signature?: string }): {
  r: `0x${string}`;
  s: `0x${string}`;
  v: number;
} {
  let sigBytes: Uint8Array;
  if (typeof sig === 'string') {
    const trimmed = sig.trim();
    // Hex with 0x prefix
    if (trimmed.startsWith('0x')) {
      sigBytes = hexToBytes(trimmed as `0x${string}`);
    } else if (isHexStringLike(trimmed) && (trimmed.length === 128 || trimmed.length === 130)) {
      // Hex without 0x prefix
      sigBytes = hexToBytes(('0x' + trimmed) as `0x${string}`);
    } else {
      // Assume base64; if that decodes to ascii-hex, handle below
      const b = base64ToBytes(trimmed);
      // If decoded looks like ascii hex text, convert
      const asString = Array.from(b).every((c) => {
        const ch = String.fromCharCode(c);
        return /[0-9a-fA-Fx]/.test(ch);
      })
        ? String.fromCharCode(...b)
        : null;
      if (asString && (asString.startsWith('0x') || isHexStringLike(asString))) {
        const hexStr = asString.startsWith('0x') ? asString : '0x' + asString;
        sigBytes = hexToBytes(hexStr as `0x${string}`);
      } else {
        sigBytes = b;
      }
    }
  } else if (sig?.signatureBase64) {
    const b = base64ToBytes(sig.signatureBase64);
    // If ascii-hex, convert
    const isAsciiHex = Array.from(b).every((c) => /[0-9a-fA-Fx]/.test(String.fromCharCode(c)));
    if (isAsciiHex) {
      const s = String.fromCharCode(...b);
      const hexStr = s.startsWith('0x') ? s : '0x' + s;
      sigBytes = hexToBytes(hexStr as `0x${string}`);
    } else {
      sigBytes = b;
    }
  } else if (sig?.signature) {
    const s = sig.signature as string;
    if (s.startsWith('0x') || isHexStringLike(s)) {
      const hexStr = s.startsWith('0x') ? s : '0x' + s;
      sigBytes = hexToBytes(hexStr as `0x${string}`);
    } else {
      const b = base64ToBytes(s);
      const isAsciiHex = Array.from(b).every((c) => /[0-9a-fA-Fx]/.test(String.fromCharCode(c)));
      if (isAsciiHex) {
        const txt = String.fromCharCode(...b);
        const hexStr = txt.startsWith('0x') ? txt : '0x' + txt;
        sigBytes = hexToBytes(hexStr as `0x${string}`);
      } else {
        sigBytes = b;
      }
    }
  } else {
    throw new Error('Unsupported signature format from Para signMessage');
  }

  if (sigBytes.length === 65) {
    const r = bytesToHex(sigBytes.slice(0, 32)) as `0x${string}`;
    const s = bytesToHex(sigBytes.slice(32, 64)) as `0x${string}`;
    let v = sigBytes[64];
    if (v < 27) v += 27;
    return { r, s, v };
  }

  if (sigBytes.length === 64) {
    const rBytes = sigBytes.slice(0, 32);
    const yParityAndS = sigBytes.slice(32, 64);
    const yParity = (yParityAndS[0] & 0x80) ? 1 : 0;
    const sBytes = new Uint8Array(yParityAndS);
    sBytes[0] &= 0x7f;
    const r = bytesToHex(rBytes) as `0x${string}`;
    const s = bytesToHex(sBytes) as `0x${string}`;
    const v = 27 + yParity;
    return { r, s, v };
  }

  // Try DER decoding (ASN.1), common in raw ECDSA flows
  if (sigBytes[0] === 0x30) {
    // Structure: 0x30 len 0x02 rLen r 0x02 sLen s
    let offset = 2;
    if (sigBytes[1] & 0x80) {
      // long-form length, skip
      const lenOfLen = sigBytes[1] & 0x7f;
      offset = 2 + lenOfLen;
    }
    if (sigBytes[offset] !== 0x02) throw new Error('Invalid DER signature (missing r)');
    const rLen = sigBytes[offset + 1];
    const rStart = offset + 2;
    const rEnd = rStart + rLen;
    const rRaw = sigBytes.slice(rStart, rEnd);
    offset = rEnd;
    if (sigBytes[offset] !== 0x02) throw new Error('Invalid DER signature (missing s)');
    const sLen = sigBytes[offset + 1];
    const sStart = offset + 2;
    const sEnd = sStart + sLen;
    const sRaw = sigBytes.slice(sStart, sEnd);
    // left-pad to 32 bytes
    const r = bytesToHex(leftPad32(rRaw)) as `0x${string}`;
    const s = bytesToHex(leftPad32(sRaw)) as `0x${string}`;
    // v unknown; set 0 to let caller derive via recover
    return { r, s, v: 0 };
  }

  throw new Error(`Unexpected signature length: ${sigBytes.length}`);
}

function leftPad32(src: Uint8Array): Uint8Array {
  if (src.length === 32) return src;
  const out = new Uint8Array(32);
  out.set(src, 32 - src.length);
  return out;
}

export async function deriveVForRS(params: {
  digest: `0x${string}`;
  r: `0x${string}`;
  s: `0x${string}`;
  owner: `0x${string}`;
}): Promise<number> {
  const { digest, r, s, owner } = params;
  // Try both parities
  for (const v of [27n, 28n]) {
    try {
      const addr = await recoverAddress({ hash: digest, signature: { r, s, v } });
      if (addr.toLowerCase() === owner.toLowerCase()) return Number(v);
    } catch {}
  }
  throw new Error('Failed to derive v that recovers owner');
}


