const { PublicKey } = require('@solana/web3.js');

console.log('Your wallet address:', 'HR2uY8cDsPs9WisMu5Y4LCM4cRHmK2jqCgCh4pcC3jb5');
console.log('Program ID:', 'J26bKBS2G41XUAKXFc8JXQSR1op2qwkhYojjvBNsSTeC');

const PROGRAM_ID = new PublicKey('J26bKBS2G41XUAKXFc8JXQSR1op2qwkhYojjvBNsSTeC');

async function verifyPDA() {
  try {
    const [mintAuthorityPDA, bump] = await PublicKey.findProgramAddress(
      [Buffer.from('mint_authority')],
      PROGRAM_ID
    );
    
    console.log('Calculated PDA:', mintAuthorityPDA.toBase58());
    console.log('Current mint authority:', '79NoXUz9whkHbhGsse1giVrFHPmraqcFeudTLmsX5XFn');
    console.log('Bump:', bump);
    console.log('');
    
    if (mintAuthorityPDA.toBase58() === '79NoXUz9whkHbhGsse1giVrFHPmraqcFeudTLmsX5XFn') {
      console.log('✅ SUCCESS: Mint authority is correctly set to program PDA!');
      console.log('Your AUX token is ready for smart contract use.');
    } else {
      console.log('❌ MISMATCH: Need to transfer mint authority to the correct PDA.');
      console.log('Run this command:');
      console.log(`spl-token authorize 8C2V7JmNbmebeZR1pFhJjKVPgUFvrN22CMcqj92UutSg mint ${mintAuthorityPDA.toBase58()}`);
    }
  } catch (error) {
    console.error('Error calculating PDA:', error);
  }
}

verifyPDA();
