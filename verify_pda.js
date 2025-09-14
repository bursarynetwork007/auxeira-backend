const { PublicKey } = require('@solana/web3.js');

console.log('Your wallet address:', 'WILL_CHECK_IN_STEP_1');
console.log('Program ID:', 'J26bKBS2G41XUAKXFc8JXQSR1op2qwkhYojjvBNsSTeC');

const PROGRAM_ID = new PublicKey('J26bKBS2G41XUAKXFc8JXQSR1op2qwkhYojjvBNsSTeC');

async function verifyPDA() {
  try {
    const [mintAuthorityPDA, bump] = await PublicKey.findProgramAddress(
      [Buffer.from('mint_authority')],
      PROGRAM_ID
    );
    
    console.log('Calculated PDA:', mintAuthorityPDA.toBase58());
    console.log('Bump:', bump);
    console.log('Seeds used:', 'mint_authority');
  } catch (error) {
    console.error('Error calculating PDA:', error);
  }
}

verifyPDA();
