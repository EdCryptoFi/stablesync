import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID, DEPLOYER_PUBKEY } from './constants';
import idlJson from './idl.json';

const idl = idlJson as unknown as Idl;

export function getProgram(provider: AnchorProvider): Program {
  return new Program(idl, provider);
}

export function getPositionPDA(
  owner: PublicKey,
  tokenAMint: PublicKey,
  tokenBMint: PublicKey,
  nonce: number | bigint,
): [PublicKey, number] {
  const nonceBuf = Buffer.alloc(8);
  nonceBuf.writeBigUInt64LE(BigInt(nonce));
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('position'),
      owner.toBuffer(),
      tokenAMint.toBuffer(),
      tokenBMint.toBuffer(),
      nonceBuf,
    ],
    new PublicKey(PROGRAM_ID),
  );
}

export function getConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('config'), new PublicKey(DEPLOYER_PUBKEY).toBuffer()],
    new PublicKey(PROGRAM_ID),
  );
}

export function getSessionKeyPDA(
  owner: PublicKey,
  keeper: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('session'), owner.toBuffer(), keeper.toBuffer()],
    new PublicKey(PROGRAM_ID),
  );
}
