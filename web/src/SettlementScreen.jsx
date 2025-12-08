import React, { useCallback, useEffect, useState } from 'react';

function formatUsdFromCents(cents){
  return (Number(cents || 0) / 100).toFixed(2);
}

export default function SettlementScreen({ api, refreshKey, explorerBase }){
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async ()=>{
    setLoading(true);
    setError('');
    try{
      const { data } = await api.get('/pilot/settlement');
      setData(data);
    }catch(err){
      setError('Unable to load settlement data. Try again once the API is live.');
    }finally{
      setLoading(false);
    }
  }, [api]);

  useEffect(()=>{
    loadData();
  }, [loadData, refreshKey]);

  return (
    <section className="card">
      <div className="row row-between">
        <div>
          <h2>Settlement</h2>
          <p className="section-subtitle">Every executed trade with its ledger acknowledgement.</p>
        </div>
        <button type="button" className="pill" onClick={loadData} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <div className="alert" style={{ marginTop: '12px' }}>{error}</div>}

      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Seller → Buyer</th>
            <th>Qty kWh</th>
            <th>Price ($/kWh)</th>
            <th>Amount</th>
            <th>Receipt</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6}><div className="empty-state">Loading settlements…</div></td></tr>
          ) : data?.trades?.length ? (
            data.trades.map((trade)=>(
              <tr key={trade.id}>
                <td>{new Date(trade.createdAt).toLocaleString()}</td>
                <td>{trade.sellerName} → {trade.buyerName}</td>
                <td>{trade.quantityKwh.toFixed(2)}</td>
                <td>{(trade.priceCentsPerKwh / 100).toFixed(2)}</td>
                <td>${formatUsdFromCents(trade.amountCents)}</td>
                <td>
                  {trade.receipt?.txHash ? (() => {
                    const href = explorerBase ? `${explorerBase}${trade.receipt.txHash}` : null;
                    return href ? (
                      <a href={href} target="_blank" rel="noreferrer">
                        {trade.receipt.txHash.slice(0, 10)}…
                      </a>
                    ) : (
                      <span>{trade.receipt.txHash.slice(0, 10)}…</span>
                    );
                  })() : trade.receipt?.error ? (
                    <span className="match-summary__error">Error</span>
                  ) : (
                    <span>—</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={6}><div className="empty-state">Nothing settled yet.</div></td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
