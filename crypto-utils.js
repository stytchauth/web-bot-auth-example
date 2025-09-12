// Shared cryptographic utilities for key loading and JWK processing
import { exportJWK, importSPKI, importPKCS8, calculateJwkThumbprint } from 'jose';
import fs from 'fs/promises';

// File path constants
export const publicKeyFile = 'test-public-key.pem';
export const privateKeyFile = 'test-private-key.pem';

export async function loadKeyPair() {
  // Read the existing keys
  const publicKeyPEM = await fs.readFile(publicKeyFile, 'utf8');
  const privateKeyPEM = await fs.readFile(privateKeyFile, 'utf8');

  // Import the keys from PEM format
  const publicKey = await importSPKI(publicKeyPEM, 'Ed25519');
  const privateKey = await importPKCS8(privateKeyPEM, 'Ed25519', { extractable: true });

  // Convert public key to JWK for publishing
  const publicJWKFull = await exportJWK(publicKey);

  // Add recommended JOSE metadata
  const publicJWK = {
    ...publicJWKFull,
    kty: 'OKP',
    crv: 'Ed25519',
  };

  // Compute a stable kid (RFC 7638 thumbprint)
  publicJWK.kid = await calculateJwkThumbprint(publicJWK, 'sha256');

  return { publicJWK, privateKey };
}

export async function loadPublicKey() {
  // Read the existing public key
  const publicKeyPEM = await fs.readFile(publicKeyFile, 'utf8');

  // Import the key from PEM format
  const publicKey = await importSPKI(publicKeyPEM, 'Ed25519');

  // Convert public key to JWK for publishing
  const publicJWKFull = await exportJWK(publicKey);

  // Add recommended JOSE metadata
  const publicJWK = {
    ...publicJWKFull,
    kty: 'OKP',
    crv: 'Ed25519',
  };

  // Compute a stable kid (RFC 7638 thumbprint)
  publicJWK.kid = await calculateJwkThumbprint(publicJWK, 'sha256');

  return publicJWK;
}

export async function createPublicJWK(publicKey) {
  // Convert public key to JWK for publishing
  const publicJWKFull = await exportJWK(publicKey);

  // Add recommended JOSE metadata
  const publicJWK = {
    ...publicJWKFull,
    kty: 'OKP',
    crv: 'Ed25519',
  };

  // Compute a stable kid (RFC 7638 thumbprint)
  publicJWK.kid = await calculateJwkThumbprint(publicJWK, 'sha256');

  return publicJWK;
}
