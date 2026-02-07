# SPV Envelope Tools

Offline BSV transaction tools. No server, no dependencies — runs entirely in your browser.

---

## Tools

### Generator `generator.html`

Generate SPV envelopes for confirmed BSV transactions.

**Modes:**
- **By TXID** — Single transaction lookup
- **By Address** — All UTXOs for an address
- **Bulk Addresses** — Multiple addresses at once

**Output:** Raw transaction, merkle proof, block header, block height

---

### Verifier `verifier.html`

Verify SPV envelopes completely offline.

**Input:** SPV envelope JSON  
**Output:** Transaction validity, merkle proof verification, block header validation

---

### Signer `signer.html`

Sign BSV transactions offline using SPV envelopes as proof of funds.

**Input:** SPV envelope, private key (WIF), destination address, amount  
**Output:** Signed raw transaction ready to broadcast

---

## Security Features

| Feature | Description |
|---------|-------------|
| **RFC 6979** | Deterministic signatures, cryptographically secure |
| **Transaction preview** | Confirm exact details before signing |
| **Network detection** | Warns if device is connected to internet |
| **Code integrity hash** | Verify you're running authentic code |
| **QR code output** | Broadcast via phone camera, no clipboard |
| **Key clearing** | Private key wiped from memory after signing |
| **Self-test on load** | Crypto functions verified before use |
| **Signature verification** | Verifies signature before output |

---

## Integrity Verification

Verify you're running authentic, untampered code:

**signer.html SHA-256:**
```
eecf1a37533889586bd81c9938a5c606795c16b5437cbe505c6d423af798f0ac
```

Compare with the hash displayed in the page footer. Click the footer hash to copy.

---

## Workflow

```
ONLINE     Generate SPV envelope (by TXID, address, or bulk)
              ↓
OFFLINE    Verify envelope (optional) → Sign transaction
              ↓
ONLINE     Broadcast via QR scan or whatsonchain.com/broadcast
```

---

## Use Cases

- **Cold storage** — Sign on an air-gapped machine
- **Disaster prep** — Spend coins when internet is intermittent
- **Compliance** — Cryptographic proof of UTXO ownership
- **Audit trails** — Verifiable transaction history
- **Bulk operations** — Generate envelopes for multiple addresses

---

## SPV Envelope Format

```json
{
  "txid": "abc123...",
  "rawTx": "0100000001...",
  "vout": 0,
  "satoshis": 100000,
  "proof": {
    "merkleRoot": "def456...",
    "txIndex": 5,
    "siblings": ["aaa...", "bbb...", "ccc..."]
  },
  "blockHeader": "00000020...",
  "blockHeight": 800000
}
```

---

## Cryptography

Pure JavaScript, zero dependencies:

- SHA-256, RIPEMD-160
- secp256k1 ECDSA
- RFC 6979 deterministic k
- BIP143 sighash

---

## Programmatic Use

```javascript
const SPV = require('./spv.js');

const envelope = await SPV.createEnvelope(txid);
const result = SPV.verify(envelope);
const envelopes = await SPV.createEnvelopeForAddress(address);
```

---

## Limitations

- Single UTXO per transaction (no coin selection)
- P2PKH addresses only (no P2SH/multisig)
- Mainnet only

---

## Security Best Practices

1. Verify the integrity hash before entering private keys
2. Disconnect from internet before signing
3. Use QR code output to avoid clipboard
4. Close browser tab after use
5. Test with small amounts first

---

## Audit Status

This code has not been independently audited. Review the source before use with significant funds.

---

## Links

[WhatsOnChain Broadcast](https://whatsonchain.com/broadcast) · [WhatsOnChain Explorer](https://whatsonchain.com) · [BSV Wiki](https://wiki.bitcoinsv.io)

---

MIT License
