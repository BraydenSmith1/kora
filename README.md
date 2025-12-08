
# Kora — Investor-Ready MVP

Includes:
- API (Express + Prisma + SQLite)
- Web (React + Vite + Analytics)
- Contracts (Solidity `TradeRegistry.sol`)

## Run

### API
```
cd api
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed           # optional
npm run dev
```
API: http://localhost:4000

### Web
```
cd web
npm install
npm run dev
```
Web: http://localhost:5173

## Blockchain (Polygon Amoy) Integration

The API now posts every matched trade to a deployed `TradeRegistry` contract. Configure both the server and the web client before running:

1. Deploy `contracts/TradeRegistry.sol` to Polygon Amoy (or another low-fee network) using your preferred tool (Hardhat, Foundry, Remix). Copy the contract address.
2. In `api/.env`, add:
   ```
   CHAIN_RPC_URL=https://rpc-amoy.polygon.technology
   CHAIN_PRIVATE_KEY=0x...            # signer that will submit trade receipts
   CHAIN_CONTRACT_ADDRESS=0x...       # deployed TradeRegistry address
   ```
   Then install dependencies (once the npm registry is reachable):
   ```
   cd api
   npm install
   ```
3. In `web/.env`, add:
   ```
   VITE_CONTRACT_ADDRESS=0x...        # same contract if the UI needs it
   VITE_TX_EXPLORER_BASE=https://amoy.polygonscan.com/tx/
   ```
4. With MetaMask connected to Polygon Amoy, run the API and web app. When you press **Run match**, successful trades will return transaction hashes linked to Polygonscan.
