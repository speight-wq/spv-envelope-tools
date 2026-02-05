# SPV Envelope Tools

Generate and verify SPV (Simplified Payment Verification) envelopes for BSV transactions. Prove your UTXOs exist on-chain without relying on any third-party service.

**Inspired by [Hashwrap](https://github.com/p2ppsr/hashwrap) by [Project Babbage](https://projectbabbage.com)**

## Why SPV Envelopes?

As BSV scales to massive block sizes, free UTXO lookups may disappear. Your private key proves you *own* a UTXO, but the Merkle proof proves it *exists* on the blockchain. Without both, you can't spend your coins in an SPV future.

An SPV envelope contains everything needed to cryptographically verify a transaction's inclusion in the blockchain:

- **Raw transaction** - The full transaction hex
- **Merkle proof** - Path through the Merkle tree to the root
- **Block header** - 80-byte header anchoring to the chain's proof-of-work

## Features

| Feature | Description |
|---------|-------------|
| **Address Lookup** | Enter any BSV address to fetch all UTXOs and their proofs |
| **TXID Lookup** | Generate envelope for a specific transaction |
| **Bulk Processing** | Process multiple addresses at once |
| **TSC Format Support** | Uses BSV Technical Standards Committee proof format |
| **Block Header Included** | Full 80-byte header for complete offline verification |
| **Offline Verifier** | Verify proofs with zero network calls |
| **Archive Timestamp** | Records when the envelope was generated |
| **Integrity Checksum** | SHA256 checksum to detect file corruption |

## Security

All tools prioritize security and work completely offline:

- **No Network Calls** - Generator is the only tool requiring internet (to fetch blockchain data). Verifier and Signer work 100% offline
- **RFC 6979 Signatures** - Deterministic ECDSA prevents nonce reuse vulnerabilities
- **Signature Verification** - Every signature is cryptographically verified before output
- **Memory Wiping** - Private keys cleared immediately after signing
- **Self-Testing** - Cryptographic functions validated on page load
- **No External Dependencies** - Pure JavaScript, no CDN imports
- **Open Source** - All code visible and auditable
- **Browser-Based** - No installation, no binaries, no trust in external executables

**Recommended Workflow for Maximum Security:**
1. Download all three HTML files to a USB drive
2. Use an air-gapped computer (never connected to internet)
3. Generate envelopes on an online machine
4. Transfer envelope JSON via USB to air-gapped machine
5. Sign transactions offline
6. Transfer signed transaction hex back via USB
7. Broadcast from online machine

## Tools Included

### 1. SPV Envelope Generator (`generator.html`)

A web-based tool to generate SPV envelopes. No installation required - just open in a browser.

**Modes:**
- **By Address** - Enter a BSV address, get proofs for all UTXOs
- **By TXID** - Enter a transaction ID directly
- **Bulk Addresses** - Paste multiple addresses (one per line)

**Usage:**
1. Open `generator.html` in any modern browser
2. Select Mainnet or Testnet
3. Enter address(es) or TXID
4. Click "Generate SPV Envelopes"
5. Download the JSON file

### 2. Offline Verifier (`verifier.html`)

Verify SPV envelopes with absolutely no network connection required.

**Verification Steps:**
1. ✓ `double-SHA256(rawTx)` matches `txid`
2. ✓ Merkle path computes to correct root
3. ✓ Merkle root matches bytes 36-68 of block header
4. ✓ `double-SHA256(blockHeader)` matches `blockHash`
5. ✓ Envelope checksum validates file integrity

**Usage:**
1. Disconnect from the internet (optional, but proves the point)
2. Open `verifier.html` in any browser
3. Drag & drop your envelope JSON or paste it
4. Click "Verify Envelope"
5. All green = cryptographically proven on-chain

### 3. Offline Transaction Signer (`signer.html`)

Sign BSV transactions completely offline using your SPV envelopes. Maximum security for cold storage.

**Security Features:**
- **RFC 6979 Deterministic Signatures** - No random number generation vulnerabilities
- **Signature Verification** - Every signature is verified before output
- **Key Cleared After Signing** - Private key wiped from memory immediately
- **Self-Test on Load** - Cryptographic functions validated before use
- **Completely Offline** - All operations local, no network calls
- **No External Dependencies** - Pure JavaScript implementation

**Workflow:**
1. **Online:** Generate SPV envelope for your UTXO
2. **Offline:** Open `signer.html`, disconnect from internet
3. Load your envelope JSON
4. Enter private key (WIF format)
5. Set destination address and amount
6. Sign transaction (key is immediately cleared)
7. Save the signed transaction hex
8. **Back Online:** Broadcast via WhatsOnChain or other service

**Usage:**
1. Open `signer.html` in any browser
2. Disconnect from internet for maximum security
3. Paste your SPV envelope
4. Enter private key (shown as password)
5. Specify destination and amount
6. Click "Sign Transaction"
7. Copy or download the signed transaction
8. Broadcast when back online

**What Gets Signed:**
The signer creates a standard P2PKH transaction spending your envelope UTXO. It automatically:
- Calculates transaction size and fees
- Creates proper scriptSig with signature + public key
- Generates deterministic signature using RFC 6979
- Verifies signature before presenting output
- Clears private key from memory

## Envelope Format

```json
{
  "txid": "03bf7421a392644...",
  "vout": 0,
  "rawTx": "01000000014814e0deb777...",
  "value": 0.00055602,
  "confirmations": 5466,
  "blockHeight": 927970,
  "blockHash": "00000000000000002244db6d81b3da8f37e2c26ef9c9a9d26b98c13f5140d733",
  "blockHeader": "0020482bcb8c95152f7b643d841aad9959c19d32305d5a18acddaf1d00000000...",
  "proof": {
    "txOrId": "03bf7421a392644...",
    "target": "00000000000000002244db6d81b3da8f37e2c26ef9c9a9d26b98c13f5140d733",
    "targetType": "header",
    "nodes": [
      "5cdf72b58e5215023c65594b869db86fca8fa24b7f23a50ed8e977b7dee01448",
      "4b255e8e6c614ce8bed4bb430d4ca96741db32a547fc4bd3aad4f0d1da9e9934",
      ...
    ],
    "index": 123
  },
  "hasProof": true,
  "proofFormat": "TSC",
  "archivedAt": "2026-01-26T12:34:56.789Z",
  "checksum": "a1b2c3d4e5f6789..."
}
```

## Field Reference

| Field | Description |
|-------|-------------|
| `txid` | Transaction ID (double-SHA256 of rawTx, reversed) |
| `vout` | Output index within the transaction |
| `rawTx` | Full transaction in hex |
| `value` | Output value in BSV |
| `confirmations` | Number of confirmations at archive time |
| `blockHeight` | Block number containing the transaction |
| `blockHash` | Hash of the block header |
| `blockHeader` | Raw 80-byte block header in hex |
| `proof.nodes` | Merkle path (sibling hashes) |
| `proof.index` | Transaction position in the block |
| `proof.target` | Block hash (TSC format) or merkle root |
| `proof.targetType` | `"header"` (TSC) or `"merkleRoot"` |
| `archivedAt` | ISO 8601 timestamp of envelope generation |
| `checksum` | SHA256 of core proof fields for integrity |

## API Used

This tool uses the [WhatsOnChain API](https://whatsonchain.com) for data retrieval:

- `/address/{address}/unspent` - Get UTXOs for an address
- `/tx/{txid}/hex` - Get raw transaction
- `/tx/{txid}/proof/tsc` - Get Merkle proof (TSC format)
- `/tx/hash/{txid}` - Get transaction details
- `/block/{hash}/header` - Get block header

**Rate Limits:** WhatsOnChain allows 3 requests/second for free. The tool includes built-in delays to respect this.

## Comparison with Hashwrap

| Feature | Hashwrap | SPV Envelope Tools |
|---------|----------|-------------------|
| TXID lookup | ✓ | ✓ |
| Address lookup | ✗ | ✓ |
| Bulk processing | ✗ | ✓ |
| TSC format fallback | ✗ | ✓ |
| 80-byte block header | ✗ | ✓ |
| Offline verifier | ✗ | ✓ |
| Offline transaction signer | ✗ | ✓ |
| RFC 6979 signatures | ✗ | ✓ |
| Archive timestamp | ✗ | ✓ |
| Integrity checksum | ✗ | ✓ |
| Node.js library | ✓ | ✓ |

## Use Cases

- **Cold Storage Backup** - Archive proofs for long-term holdings
- **Offline Transaction Signing** - Spend from cold storage without exposing keys online
- **Inscription Collections** - Prove ownership of NFTs/ordinals
- **Business Records** - Maintain verifiable transaction receipts
- **SPV Wallet Development** - Reference implementation for proof handling
- **Disaster Recovery** - Ensure you can always prove UTXO existence
- **Air-Gapped Security** - Sign transactions on isolated machines

## Browser Compatibility

Works in any modern browser with Web Crypto API support:
- Chrome 37+
- Firefox 34+
- Safari 11+
- Edge 12+

No external dependencies. No build step. Just HTML + JavaScript.

## License

Open BSV License - same as the original Hashwrap project.

## Credits

- [Project Babbage](https://projectbabbage.com) / [Ty Everett](https://github.com/ty-everett) - Original Hashwrap concept
- [WhatsOnChain](https://whatsonchain.com) - Blockchain API
- [BSV Technical Standards Committee](https://tsc.bsvblockchain.org) - Merkle proof format specification

## Contributing

Issues and PRs welcome. If you'd like to add features:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

**Potential enhancements:**
- Node.js CLI version | ✓ | Done
- Offline transaction signer | ✓ | Done
- npm package
- Multi-signature support
- Chain of headers for orphan detection
- Integration with popular BSV wallets
- Batch export in different formats
- Hardware wallet integration

---

*Built for the BSV community. Your keys, your coins, your proofs.*
