import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';

const DEVNET_RPC = 'https://api.devnet.solana.com';
const MINT_AMOUNT = 10_000 * 1_000_000; // 10,000 tokens with 6 decimals

const MINTS = {
  usdc: 'BZCSMV4ZaBMSUZnojhCnhYE5R919YN2b4U39JVEjnQzs',
  usdt: '2KrpCa2VCa9M1LVJn9Re43fyjVPCBgtUu87Z4kGdebvr',
  usds: 'HKgm8LzDNAk3skpu5yQYUjEfdSrkNX4Vsh3xPEQmD6fT',
};

// In-memory rate limit: ip → last claim timestamp
const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  const walletParam = req.nextUrl.searchParams.get('wallet');
  if (!walletParam) {
    return NextResponse.json({ error: 'Missing wallet parameter' }, { status: 400 });
  }

  let userPubkey: PublicKey;
  try {
    userPubkey = new PublicKey(walletParam);
  } catch {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const lastClaim = rateLimitMap.get(ip) ?? 0;
  const now = Date.now();
  if (now - lastClaim < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - (now - lastClaim)) / 1000);
    return NextResponse.json(
      { error: `Rate limited. Try again in ${remaining}s.`, retryAfter: remaining },
      { status: 429 },
    );
  }

  const keypairJson = process.env.DEPLOYER_KEYPAIR_JSON;
  if (!keypairJson) {
    return NextResponse.json({ error: 'Faucet not configured (missing DEPLOYER_KEYPAIR_JSON)' }, { status: 500 });
  }

  let deployer: Keypair;
  try {
    const secretKey = Uint8Array.from(JSON.parse(keypairJson) as number[]);
    deployer = Keypair.fromSecretKey(secretKey);
  } catch {
    return NextResponse.json({ error: 'Invalid deployer keypair configuration' }, { status: 500 });
  }

  const connection = new Connection(DEVNET_RPC, 'confirmed');
  const sigs: Record<string, string> = {};
  let solNote: string | undefined;

  try {
    // 1. SOL airdrop — best-effort, devnet public RPC has rate limits
    try {
      const solSig = await connection.requestAirdrop(userPubkey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(solSig, 'confirmed');
      sigs.sol = solSig;
    } catch {
      // SOL airdrop failed (rate limit) — continue with token minting
      solNote = 'SOL airdrop unavailable (devnet rate limit). Get SOL at https://faucet.solana.com';
    }

    // 2-4. Mint tokens
    for (const [symbol, mintAddress] of Object.entries(MINTS)) {
      const mint = new PublicKey(mintAddress);
      const ata = await getOrCreateAssociatedTokenAccount(
        connection,
        deployer,
        mint,
        userPubkey,
      );
      const sig = await mintTo(
        connection,
        deployer,
        mint,
        ata.address,
        deployer,
        MINT_AMOUNT,
      );
      sigs[symbol] = sig;
    }

    // Record successful claim
    rateLimitMap.set(ip, now);

    return NextResponse.json({ success: true, sigs, solNote });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Faucet error: ${message}` }, { status: 500 });
  }
}
