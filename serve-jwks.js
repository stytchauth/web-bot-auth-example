// JWKS server for serving public key directory
import express from 'express';
import { loadPublicKey } from './crypto-utils.js';

const port = process.env.PORT || 3000;

async function main() {
  console.log('🔑 Loading public key...');
  let publicJWK;
  try {
    publicJWK = await loadPublicKey();
  } catch (error) {
    console.error('❌ Error loading public key. Make sure to run "npm run generate-keys" first.');
    console.error(error.message);
    process.exit(1);
  }

  // Wrap into a JWKS and print it
  const jwks = { keys: [publicJWK] };
  console.log('📋 Public JWKS:');
  console.log(JSON.stringify(jwks, null, 2));

  const app = express();

  // Serve JWKS at the well-known HTTP Message Signatures Directory path
  app.get('/.well-known/http-message-signatures-directory', (req, res) => {
    res.setHeader('Content-Type', 'application/http-message-signatures-directory+json');
    res.json(jwks);
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', kid: publicJWK.kid });
  });

  // Start the server
  app.listen(port, () => {
    console.log(`🚀 JWKS server running at http://localhost:${port}/.well-known/http-message-signatures-directory`);
    console.log(`🔍 Health check available at http://localhost:${port}/health`);
    console.log(`📊 Public key ID: ${publicJWK.kid}`);
  });
}

main().catch(console.error);
