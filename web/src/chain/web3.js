// src/chain/web3.js
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./energyContract";

const AMOY_CHAIN_ID = "0x13882"; // 80002 in hex

export async function getProviderAndSigner() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  // Request accounts
  await window.ethereum.request({ method: "eth_requestAccounts" });

  // Ensure we're on Polygon Amoy
  const current = await window.ethereum.request({ method: "eth_chainId" });
  if (current !== AMOY_CHAIN_ID) {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: AMOY_CHAIN_ID }],
    });
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return { provider, signer };
}

export async function getContract(signerOrProvider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}