// Signature creation and API call
import puppeteer from 'puppeteer';
import { loadKeyPair } from './crypto-utils.js';

// Configuration
const API_URL = 'https://api.isagent.dev/is_agent';
const STYTCH_PUBLIC_TOKEN = process.env.STYTCH_PUBLIC_TOKEN;

async function calculateSignature(signatureBase, privateKey) {
  // Convert message to Uint8Array for signing
  const messageBytes = new TextEncoder().encode(signatureBase);

  // Sign using Ed25519 algorithm (EdDSA)
  const signature = await crypto.subtle.sign({name: 'Ed25519'}, privateKey, messageBytes);

  // Return as base64 (not base64url!)
  const signatureBase64 = Buffer.from(new Uint8Array(signature)).toString('base64');
  return signatureBase64;
}

async function createWebBotAuthHeaders(url, signatureAgent, publicJWK, privateKey) {
  // created / expires as Unix timestamps
  const now = Math.floor(Date.now() / 1000);
  const tomorrow = now + (24 * 60 * 60);

  // Use a random UUID for the nonce
  const nonce = crypto.randomUUID();

  // Extract hostname for @authority
  const urlObj = new URL(url);
  const authority = urlObj.hostname;

  // construct the @signature-params Inner List
  const signatureParams = [
    '("@authority" "signature-agent")',
    `keyid="${publicJWK.kid}"`,
    'alg="ed25519"',
    `created=${now}`,
    `expires=${tomorrow}`,
    `nonce="${nonce}"`,
    'tag="web-bot-auth"',
  ].join(';');

  // Create the message to sign
  const signatureBaseMessage = `"@authority": ${authority}
"signature-agent": "${signatureAgent}"
"@signature-params": ${signatureParams}`;

  // Sign the message
  const signature = await calculateSignature(signatureBaseMessage, privateKey);

  // Return the headers
  return {
    'Signature': `sig1=:${signature}:`,
    'Signature-Input': `sig1=${signatureParams}`,
    'Signature-Agent': `"${signatureAgent}"`,
  };
}

async function openIsAgentDevWithPuppeteer(signatureAgent, publicJWK, privateKey) {
  console.log('Testing with browser automation...')
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // sign every request and add the resulting headers
  await page.setRequestInterception(true);
  page.on('request', async interceptedRequest => {
    const oldHeaders = interceptedRequest.headers();
    const newHeaders = await createWebBotAuthHeaders(interceptedRequest.url(), signatureAgent, publicJWK, privateKey)
    interceptedRequest.continue({ headers: {oldHeaders, ...newHeaders} });
  });

  await page.goto('https://isagent.dev', { waitUntil: 'networkidle2' });
  console.log('🌐 Opened https://isagent.dev in Puppeteer.');
  await page.click('button')
  await page.waitForSelector('#api-response', { timeout: 5000 });
  const apiResponse = await page.$eval('#api-response', el => el.innerText);
  console.log('❓ Verification response:', apiResponse);
  if (apiResponse.includes("Self-declared agent | Verified")) {
    console.log('✅ Successfully verified!')
  }

  console.log()
  console.log("Script complete. You can run Ctrl-C to exit.")
}

async function main() {
  // Get signature agent URL from command line argument
  const signatureAgent = process.argv[2];

  if (!signatureAgent) {
    console.error('❌ Please provide the Pinggy URL as an argument:');
    console.error('   node sign-and-fetch.js <pinggy-url>');
    console.error('');
    console.error('Example:');
    console.error('   node sign-and-fetch.js https://abcdef-123-456-78-90.a.free.pinggy.link');
    process.exit(1);
  }

  console.log('🔑 Loading key pair...');
  let publicJWK, privateKey;
  try {
    const keyPair = await loadKeyPair();
    publicJWK = keyPair.publicJWK;
    privateKey = keyPair.privateKey;
  } catch (error) {
    console.error('❌ Error loading keys. Make sure to run "npm run generate-keys" first.');
    console.error(error.message);
    process.exit(1);
  }
  console.log(`📊 Using public key with thumbprint: ${publicJWK.kid}`);

  if (!STYTCH_PUBLIC_TOKEN) {
    console.log()
    console.log('🚫 No public token found in environment variables, skipping API check');
    console.log('✨ To enable API check, set STYTCH_PUBLIC_TOKEN environment variable to the value in the Stytch dashboard');
    console.log('🔗 Stytch dashboard: https://stytch.com/dashboard');
  } else {
    console.log('🔐 Creating Web Bot Auth headers...');
    const webBotAuthHeaders = await createWebBotAuthHeaders(API_URL, signatureAgent, publicJWK, privateKey);

    console.log('📡 Making API request...');
    console.log(`🌐 URL: ${API_URL}`);
    console.log(`🤖 Signature-Agent directory URL: ${signatureAgent}`);

    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({"public_token": STYTCH_PUBLIC_TOKEN}),
      headers: {
        'Content-Type': 'application/json',
        ...webBotAuthHeaders
      },
    });

    if (!response.ok) {
      console.error(`❌ API request failed with status: ${response.status}`);
      console.error(`Response: ${await response.text()}`);
      process.exit(1);
    }

    const data = await response.json();
    console.log('❓ API response:');
    console.log(JSON.stringify(data, null, 2));
    if (data.identity.includes("Self-declared agent | Verified")) {
      console.log('✅ Successfully verified!')
    }
  }

  console.log()
  await openIsAgentDevWithPuppeteer(signatureAgent, publicJWK, privateKey);
}

main().catch(console.error);
