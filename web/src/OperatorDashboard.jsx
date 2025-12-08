import React, { useCallback, useEffect, useMemo, useState } from 'react';

function formatUsdFromCents(cents){
  return (Number(cents || 0) / 100).toFixed(2);
}

export default function OperatorDashboard({ api, refreshKey, onGlobalRefresh }){
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [generated, setGenerated] = useState('');
  const [localLoad, setLocalLoad] = useState('');
  const [recordingSurplus, setRecordingSurplus] = useState(false);
  const [surplusStatus, setSurplusStatus] = useState('');
  const [surplusSummary, setSurplusSummary] = useState(null);

  const loadData = useCallback(async ()=>{
    setLoading(true);
    setError('');
    try{
      const { data } = await api.get('/pilot/operator');
      setData(data);
      if(data?.currentPriceUsd && !priceUsd){
        setPriceUsd(data.currentPriceUsd.toFixed(2));
      }
    }catch(err){
      setError('Unable to load operator dashboard data. Confirm the API is running.');
    }finally{
      setLoading(false);
    }
  }, [api, priceUsd]);

  useEffect(()=>{
    loadData();
  }, [loadData, refreshKey]);

  useEffect(()=>{
    if(!statusMessage) return;
    const timer = setTimeout(()=>setStatusMessage(''), 4000);
    return ()=>clearTimeout(timer);
  }, [statusMessage]);
  useEffect(()=>{
    setSurplusStatus('');
    setSurplusSummary(null);
  }, [refreshKey]);

  const surplusKwh = useMemo(()=>{
    const g = Number.parseFloat(generated);
    const l = Number.parseFloat(localLoad);
    if(!Number.isFinite(g) || !Number.isFinite(l)) return 0;
    return Math.max(0, g - l);
  }, [generated, localLoad]);

  async function handlePriceSubmit(event){
    event.preventDefault();
    const parsed = Number.parseFloat(priceUsd);
    if(!Number.isFinite(parsed) || parsed <= 0){
      setStatusMessage('Enter a valid price (USD per kWh).');
      return;
    }
    setSavingPrice(true);
    try{
      await api.post('/pilot/operator/price', { priceUsd: parsed });
      setStatusMessage(`Price updated to $${parsed.toFixed(2)} per kWh.`);
      await loadData();
      onGlobalRefresh();
    }catch(err){
      setStatusMessage(err?.response?.data?.error || 'Could not update price. Try again.');
    }finally{
      setSavingPrice(false);
    }
  }

  async function handleSurplusSubmit(event){
    event.preventDefault();
    const g = Number.parseFloat(generated);
    const l = Number.parseFloat(localLoad);
    if(!Number.isFinite(g) || !Number.isFinite(l)){
      setSurplusStatus('Enter numeric values for production and local load.');
      return;
    }
    setRecordingSurplus(true);
    setSurplusStatus('');
    setSurplusSummary(null);
    try{
      const { data } = await api.post('/pilot/operator/surplus', {
        generatedKwh: g,
        localLoadKwh: l
      });
      setSurplusSummary(data);
      setSurplusStatus(`Recorded ${data.surplusKwh.toFixed(2)} kWh of surplus at $${(data.priceCents / 100).toFixed(2)} per kWh.`);
      setGenerated('');
      setLocalLoad('');
      await loadData();
      onGlobalRefresh();
    }catch(err){
      setSurplusStatus(err?.response?.data?.error || 'Could not record surplus. Try again.');
    }finally{
      setRecordingSurplus(false);
    }
  }

  const todaysMessage = (() => {
    if(!data?.todaysSales) return '';
    if(data.todaysSales.kwh <= 0) return 'No energy sold yet today.';
    return `${data.todaysSales.kwh.toFixed(2)} kWh sold to ${data.anchorName || 'anchor'} today for $${formatUsdFromCents(data.todaysSales.amountCents)}.`;
  })();

  return (
    <section className="card">
      <div className="row row-between">
        <div>
          <h2>Operator dashboard</h2>
          <p className="section-subtitle">
            {data?.microgridName || 'Microgrid'} · {data?.anchorName ? `Anchor: ${data.anchorName}` : 'Single-buyer pilot'}
          </p>
        </div>
        <button type="button" className="pill" onClick={loadData} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <div className="alert" style={{ marginTop: 12 }}>{error}</div>}

      <div className="stats-row">
        <div className="stat-block">
          <span className="stat-label">Current sell price</span>
          <span className="stat-value">
            {data?.currentPriceUsd !== null && data?.currentPriceUsd !== undefined
              ? `$${data.currentPriceUsd.toFixed(2)}`
              : loading ? '…' : 'Set price'}
          </span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Surplus logged today</span>
          <span className="stat-value">
            {data ? data.surplusTodayKwh.toFixed(2) : loading ? '…' : '0.00'} kWh
          </span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Energy sold this week</span>
          <span className="stat-value">
            {data ? data.energySoldWeekKwh.toFixed(2) : loading ? '…' : '0.00'} kWh
          </span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Week revenue</span>
          <span className="stat-value">
            ${data ? formatUsdFromCents(data.energySoldWeekValueCents) : loading ? '…' : '0.00'}
          </span>
        </div>
      </div>

      <form className="form-grid" onSubmit={handlePriceSubmit}>
        <label>
          <span>Set selling price (USD per kWh)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={priceUsd}
            onChange={(event)=>setPriceUsd(event.target.value)}
            placeholder="0.25"
          />
        </label>
        <button type="submit" disabled={savingPrice}>
          {savingPrice ? 'Saving…' : 'Update price'}
        </button>
      </form>

      <form className="form-grid" style={{ marginTop: 18 }} onSubmit={handleSurplusSubmit}>
        <label>
          <span>Total solar generated today (kWh)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={generated}
            onChange={(event)=>setGenerated(event.target.value)}
            placeholder="12.5"
          />
        </label>
        <label>
          <span>Total household/local load (kWh)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={localLoad}
            onChange={(event)=>setLocalLoad(event.target.value)}
            placeholder="6.4"
          />
        </label>
        <label>
          <span>Surplus exported (auto)</span>
          <input type="number" readOnly value={surplusKwh.toFixed(2)} />
        </label>
        <button type="submit" disabled={recordingSurplus}>
          {recordingSurplus ? 'Recording…' : 'Confirm & Record'}
        </button>
      </form>

      <div className="info-card" style={{ marginTop: 18 }}>
        <strong>Pilot snapshot</strong>
        <p style={{ margin: '8px 0 0' }}>{todaysMessage}</p>
        {data?.surplusTodayKwh > 0 && (
          <small style={{ opacity: 0.75 }}>
            Remember to capture generation using the form above—matches run automatically after each submission.
          </small>
        )}
        {[statusMessage, surplusStatus].filter(Boolean).map((message, idx)=>(
          <div key={idx} className="alert" style={{ marginTop: 12 }}>
            {message}
          </div>
        ))}
      </div>

      {surplusSummary && (
        <div className="info-card" style={{ marginTop: 18 }}>
          <strong>Matching summary</strong>
          <p style={{ margin: '8px 0 0' }}>
            {surplusSummary.matchSummary?.executedTrades
              ? `Executed ${surplusSummary.matchSummary.executedTrades} trade(s) on confirmation.`
              : 'No buyers were available at this price right now.'}
          </p>
          {surplusSummary.todaysSales?.kwh > 0 && (
            <p style={{ margin: '4px 0 0' }}>
              Today’s total sold: {surplusSummary.todaysSales.kwh.toFixed(2)} kWh for ${formatUsdFromCents(surplusSummary.todaysSales.amountCents)}.
            </p>
          )}
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>Recent surplus entries</h3>
        <table>
          <thead>
            <tr>
              <th>Logged</th>
              <th>Solar generated</th>
              <th>Local load</th>
              <th>Surplus</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}><div className="empty-state">Loading surplus history…</div></td></tr>
            ) : data?.recentSurplus?.length ? (
              data.recentSurplus.map((entry)=>(
                <tr key={entry.id}>
                  <td>{new Date(entry.recordedAt).toLocaleString()}</td>
                  <td>{entry.generatedKwh.toFixed(2)} kWh</td>
                  <td>{entry.localLoadKwh.toFixed(2)} kWh</td>
                  <td>{entry.surplusKwh.toFixed(2)} kWh</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4}><div className="empty-state">No surplus recorded yet.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
