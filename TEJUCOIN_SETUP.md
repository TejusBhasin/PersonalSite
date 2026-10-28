# TejuCoin: Mac setup and launch guide

This repository branch contains an unfinished, testnet-only prototype. The site page is at /teju; the navigation link is intentionally omitted so visitors need the URL. This is link discoverability only: the route is still public to anyone who knows or guesses it. It is not password protection, access control, or confidentiality.

## Current state and guardrails

- The Base44 app's main branch and live custom-domain site have not been changed. Work remains on a separate Base44 preview branch / GitHub review branch.
- The TejuCoin page can connect an injected browser wallet and can read a balance only if a contract address is configured. There is no deployed token address, transfer flow, claim flow, or rewards action.
- The Solidity contract is an early prototype. Its creator can mint the exact shortfall whenever the creator transfers more than their balance. There is no supply cap, so repeated creator transfers can create unlimited inflation. Do not deploy this design until the token economics are deliberately accepted and the contract is reviewed.
- Reward rules, eligibility, anti-abuse controls, and user account requirements are unspecified. No reward backend exists.
- No gas sponsorship provider, API credentials, contract audit, mainnet deployment, domain change, or production publish has been performed.
- The Foundry tests are written but were not compiled or run in the original environment.
- Do not put seed phrases, private keys, API secrets, recovery codes, or passcodes in GitHub, Base44 client code, screenshots, or chat. Use a dedicated test wallet and a password manager. Never use a primary wallet's recovery phrase for app development.

## What you need before anything goes live

Decide these items in writing before implementing rewards or deploying:
1. Whether the token is only a test/demo token or will have a real public use.
2. Whether creator shortfall minting is truly intended; if so, the maximum supply, mint limits, monitoring, and emergency controls. If not, replace it with a capped or fixed supply design.
3. The reward rules: who qualifies, eligible actions, reward amount, daily/total limits, cooldowns, geographic or age restrictions if any, abuse handling, and how a user can appeal.
4. Whether rewards are on-chain or recorded off-chain, who pays gas, and what personal data is collected.
5. Whether /teju should be merely unlisted or actually private. For privacy, add real authentication and authorization at the server; hiding a menu item is not protection.
6. Who will independently review the contract and the reward service before any public launch.

## Phase 1 — open and inspect the GitHub work

1. On your Mac, open the repository page and select the tejuc-project branch. The main branch is the existing personal site and must remain untouched while reviewing this work.
2. Read contracts/README.md, contracts/src/TejuCoin.sol, contracts/test/TejuCoin.t.sol, src/pages/TejuCoin.jsx, and this guide.
3. Confirm the header has no TEJUCOIN item in its desktop or mobile navigation. Confirm the React route still points to /teju.
4. If you prefer to work locally, open Terminal and run:
   ```sh
   cd ~/Documents
   git clone https://github.com/TejusBhasin/PersonalSite.git
   cd PersonalSite
   git fetch origin
   git switch tejuc-project
   ```
   If the folder already exists, use cd /path/to/PersonalSite, then git fetch origin && git switch tejuc-project; do not clone over an existing folder.
5. Install the project's existing Node version and dependencies according to its package.json and lockfile. From the repository folder, run npm install only if there is no lockfile; otherwise use the package manager and frozen/CI install command indicated by the lockfile.
6. Run the normal local preview command listed under scripts in package.json (often npm run dev). This is a local preview and does not publish the site.
7. Visit the local /teju route. Check desktop and mobile navigation, wallet-not-connected state, and the testnet warning. Without a real configured test contract, the balance should be blank/dash and no token action should be possible.

## Phase 2 — compile and test the contract locally

1. Install Foundry from its official installation instructions, then restart Terminal if the installer asks.
2. In the repository, enter the contract folder: cd contracts.
3. Initialize Foundry config if it is absent. Pin the compiler to Solidity 0.8.24 or a reviewed compatible version and commit the configuration and lockfile.
4. Compile first with forge build. Resolve compiler errors before proceeding.
5. Run tests with forge test -vv. Confirm tests for creator shortfall minting, ordinary transfers, and non-creator shortfall rejection all pass.
6. Add tests for zero addresses, approvals, transferFrom, allowance exhaustion, self-transfer, overflow boundaries, events, and any chosen supply controls. The current test file is not a complete audit.
7. Have an independent Solidity reviewer inspect the exact source and test results. Tests prove only the cases encoded in them; they do not prove security or safe token economics.

Do not deploy the current uncapped token to mainnet. If a testnet experiment is later authorized, use a newly created Base Sepolia-only test wallet, keep the seed offline, and fund it only with test ETH. Never paste its seed/private key into repository files or browser code.

## Phase 3 — build a secure rewards service

Do not implement this until the reward rules above are finalized. The correct design should:
1. Authenticate a user with a supported identity provider and verify identity on the server.
2. Keep provider credentials and signing secrets in Base44's server-side secret store, never in Vite VITE_* variables or browser JavaScript.
3. Validate each reward action on the server against authoritative evidence; do not trust an amount, wallet, completion flag, or eligibility claim sent by the browser.
4. Add idempotency keys, per-user and global rate limits, replay protection, fraud review, audit logs, and a way to reverse or freeze pending rewards.
5. Enforce daily and lifetime caps server-side and in the contract. Return a clear, non-sensitive status to the browser.
6. If on-chain rewards are required, use a narrowly scoped signer or audited claim contract, protect signing credentials, and define recovery/revocation procedures.
7. Write unit/integration tests for authorization failures, duplicate claims, rate limits, invalid wallet ownership, and service outages before connecting the UI.

## Phase 4 — optional gas sponsorship

Gas sponsorship is a separate provider integration and may require billing. Do not sign up, accept service terms, or add a payment method until you review the current price, limits, and terms yourself.
1. Select a provider that supports the chosen Base network and the exact transaction types.
2. Create the provider project using your own account and review its terms and pricing.
3. Store the API key only as a server-side secret. Browser code may use only provider-approved public identifiers; never expose a secret key in a VITE_ environment variable.
4. Add origin restrictions, rate limits, per-user quotas, alerting, and a hard monthly spend cap before enabling sponsorship.
5. Test on testnet first. Confirm wallet rejection, duplicate requests, quota exhaustion, and provider outage behavior.
6. Keep an unsponsored user-paid path only if the product requirements and user experience clearly explain network fees.

## Phase 5 — Base44 preview integration

1. In Base44, open the existing Tejus Bhasin app and select the TejuCoin working branch, not the main/live branch.
2. Confirm the page changes and no-navigation change are visible in the preview. Keep the page at /teju.
3. Confirm all repository changes are synced to the intended Base44 branch. Do not merge branches or choose a production/publish action during preview work.
4. Add a contract address only after a reviewed contract has been deployed to Base Sepolia. Treat the address as public configuration; keep signing keys out of frontend config.
5. Use a test wallet and verify the UI reads the exact testnet address and balance. Test with no wallet, rejected wallet connect, wrong network, unavailable RPC, and unset address.
6. Do not enter secrets in the Base44 page editor or client-side environment variables. Configure server-side secrets only after confirming the correct app and branch.

## Phase 6 — private access, if required

Removing the menu entry only removes a shortcut. Anyone with the URL can still open /teju. If you need actual restricted access:
1. Add authentication and an explicit server-side authorization rule for approved users.
2. Protect both the page data and every backend function; hiding or redirecting the frontend alone is insufficient.
3. Test logged-out, unauthorized, authorized, and revoked-user states.
4. Decide whether search-engine indexing should be disabled, but do not treat noindex as access control.

## Phase 7 — final review and release checklist

Before any deployment or publish action, personally approve each production-impacting step:
- [ ] Requirements and token economics are final; unlimited minting is either explicitly accepted with limits or removed.
- [ ] Independent contract review is complete and findings are fixed.
- [ ] Contract and backend tests pass in CI and locally.
- [ ] Rewards eligibility and fraud controls are approved and tested.
- [ ] Secrets are stored server-side and rotated where needed.
- [ ] Any provider cost, terms, quota, and spend cap are reviewed.
- [ ] Testnet deployment is verified and the address is checked on the explorer.
- [ ] Wallet-connect and error cases have been tested on supported browsers/devices.
- [ ] Actual access control is in place if the page must be private.
- [ ] A Base44 preview is reviewed before an explicit production publish.
- [ ] A rollback/export backup is prepared.
- [ ] The exact production publish, contract deployment, and any DNS changes are explicitly approved.

## What “up and running” means here

At present, “up” means a reviewable website and contract prototype on a development branch. It does not mean users can earn or transfer a live token. The remaining work depends on product decisions, a testnet deployment, secure backend development, optional paid sponsorship, an independent audit, and a separately approved production release. The current branch can be reviewed without changing the live site.
