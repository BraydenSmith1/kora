// src/chain/energyContract.js
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

// Minimal ABI for the simple token you deployed earlier (name, symbol, mint, transfer, balanceOf, totalSupply)
export const CONTRACT_ABI = [
  { "inputs": [], "stateMutability": "view", "type": "function", "name": "name", "outputs": [{ "type": "string" }]},
  { "inputs": [], "stateMutability": "view", "type": "function", "name": "symbol", "outputs": [{ "type": "string" }]},
  { "inputs": [], "stateMutability": "view", "type": "function", "name": "totalSupply", "outputs": [{ "type": "uint256" }]},
  { "inputs": [{ "name": "owner", "type": "address" }], "stateMutability": "view", "type": "function", "name": "balanceOf", "outputs": [{ "type": "uint256" }]},
  { "inputs": [{ "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function", "name": "mint" },
  { "inputs": [{ "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function", "name": "transfer" },
  { "anonymous": false, "inputs": [
      { "indexed": true, "name": "from", "type": "address" },
      { "indexed": true, "name": "to", "type": "address" },
      { "indexed": false, "name": "value", "type": "uint256" }
    ], "name": "Transfer", "type": "event"
  }
];