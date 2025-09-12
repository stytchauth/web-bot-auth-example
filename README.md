# Web Bot Auth Example

This project demonstrates Web Bot Auth using HTTP Message Signatures with Ed25519 keys.

Web Bot Auth is an emerging standard for agents, bots, and crawlers to identify themselves.
This project contains the code for [this walkthrough guide on how to implement Web Bot Auth signing](https://stytch.com/blog/how-to-implement-web-bot-auth-signing).

For more information, see our blog post: [Stytch supports Web Bot Auth for agent and bot verification](https://stytch.com/blog/stytch-supports-web-bot-auth).

## Getting started

This project was tested with Node v22.14.0 and should work with more recent versions of Node too.

Install dependencies: `npm install`

Then, run the following scripts in the workflow.

## Workflow

For a detailed explanation of the code, see [this walkthrough guide on how to implement Web Bot Auth signing](https://stytch.com/blog/how-to-implement-web-bot-auth-signing).

The project has been split into three separate scripts to handle the dependency on Pinggy:

### 1. Generate Keys (One-time setup)
```bash
npm run generate-keys
```
This generates Ed25519 key pairs and saves them as PEM files.
Only needs to be run once or when you want to regenerate keys.

### 2. Start Key Directory (JWKS) Server
```bash
npm run serve-jwks
```
This starts an Express server on port 3000 that serves the public key directory on `/.well-known/http-message-signatures-directory`.
This directory follows the format described in the draft proposal [HTTP Message Signatures Directory](https://datatracker.ietf.org/doc/draft-meunier-http-message-signatures-directory/).

### 3. Run Pinggy SSH Tunnel

[Pinggy](https://pinggy.io) is a service used to expose local ports to the public internet.
In this repo, it is required to expose your Signature-Agent key directory to the verifier.

In a separate terminal, run the Pinggy SSH command:
```bash
ssh -p 443 -R0:localhost:3000 free.pinggy.io
```
Copy the resulting Pinggy URL (e.g., `https://abcde-123-456-78-90.a.free.pinggy.link`).

### 4. Sign and Fetch
```bash
npm run sign-and-fetch <pinggy-url>
```
This creates the Web Bot Auth headers and tests that Stytch [IsAgent](https://isagent.dev) correctly verifies them.

Optionally, you can test directly against the Stytch API as well.
To do so, create a free Stytch account.
Then set your public token (available in the [dashboard](https://stytch.com/dashboard)) as the value of the environment variable `STYTCH_PUBLIC_TOKEN` before running the `sign-and-fetch` command above.

## Example Complete Workflow

```bash
# Terminal 1: Generate keys (one-time)
npm run generate-keys

# Terminal 1: Start key directory (JWKS) server
npm run serve-jwks

# Terminal 2: Start Pinggy tunnel
ssh -p 443 -R0:localhost:3000 free.pinggy.io
# Copy the URL from output, e.g.: https://abcde-123-456-78-90.a.free.pinggy.link

# Terminal 3: Make signed requests
npm run sign-and-fetch https://abcde-123-456-78-90.a.free.pinggy.link
```

## Files

- `crypto-utils.js` - Shared cryptographic utilities for key loading and JWK processing
- `generate-keys.js` - Key generation and management
- `serve-jwks.js` - Express server for key directory (JWKS)
- `sign-and-fetch.js` - Signature creation and signed HTTP requests
- `test-public-key.pem` - Generated public key (PEM format)
- `test-private-key.pem` - Generated private key (PEM format)

## Dependencies

[Pinggy](https://pinggy.io) is a service for exposing local ports to the public internet,
used to host the Signature-Agent key directory.

Javascript libraries:

- `jose` - Used for JSON Web Keys and related standards
- `express` - Web framework for Node.js
- `puppeteer` - Browser automation tool
