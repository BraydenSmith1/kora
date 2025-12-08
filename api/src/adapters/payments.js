export class PaymentsAdapter {
  constructor(prisma){
    this.prisma = prisma;
  }

  async debit(userId, amountCents, ref){
    const w = await this._wallet(userId);
    const normalized = Number(amountCents) || 0;
    const newBalance = Number(w.balanceCents || 0) - normalized;
    await this.prisma.wallet.update({
      where: { id: w.id },
      data: { balanceCents: newBalance }
    });
    await this._log({
      direction: 'DEBIT',
      wallet: w,
      amountCents: normalized,
      newBalance,
      ref
    });
    return { txId: `mock_debit_${Date.now()}_${ref || ''}` };
  }

  async credit(userId, amountCents, ref){
    const w = await this._wallet(userId);
    const normalized = Number(amountCents) || 0;
    const newBalance = Number(w.balanceCents || 0) + normalized;
    await this.prisma.wallet.update({
      where: { id: w.id },
      data: { balanceCents: newBalance }
    });
    await this._log({
      direction: 'CREDIT',
      wallet: w,
      amountCents: normalized,
      newBalance,
      ref
    });
    return { txId: `mock_credit_${Date.now()}_${ref || ''}` };
  }

  async getBalance(userId){
    const w = await this._wallet(userId);
    return w.balanceCents;
  }

  async _wallet(userId){
    let w = await this.prisma.wallet.findUnique({ where: { userId } });
    if(!w){
      w = await this.prisma.wallet.create({ data: { userId, balanceCents: 0 } });
    }
    return w;
  }

  async _log({ direction, wallet, amountCents, newBalance, ref }){
    const payload = {
      walletId: wallet.id,
      userId: wallet.userId,
      amountCents,
      balanceCents: newBalance,
      direction,
      reference: ref || null,
      timestamp: new Date().toISOString()
    };
    await this.prisma.eventLog.create({
      data: {
        type: direction === 'DEBIT' ? 'PAYMENT_DEBIT' : 'PAYMENT_CREDIT',
        refId: wallet.userId,
        payload: JSON.stringify(payload)
      }
    });
  }
}
