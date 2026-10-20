# Longway / Jackspot Scripts

Batch wallet management scripts for the **Jacksport** contract on Wanchain (`chainId 888`, mainnet) and its testnet (`chainId 999`).

The scripts:

- Derive a batch of child wallets (`200` on mainnet, `60` on testnet) from a single BIP-39 mnemonic
- Distribute / collect WAN across the batch
- Buy lottery codes and redeem them in bulk
- Query user info and withdraw prizes

## Project layout

```
.
├── Libs/
│   ├── hWallet.ts        # thin wrapper around ethers.Wallet with safe transfer helpers
│   ├── crypto-tools.js   # AES-256-GCM encrypt/decrypt for secrets
│   └── t_crypto.js       # smoke test for crypto-tools
└── jackspot/
    ├── loadEnv.ts        # loads .env from project root (must be imported first)
    ├── config/           # index.ts is the network selector
    │   ├── index.ts      # chooses mainnet / testnet by NETWORK env
    │   ├── index_main.ts # mainnet config
    │   └── index_test.ts # testnet config
    ├── accounts/         # WalletMgr (derives the batch, leader = index 0)
    ├── JackSport.ts      # contract calls: buy / redeem / prizeWithdraw / userInfo
    ├── jacksportDelegate.json
    └── devOps/           # one-shot operational scripts, run individually
```

## Install

```bash
npm install
```

Requires Node.js 16+ and a TypeScript runner (`ts-node` is recommended).

## Configure

```bash
cp .env.example .env
# then edit .env and fill in the mnemonic
```

`.env` is git-ignored. **Never** commit it. The mnemonic controls every wallet the scripts ever derive, so leaking it means losing every asset on those addresses.

## Choose a network

`NETWORK` selects the configuration. **Default is `test`** (safe default — no real money spent).

```bash
NETWORK=test  npx ts-node jackspot/devOps/1_getAllBlance.ts   # safe
NETWORK=main  npx ts-node jackspot/devOps/1_getAllBlance.ts   # real funds
```

When `NETWORK=main` the script prints a clear warning banner before any operation.

## Run a script

The devOps scripts are one-shots, run individually:

| Script | Purpose |
|---|---|
| `1_getAllBlance.ts`        | Print balances of every derived wallet |
| `2_distributeWan.ts`       | Leader → 500.1 WAN to every other wallet |
| `3_collectWan.ts`          | All wallets → leader (clears balances) |
| `4_buy.ts`                 | Buy codes from each wallet (size overridden to 1) |
| `5_redeem.ts`              | Redeem codes from wallets `1..size-1` |
| `6_getUserInfo.ts`         | Print `userInfoMap` for every wallet |
| `7_prizeWithdraw.ts`       | Withdraw prize for wallet index `178` |
| `8_followWallet_send_Wan_to_Other.ts` | Send wallet `58`’s balance to the leader |
| `9_leader_to_others_some.ts`          | Leader → 500.1 WAN to wallets `85..129` |
| `a_buy_some.ts`            | Buy codes for wallets `85..129` |

Example:

```bash
NETWORK=test npx ts-node jackspot/devOps/2_distributeWan.ts
```

## Security

This project **directly controls on-chain funds**. Take these seriously:

- **Never commit `.env`.** A leaked mnemonic is unrecoverable — bots scan public Git/Gitee for mnemonics within minutes.
- **Keep `package-lock.json` in version control.** Without it, a supply-chain attack on `ethers` or any transitive dependency could read `.env` and exfiltrate the mnemonic on the next `npm install`.
- **Default is `test`.** Be explicit (`NETWORK=main`) whenever you mean to spend real WAN.
- **No re-entrancy guard, no dry-run.** Once a transaction is sent it cannot be reversed.
- **Validate addresses and amounts.** All fund-transferring code paths now validate the destination address (`ethers.utils.isAddress`) and reject negative or malformed amounts. Do not bypass these checks.

## Encryption helper (`Libs/crypto-tools.js`)

Used to encrypt the mnemonic (or any secret) at rest.

- Algorithm: **AES-256-GCM** (authenticated encryption)
- Key derivation: **scrypt** with a **random per-message salt**
- IV: **random 12 bytes per message**
- Output format: `salt | iv | authTag | ciphertext`, base64-encoded

Wrong password fails closed (throws) — never returns garbage.

## Dependencies

- `ethers` `^5.6.9` (v5 line)
- `dotenv` `^16.4.1`
- `@types/node` `^18.6.1`

Audit regularly:

```bash
npm run audit
```

## License

ISC
