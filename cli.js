#!/usr/bin/env node
/**
 * SPV Envelope Tools - CLI
 * 
 * Usage:
 *   npx spv-envelope-tools create <txid>
 *   npx spv-envelope-tools verify <file.json>
 *   npx spv-envelope-tools address <address>
 */

const fs = require('fs');
const SPV = require('./spv.js');

async function create(txid) {
  console.log(`Creating SPV envelope for: ${txid}\n`);
  
  try {
    const envelope = await SPV.createEnvelope(txid);
    const filename = `envelope-${txid.substring(0, 8)}.json`;
    fs.writeFileSync(filename, JSON.stringify(envelope, null, 2));
    
    console.log(`✅ Envelope created`);
    console.log(`   TXID:   ${envelope.txid}`);
    console.log(`   Block:  #${envelope.blockHeight}`);
    console.log(`   Confs:  ${envelope.confirmations}`);
    console.log(`   Saved:  ${filename}`);
  } catch (e) {
    console.error(`❌ Failed: ${e.message}`);
    process.exit(1);
  }
}

async function verifyFile(file) {
  console.log(`Verifying: ${file}\n`);
  
  if (!fs.existsSync(file)) {
    console.error(`❌ File not found: ${file}`);
    process.exit(1);
  }
  
  try {
    const envelope = JSON.parse(fs.readFileSync(file, 'utf8'));
    const result = SPV.verify(envelope);
    
    console.log(`TXID Valid:     ${result.txidValid ? '✅' : '❌'}`);
    console.log(`Merkle Valid:   ${result.merkleValid ? '✅' : '❌'}`);
    console.log(`Header Valid:   ${result.headerValid ? '✅' : '❌'}`);
    console.log(`Checksum Valid: ${result.checksumValid ? '✅' : '❌'}`);
    console.log(`\n${result.valid ? '✅ VALID ENVELOPE' : '❌ INVALID'}`);
    
    if (result.errors.length > 0) {
      console.log(`\nErrors:`);
      result.errors.forEach(e => console.log(`  - ${e}`));
    }
    
    process.exit(result.valid ? 0 : 1);
  } catch (e) {
    console.error(`❌ Failed: ${e.message}`);
    process.exit(1);
  }
}

async function address(addr) {
  console.log(`Fetching UTXOs for: ${addr}\n`);
  
  try {
    const envelopes = await SPV.createEnvelopeForAddress(addr, {
      onError: (txid, err) => console.log(`  ⚠️  ${txid.substring(0, 8)}... - ${err.message}`)
    });
    
    if (envelopes.length === 0) {
      console.log('No UTXOs found');
      return;
    }
    
    const filename = `envelopes-${addr.substring(0, 8)}.json`;
    fs.writeFileSync(filename, JSON.stringify(envelopes, null, 2));
    
    console.log(`\n✅ Created ${envelopes.length} envelopes`);
    envelopes.forEach(e => {
      console.log(`   ${e.txid.substring(0, 8)}... vout:${e.vout} ${e.value} BSV`);
    });
    console.log(`\nSaved: ${filename}`);
  } catch (e) {
    console.error(`❌ Failed: ${e.message}`);
    process.exit(1);
  }
}

// Main
const [,, command, arg] = process.argv;

switch (command) {
  case 'create':
    if (!arg) { console.error('Usage: spv-envelope-tools create <txid>'); process.exit(1); }
    create(arg);
    break;
    
  case 'verify':
    if (!arg) { console.error('Usage: spv-envelope-tools verify <file.json>'); process.exit(1); }
    verifyFile(arg);
    break;
    
  case 'address':
    if (!arg) { console.error('Usage: spv-envelope-tools address <address>'); process.exit(1); }
    address(arg);
    break;
    
  default:
    console.log(`SPV Envelope Tools v${SPV.VERSION}

Usage:
  spv-envelope-tools create <txid>       Create envelope for transaction
  spv-envelope-tools verify <file>       Verify envelope JSON file
  spv-envelope-tools address <address>   Create envelopes for all UTXOs

Examples:
  spv-envelope-tools create abc123def456...
  spv-envelope-tools verify envelope-abc123.json
  spv-envelope-tools address 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
`);
}
