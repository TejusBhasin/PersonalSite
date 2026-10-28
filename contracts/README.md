# TejuCoin prototype

This directory holds an un-deployed Base Sepolia prototype. No keys, signing service, token contract address, or production deployment is configured.

## Current contract behavior

- ERC-20 interface: name, symbol, decimals, totalSupply, balanceOf, transfer, approve, allowance, and transferFrom.
- The deployer is the immutable creator.
- A direct transfer by the creator can mint precisely the shortfall to the creator before completing that transfer.
- Other holders cannot mint through transfer shortfalls.
- There is no maximum supply. The creator can therefore cause unlimited inflation by repeatedly transferring more than their balance. This must be explicitly approved as the intended economic rule and reviewed before any network deployment.

## Not implemented yet

Rewards and their eligibility rules were not present in the referenced conversation. A secure rewards backend, anti-abuse controls, gas sponsorship/paymaster, verified contract address, production deployment, and independent security audit are not configured. The UI intentionally has no reward-claim or transaction buttons.

## Verification

test/TejuCoin.t.sol contains Foundry-style test cases. They have not been compiled or run in this environment. Before testnet deployment, run the tests with a locally installed Foundry toolchain, review the contract behavior and economics, then deploy only to Base Sepolia using a dedicated test wallet. Do not use a production wallet or mainnet.
