import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

const PROGRAM_ID = new PublicKey('7D4zRu6F77ryuNbAWFh27YtWxApD8PszWFLhY1gqXMK6');
const RPC = 'https://api.devnet.solana.com';

async function main() {
  const connection = new Connection(RPC, 'confirmed');

  const keypairPath = path.join(__dirname, '../program/target/wallet/wallet.json');
  const secret = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
  const deployer = Keypair.fromSecretKey(new Uint8Array(secret));

  console.log('Deployer:', deployer.publicKey.toBase58());

  const [configPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('config'), deployer.publicKey.toBuffer()],
    PROGRAM_ID,
  );
  console.log('Config PDA:', configPDA.toBase58());

  const existing = await connection.getAccountInfo(configPDA);
  if (existing) {
    console.log('Config already initialized. Done.');
    return;
  }

  const idl = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../program/idl/Project Title_idl.json'), 'utf-8'),
  );

  const wallet = new anchor.Wallet(deployer);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const program = new anchor.Program(idl, provider);

  const tx = await program.methods
    .initializeConfig(
      1000,                                // fee_bps: 10%
      deployer.publicKey,                  // treasury
      new anchor.BN(900),                  // min_rebalance_interval: 15 min
      100,                                 // max_slippage_bps: 1%
      new anchor.BN(60),                   // oracle_staleness_threshold: 60s
    )
    .accounts({
      config: configPDA,
      authority: deployer.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc({ commitment: 'confirmed' });

  console.log('initialize_config tx:', tx);
  console.log('Done. Config is live on devnet.');
}

main().catch(console.error);
