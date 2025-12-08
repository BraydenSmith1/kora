import { ethers } from 'ethers';

const TRADE_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'record',
    inputs: [
      { name: 'tradeId', type: 'bytes32' },
      { name: 'priceCentsPerKwh', type: 'uint256' },
      { name: 'quantityWh', type: 'uint256' },
      { name: 'amountCents', type: 'uint256' },
      { name: 'regionId', type: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'event',
    name: 'TradeRecorded',
    inputs: [
      { indexed: true, name: 'tradeId', type: 'bytes32' },
      { indexed: true, name: 'emitter', type: 'address' },
      { indexed: false, name: 'priceCentsPerKwh', type: 'uint256' },
      { indexed: false, name: 'quantityWh', type: 'uint256' },
      { indexed: false, name: 'amountCents', type: 'uint256' },
      { indexed: false, name: 'regionId', type: 'string' }
    ]
  }
];

export class ChainAdapter {
  constructor(prisma){
    this.prisma = prisma;
    const rpcUrl = process.env.CHAIN_RPC_URL;
    const privateKey = process.env.CHAIN_PRIVATE_KEY;
    const contractAddress = process.env.CHAIN_CONTRACT_ADDRESS;

    if(rpcUrl && privateKey && contractAddress){
      try{
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.signer = new ethers.Wallet(privateKey, this.provider);
        this.contract = new ethers.Contract(contractAddress, TRADE_REGISTRY_ABI, this.signer);
        this.enabled = true;
        this.chainIdPromise = this.provider.getNetwork().then(n => n.chainId).catch(() => null);
      }catch(err){
        console.error('[ChainAdapter] Failed to initialise on-chain client, falling back to mock mode:', err);
        this.enabled = false;
      }
    } else {
      this.enabled = false;
      console.warn('[ChainAdapter] Missing CHAIN_RPC_URL / CHAIN_PRIVATE_KEY / CHAIN_CONTRACT_ADDRESS — using mock logger.');
    }
  }

  async recordTrade(tradeId, payload){
    const serialized = (typeof payload === 'string') ? payload : JSON.stringify(payload);
    if(!this.enabled){
      const ev = await this.prisma.eventLog.create({
        data: { type: 'CHAIN_RECEIPT_MOCK', refId: tradeId, payload: serialized }
      });
      return { txHash: `mock_tx_${ev.id}`, mocked: true };
    }

    const priceCents = Number(payload.price ?? payload.priceCentsPerKwh ?? 0);
    const qtyKwh = Number(payload.qty ?? payload.quantityKwh ?? 0);
    const amountCents = Number(payload.amountCents ?? Math.round(qtyKwh * priceCents));
    const quantityWh = Math.max(0, Math.round(qtyKwh * 1000));
    const regionId = payload.regionId || '';
    const tradeKey = ethers.keccak256(ethers.toUtf8Bytes(tradeId));

    try{
      const tx = await this.contract.record(tradeKey, priceCents, quantityWh, amountCents, regionId);
      const receipt = await tx.wait();
      const chainIdBigInt = await this.chainIdPromise;
      const blockNumber = receipt.blockNumber !== null && receipt.blockNumber !== undefined
        ? receipt.blockNumber.toString()
        : null;
      const chainId = chainIdBigInt !== null && chainIdBigInt !== undefined
        ? chainIdBigInt.toString()
        : null;
      await this.prisma.eventLog.create({
        data: {
          type: 'CHAIN_RECEIPT',
          refId: tradeId,
          payload: JSON.stringify({
            payload,
            txHash: tx.hash,
            blockNumber,
            chainId,
            status: receipt.status !== undefined ? Number(receipt.status) : undefined
          })
        }
      });
      return { txHash: tx.hash, blockNumber, chainId };
    }catch(error){
      console.error('[ChainAdapter] recordTrade failed', error);
      await this.prisma.eventLog.create({
        data: {
          type: 'CHAIN_ERROR',
          refId: tradeId,
          payload: JSON.stringify({ payload, error: error?.message || String(error) })
        }
      });
      throw error;
    }
  }
}
