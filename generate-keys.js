// Key generation and management
// npm i jose
import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose';
import fs from 'fs/promises';
import { loadKeyPair, createPublicJWK, publicKeyFile, privateKeyFile } from './crypto-utils.js';

async function readExistingKeyPair() {
  // File exists, read the existing keys
  console.log('Reading existing key pair from files');
  return await loadKeyPair();
}

async function generateNewKeyPair() {
  console.log('Generating new keypair and saving to separate files');

  const { publicKey, privateKey } = await generateKeyPair('Ed25519', {
    extractable: true
  });

  // Export keys in PEM format
  const publicKeyPEM = await exportSPKI(publicKey);
  const privateKeyPEM = await exportPKCS8(privateKey);

  // Save keys to separate files
  await fs.writeFile(publicKeyFile, publicKeyPEM);
  await fs.writeFile(privateKeyFile, privateKeyPEM);

  // Convert public key to JWK for publishing using shared utility
  const publicJWK = await createPublicJWK(publicKey);
  return { publicJWK, privateKey };
}

async function main() {
  try {
    const result = await readExistingKeyPair();
    console.log('✅ Keys loaded successfully');
    console.log('Public JWK Kid:', result.publicJWK.kid);
  } catch (error) {
    const result = await generateNewKeyPair();
    console.log('✅ New keys generated and saved');
    console.log('Public JWK Kid:', result.publicJWK.kid);
  }
}

main().catch(console.error);
