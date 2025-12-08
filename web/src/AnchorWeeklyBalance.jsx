import React, { useCallback, useEffect, useState } from 'react';

function formatUsdFromCents(cents){
  return (Number(cents || 0) / 100).toFixed(2);
}

export default function AnchorWeeklyBalance({ api, refreshKey, onGlobalRefresh }){
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentUsd, setPaymentUsd] = useState('');
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState('');

  const loadData = useCallback(async ()=>{
    setLoading(true);
    setError('');
    try{
      const { data } = await api.get('/pilot/anchor/weekly-balance');
      setData(data);
    }catch(err){
      setError('Unable to load weekly balance. Try again shortly.');
    }finally{
      setLoading(false);
    }
  }, [api]);

  useEffect(()=>{
    loadData();
  }, [loadData, refreshKey]);

  async function handlePayment(event){
    event.preventDefault();
    const parsed = Number.parseFloat(paymentUsd);
    if(!Number.isFinite(parsed) || parsed <= 0){
      setStatus('Enter a payment amount in USD.');
      return;
    }
    setRecording(true);
    setStatus('');
    try{
      await api.post('/wallet/topup', { amountCents: Math.round(parsed * 100) });
      setPaymentUsd('');
      setStatus(`Recorded payment of $${parsed.toFixed(2)}.`);
      await loadData();
      onGlobalRefresh();
    }catch(err){
      const message = err?.response?.data?.error || err.message || 'Payment recording failed.';
      setStatus(message);
    }finally{
      setRecording(false);
    }
  }

  const purchases = data?.purchases || { amountCents: 0, kwh: 0 };
  const payments = data?.payments || { amountCents: 0, count: 0 };

  return (
    <section className="card">
      <div className="row row-between">
        <div>
          <h2>Weekly balance due</h2>
          <p className="section-subtitle">Review energy delivered versus payments received for the current week.</p>
        </div>
        <button type="button" className="pill" onClick={loadData} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <div className="alert" style={{ marginTop: 12 }}>{error}</div>}

      <div className="stats-row">
        <div className="stat-block">
          <span className="stat-label">Week start</span>
          <span className="stat-value">
            {data ? new Date(data.weekStart).toLocaleDateString() : loading ? '…' : '—'}
          </span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Purchases</span>
          <span className="stat-value">
            {data ? `${formatUsdFromCents(purchases.amountCents)} / ${purchases.kwh.toFixed(2)} kWh` : loading ? '…' : '$0.00'}
          </span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Payments logged</span>
          <span className="stat-value">
            {data ? `$${formatUsdFromCents(payments.amountCents)} (${payments.count})` : loading ? '…' : '$0.00'}
          </span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Remaining due</span>
          <span className="stat-value owed">
            ${data ? formatUsdFromCents(data.remainingDueCents) : loading ? '…' : '0.00'}
          </span>
        </div>
      </div>

      <div className="info-card" style={{ marginTop: 18 }}>
        <strong>Wallet balance</strong>
        <p style={{ margin: '8px 0 0' }}>
          Wallet: ${data ? formatUsdFromCents(data.walletBalanceCents) : loading ? '…' : '0.00'} ·
          Outstanding: ${data ? formatUsdFromCents(data.balanceOwedCents) : loading ? '…' : '0.00'}
        </p>
      </div>

      <form className="form-grid" style={{ marginTop: 18 }} onSubmit={handlePayment}>
        <label>
          <span>Record payment (USD)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={paymentUsd}
            onChange={(event)=>setPaymentUsd(event.target.value)}
            placeholder="50.00"
          />
        </label>
        <button type="submit" disabled={recording}>
          {recording ? 'Recording…' : 'Apply payment'}
        </button>
      </form>

      {status && (
        <div className="alert" style={{ marginTop: 16 }}>
          {status}
        </div>
      )}
    </section>
  );
}
