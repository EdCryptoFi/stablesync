import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Use frontend's node_modules
const anchor = require('../frontend/node_modules/@coral-xyz/anchor');
const { Connection, Keypair, PublicKey, SystemProgram } = require('../frontend/node_modules/@solana/web3.js');

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

  const idlPath = path.join(__dirname, '../program/idl/Project Title_idl.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));

  const wallet = new anchor.Wallet(deployer);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const program = new anchor.Program(idl, provider);

  console.log('Calling initialize_config...');
  const tx = await program.methods
    .initializeConfig(
      1000,
      deployer.publicKey,
      new anchor.BN(900),
      100,
      new anchor.BN(60),
    )
    .accounts({
      config: configPDA,
      authority: deployer.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: 'confirmed' });

  console.log('TX:', tx);
  console.log('Config initialized on devnet.');
}

main().catch(console.error);
