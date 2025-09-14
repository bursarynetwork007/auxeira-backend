import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaProgram } from "../target/types/solana_program";

describe("solana-program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaProgram as Program<SolanaProgram>;

  it("Is initialized!", async () => {
    // Add your test here
    console.log("Program ID:", program.programId.toBase58());
  });
});
