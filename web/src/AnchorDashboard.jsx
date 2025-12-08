import React, { useCallback, useEffect, useState } from 'react';

function formatUsdFromCents(cents){
  return (Number(cents || 0) / 100).toFixed(2);
}

export default function AnchorDashboard({ api, refreshKey, onGlobalRefresh }){
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async ()=>{
    setLoading(true);
    setError('');
    try{
      const { data } = await api.get('/pilot/anchor');
      setData(data);
    }catch(err){
      setError('Unable to load anchor dashboard data. Confirm the API is online.');
    }finally{
      setLoading(false);
    }
  }, [api]);

  useEffect(()=>{
    loadData();
  }, [loadData, refreshKey]);

  const walletBalanceCents = data ? data.walletBalanceCents : 0;
  const balanceOwedCents = data ? data.balanceOwedCents : 0;
  const currentBuyPrice = data?.currentBuyPriceUsd !== null && data?.currentBuyPriceUsd !== undefined
    ? `$${data.currentBuyPriceUsd.toFixed(2)}`
    : loading ? '…' : 'Set by operator';

  const todaysPurchase = data?.energyPurchasedToday
    ? `${data.energyPurchasedToday.kwh.toFixed(2)} kWh · $${formatUsdFromCents(data.energyPurchasedToday.amountCents)}`
    : loading ? '…' : '0.00 kWh';

  const weeklySpend = data ? `$${formatUsdFromCents(data.weeklySpendCents)}` : loading ? '…' : '$0.00';

  const balanceMessage = balanceOwedCents > 0
    ? `Balance outstanding: $${formatUsdFromCents(balanceOwedCents)}`
    : 'Account is current.';

  return (
    <section className="card">
      <div className="row row-between">
        <div>
          <h2>Anchor dashboard</h2>
          <p className="section-subtitle">Monitor deliveries into the anchor load and outstanding spend.</p>
        </div>
        <button type="button" className="pill" onClick={loadData} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <div className="alert" style={{ marginTop: 12 }}>{error}</div>}

      <div className="stats-row">
        <div className="stat-block">
          <span className="stat-label">Buyer</span>
          <span className="stat-value">
            {data?.buyerName || (loading ? '…' : 'Anchor')}
          </span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Current buy price</span>
          <span className="stat-value">{currentBuyPrice}</span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Energy purchased today</span>
          <span className="stat-value">
            {data?.energyPurchasedToday ? `${data.energyPurchasedToday.kwh.toFixed(2)} kWh` : (loading ? '…' : '0.00 kWh')}
          </span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Weekly running cost</span>
          <span className="stat-value">{weeklySpend}</span>
        </div>
      </div>

      <div className="info-card" style={{ marginTop: 18 }}>
        <strong>Wallet status</strong>
        <p style={{ margin: '8px 0 0' }}>{balanceMessage}</p>
        <p style={{ margin: '4px 0 0' }}>
          Wallet balance: ${formatUsdFromCents(walletBalanceCents)} ({todaysPurchase} today)
        </p>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>Recent meter readings</h3>
        <table>
          <thead>
            <tr>
              <th>Logged</th>
              <th>Reading (kWh)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={2}><div className="empty-state">Loading readings…</div></td></tr>
            ) : data?.recentMeterReadings?.length ? (
              data.recentMeterReadings.map((reading)=>(
                <tr key={reading.id}>
                  <td>{new Date(reading.notedAt).toLocaleString()}</td>
                  <td>{reading.readingKwh.toFixed(2)} kWh</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={2}><div className="empty-state">No meter readings captured yet.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
