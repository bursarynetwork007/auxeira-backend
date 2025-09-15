import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaProgram } from "../target/types/solana_program";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaProgram as Program<SolanaProgram>;

  // Generate PDA for program state
  const [programState] = await anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("program_state")],
    program.programId
  );

  // Replace with your backend signer public key
  const signerPubkey = new anchor.web3.PublicKey("YOUR_SIGNER_PUBKEY");

  await program.methods
    .initializeProgram(signerPubkey)
    .accounts({
      programState: programState,
      authority: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("Program initialized successfully");
}

main().catch(console.error);
