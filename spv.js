/**
 * SPV Envelope Tools - Node.js Library
 * =====================================
 * Generate and verify SPV envelopes for BSV transactions.
 * Zero dependencies. Works in Node.js and browser.
 * 
 * @version 1.0.0
 * @license Open BSV License
 */

(function(global) {
  'use strict';

  // ============================================
  // SHA-256 Implementation (no dependencies)
  // ============================================
  const SHA256 = (function() {
    const K = new Uint32Array([
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ]);

    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    const ch = (x, y, z) => (x & y) ^ (~x & z);
    const maj = (x, y, z) => (x & y) ^ (x & z) ^ (y & z);
    const sigma0 = x => rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22);
    const sigma1 = x => rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25);
    const gamma0 = x => rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
    const gamma1 = x => rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10);

    function hash(message) {
      if (typeof message === 'string') message = new TextEncoder().encode(message);
      const msgLen = message.length;
      const totalLen = Math.ceil((msgLen + 9) / 64) * 64;
      const padded = new Uint8Array(totalLen);
      padded.set(message);
      padded[msgLen] = 0x80;
      const bitLen = msgLen * 8;
      const view = new DataView(padded.buffer);
      view.setUint32(totalLen - 8, 0, false);
      view.setUint32(totalLen - 4, bitLen, false);

      let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
      let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
      const W = new Uint32Array(64);

      for (let i = 0; i < padded.length; i += 64) {
        for (let j = 0; j < 16; j++) {
          W[j] = (padded[i + j*4] << 24) | (padded[i + j*4 + 1] << 16) | (padded[i + j*4 + 2] << 8) | padded[i + j*4 + 3];
        }
        for (let j = 16; j < 64; j++) W[j] = (gamma1(W[j-2]) + W[j-7] + gamma0(W[j-15]) + W[j-16]) >>> 0;

        let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
        for (let j = 0; j < 64; j++) {
          const t1 = (h + sigma1(e) + ch(e, f, g) + K[j] + W[j]) >>> 0;
          const t2 = (sigma0(a) + maj(a, b, c)) >>> 0;
          h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
        }
        h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
        h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
      }

      const result = new Uint8Array(32);
      const rv = new DataView(result.buffer);
      rv.setUint32(0, h0, false); rv.setUint32(4, h1, false); rv.setUint32(8, h2, false); rv.setUint32(12, h3, false);
      rv.setUint32(16, h4, false); rv.setUint32(20, h5, false); rv.setUint32(24, h6, false); rv.setUint32(28, h7, false);
      return result;
    }

    return { hash };
  })();

  // ============================================
  // Utility Functions
  // ============================================
  function hexToBytes(hex) {
    if (typeof hex !== 'string') throw new Error('Expected hex string');
    hex = hex.replace(/^0x/, '');
    if (hex.length % 2 !== 0) hex = '0' + hex;
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    return bytes;
  }

  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function reverseBytes(bytes) {
    return new Uint8Array(Array.from(bytes).reverse());
  }

  function reverseHex(hex) {
    return bytesToHex(reverseBytes(hexToBytes(hex)));
  }

  function sha256(data) {
    if (typeof data === 'string') data = hexToBytes(data);
    return SHA256.hash(data);
  }

  function hash256(data) {
    return sha256(sha256(data));
  }

  function hash256Hex(data) {
    if (typeof data === 'string') data = hexToBytes(data);
    return bytesToHex(reverseBytes(hash256(data)));
  }

  // ============================================
  // API Client
  // ============================================
  const API_BASE = 'https://api.whatsonchain.com/v1/bsv/main';
  const API_TIMEOUT = 15000;
  const API_DELAY = 350; // Rate limit: 3 req/sec

  async function apiGet(path) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    try {
      const response = await fetch(API_BASE + path, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (e) {
      clearTimeout(timeout);
      throw e;
    }
  }

  async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // Envelope Creation
  // ============================================
  async function createEnvelope(txid, options = {}) {
    if (!txid || typeof txid !== 'string' || txid.length !== 64) {
      throw new Error('Invalid txid: must be 64 hex characters');
    }

    // Fetch raw transaction
    const rawTxRes = await apiGet(`/tx/${txid}/hex`);
    const rawTx = await rawTxRes.text();
    
    await delay(API_DELAY);

    // Verify txid matches
    const computedTxid = hash256Hex(rawTx);
    if (computedTxid !== txid) {
      throw new Error(`TXID mismatch: computed ${computedTxid}, expected ${txid}`);
    }

    // Fetch merkle proof (TSC format)
    const proofRes = await apiGet(`/tx/${txid}/proof/tsc`);
    const proof = await proofRes.json();
    
    await delay(API_DELAY);

    // Fetch transaction details for block info
    const txRes = await apiGet(`/tx/hash/${txid}`);
    const txInfo = await txRes.json();
    
    await delay(API_DELAY);

    // Fetch block header
    const blockHash = txInfo.blockhash;
    const headerRes = await apiGet(`/block/${blockHash}/header`);
    const blockHeader = await headerRes.text();

    // Build envelope
    const envelope = {
      txid,
      rawTx,
      blockHash,
      blockHeader,
      blockHeight: txInfo.blockheight,
      confirmations: txInfo.confirmations,
      proof: {
        txOrId: proof.txOrId || txid,
        target: proof.target || blockHash,
        targetType: proof.targetType || 'header',
        nodes: proof.nodes || [],
        index: proof.index
      },
      proofFormat: 'TSC',
      archivedAt: new Date().toISOString()
    };

    // Add checksum
    envelope.checksum = computeChecksum(envelope);

    return envelope;
  }

  async function createEnvelopeForAddress(address, options = {}) {
    // Fetch UTXOs
    const utxosRes = await apiGet(`/address/${address}/unspent`);
    const utxos = await utxosRes.json();
    
    if (!utxos || utxos.length === 0) {
      return [];
    }

    const envelopes = [];
    for (const utxo of utxos) {
      await delay(API_DELAY);
      try {
        const envelope = await createEnvelope(utxo.tx_hash);
        envelope.vout = utxo.tx_pos;
        envelope.value = utxo.value / 100000000; // Satoshis to BSV
        envelopes.push(envelope);
      } catch (e) {
        if (options.onError) {
          options.onError(utxo.tx_hash, e);
        }
      }
    }

    return envelopes;
  }

  // ============================================
  // Envelope Verification
  // ============================================
  function verify(envelope) {
    const result = {
      valid: false,
      txidValid: false,
      merkleValid: false,
      headerValid: false,
      checksumValid: false,
      errors: []
    };

    try {
      // 1. Verify TXID matches rawTx
      const computedTxid = hash256Hex(envelope.rawTx);
      result.txidValid = computedTxid === envelope.txid;
      if (!result.txidValid) {
        result.errors.push(`TXID mismatch: computed ${computedTxid}, expected ${envelope.txid}`);
      }

      // 2. Verify Merkle proof
      const merkleRoot = computeMerkleRoot(envelope.txid, envelope.proof);
      const headerMerkleRoot = extractMerkleRoot(envelope.blockHeader);
      result.merkleValid = merkleRoot === headerMerkleRoot;
      if (!result.merkleValid) {
        result.errors.push(`Merkle root mismatch: computed ${merkleRoot}, header has ${headerMerkleRoot}`);
      }

      // 3. Verify block header hash
      const computedBlockHash = hash256Hex(envelope.blockHeader);
      result.headerValid = computedBlockHash === envelope.blockHash;
      if (!result.headerValid) {
        result.errors.push(`Block hash mismatch: computed ${computedBlockHash}, expected ${envelope.blockHash}`);
      }

      // 4. Verify checksum (if present)
      if (envelope.checksum) {
        const computed = computeChecksum(envelope);
        result.checksumValid = computed === envelope.checksum;
        if (!result.checksumValid) {
          result.errors.push('Checksum mismatch: file may be corrupted');
        }
      } else {
        result.checksumValid = true; // No checksum to verify
      }

      result.valid = result.txidValid && result.merkleValid && result.headerValid && result.checksumValid;

    } catch (e) {
      result.errors.push(e.message);
    }

    return result;
  }

  function computeMerkleRoot(txid, proof) {
    let current = hexToBytes(reverseHex(txid));
    let index = proof.index;

    for (const node of proof.nodes) {
      const isDuplicate = node === '*' || node === '';
      const sibling = isDuplicate ? current : hexToBytes(reverseHex(node));
      
      const combined = new Uint8Array(64);
      if (index & 1) {
        combined.set(sibling, 0);
        combined.set(current, 32);
      } else {
        combined.set(current, 0);
        combined.set(sibling, 32);
      }
      
      current = hash256(combined);
      index = index >> 1;
    }

    return bytesToHex(reverseBytes(current));
  }

  function extractMerkleRoot(blockHeader) {
    const bytes = hexToBytes(blockHeader);
    const merkleBytes = bytes.slice(36, 68);
    return bytesToHex(reverseBytes(merkleBytes));
  }

  function computeChecksum(envelope) {
    const data = envelope.txid + envelope.rawTx + envelope.blockHash + envelope.blockHeader;
    return bytesToHex(sha256(data)).substring(0, 16);
  }

  // ============================================
  // Block Header Parsing
  // ============================================
  function parseBlockHeader(headerHex) {
    const bytes = hexToBytes(headerHex);
    if (bytes.length !== 80) throw new Error('Invalid header: must be 80 bytes');

    const view = new DataView(bytes.buffer);
    
    return {
      version: view.getUint32(0, true),
      prevHash: bytesToHex(reverseBytes(bytes.slice(4, 36))),
      merkleRoot: bytesToHex(reverseBytes(bytes.slice(36, 68))),
      timestamp: view.getUint32(68, true),
      bits: view.getUint32(72, true),
      nonce: view.getUint32(76, true),
      hash: hash256Hex(headerHex)
    };
  }

  // ============================================
  // Export
  // ============================================
  const SPV = {
    VERSION: '1.0.0',
    
    // Main functions
    createEnvelope,
    createEnvelopeForAddress,
    verify,
    
    // Utilities
    parseBlockHeader,
    computeMerkleRoot,
    computeChecksum,
    
    // Low-level utils
    utils: {
      sha256: (data) => bytesToHex(sha256(data)),
      hash256: hash256Hex,
      hexToBytes,
      bytesToHex,
      reverseHex
    }
  };

  // Export for different environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPV;
  } else if (typeof define === 'function' && define.amd) {
    define(function() { return SPV; });
  } else {
    global.SPV = SPV;
  }

})(typeof window !== 'undefined' ? window : global);
