import React, { useCallback, useEffect, useMemo, useState } from 'react';

function formatUsdFromCents(cents){
  return (Number(cents || 0) / 100).toFixed(2);
}

const PERIOD_OPTIONS = [
  { value: 'current', label: 'This week' },
  { value: 'previous', label: 'Last week' },
  { value: 'all', label: 'All entries' }
];

export default function LedgerView({ api, refreshKey, explorerBase }){
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('current');
  const [expanded, setExpanded] = useState(new Set());

  const loadData = useCallback(async (requestedPeriod)=>{
    setLoading(true);
    setError('');
    try{
      const { data } = await api.get('/pilot/ledger', {
        params: { period: requestedPeriod, limit: 150 }
      });
      setEntries(data.entries || []);
    }catch(err){
      setError('Unable to load ledger. Try again after the API starts.');
    }finally{
      setLoading(false);
    }
  }, [api]);

  useEffect(()=>{
    loadData(period);
  }, [loadData, refreshKey, period]);

  const toggleRow = (id)=>{
    setExpanded(prev => {
      const next = new Set(prev);
      if(next.has(id)){
        next.delete(id);
      }else{
        next.add(id);
      }
      return next;
    });
  };

  const exportCsv = ()=>{
    if(!entries.length) return;
    const header = ['Date', 'Role', 'kWh', 'Price ($/kWh)', 'Value ($)', 'Status', 'Reference'];
    const rows = entries.map(entry => {
      const price = entry.priceCents !== null && entry.priceCents !== undefined
        ? (entry.priceCents / 100).toFixed(2)
        : '';
      const value = entry.valueCents !== null && entry.valueCents !== undefined
        ? formatUsdFromCents(entry.valueCents)
        : '';
      return [
        new Date(entry.createdAt).toISOString(),
        entry.role,
        entry.kwh !== null && entry.kwh !== undefined ? entry.kwh.toFixed(3) : '',
        price,
        value,
        entry.status,
        entry.refId || ''
      ].join(',');
    });
    const blob = new Blob([`${header.join(',')}\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ledger_${period}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const displayEntries = useMemo(()=> entries, [entries]);

  return (
    <section className="card">
      <div className="row row-between">
        <div>
          <h2>Ledger</h2>
          <p className="section-subtitle">Date-stamped records across surplus entries, trades, payments, and receipts.</p>
        </div>
        <div className="row" style={{ gap: '12px' }}>
          <select
            value={period}
            onChange={(event)=>setPeriod(event.target.value)}
            disabled={loading}
          >
            {PERIOD_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button type="button" className="pill" onClick={()=>loadData(period)} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button type="button" className="pill pill--ghost" onClick={exportCsv} disabled={!entries.length}>
            Export CSV
          </button>
        </div>
      </div>

      {error && <div className="alert" style={{ marginTop: 12 }}>{error}</div>}

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Role</th>
            <th>kWh</th>
            <th>Price ($/kWh)</th>
            <th>Value ($)</th>
            <th>Status</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7}><div className="empty-state">Loading ledger…</div></td></tr>
          ) : displayEntries.length ? (
            displayEntries.map(entry => {
              const isOpen = expanded.has(entry.id);
              const priceValue = entry.priceCents !== null && entry.priceCents !== undefined
                ? (entry.priceCents / 100).toFixed(2)
                : '—';
              const value = entry.valueCents !== null && entry.valueCents !== undefined
                ? formatUsdFromCents(entry.valueCents)
                : '—';
              const kwh = entry.kwh !== null && entry.kwh !== undefined
                ? entry.kwh.toFixed(3)
                : '—';
              return (
                <React.Fragment key={entry.id}>
                  <tr>
                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                    <td>{entry.role}</td>
                    <td>{kwh}</td>
                    <td>{priceValue}</td>
                    <td>{value}</td>
                    <td>{entry.status}</td>
                    <td>
                      <button type="button" className="pill pill--ghost" onClick={()=>toggleRow(entry.id)}>
                        {isOpen ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={7}>
                        <LedgerDetails entry={entry} explorerBase={explorerBase} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <tr><td colSpan={7}><div className="empty-state">Ledger is empty.</div></td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function LedgerDetails({ entry, explorerBase }){
  const reference = entry.refId || '—';
  const txHash = entry.txHash;
  const chainLink = txHash && explorerBase ? `${explorerBase}${txHash}` : null;

  return (
    <div className="ledger-details">
      <div>
        <strong>Reference:</strong> <span>{reference}</span>
      </div>
      {txHash && (
        <div>
          <strong>Polygon receipt:</strong>{' '}
          {chainLink ? (
            <a href={chainLink} target="_blank" rel="noreferrer">
              {txHash.slice(0, 10)}…
            </a>
          ) : (
            <span>{txHash.slice(0, 10)}…</span>
          )}
        </div>
      )}
      {entry.metadata?.error && (
        <div className="match-summary__error">
          {entry.metadata.error}
        </div>
      )}
      <details style={{ marginTop: 8 }}>
        <summary>Payload JSON</summary>
        <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', background: '#f5f8f6', padding: '12px', borderRadius: '12px' }}>
          {JSON.stringify(entry.payload, null, 2)}
        </pre>
      </details>
    </div>
  );
}
