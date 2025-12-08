import React, { useEffect, useState } from 'react';

export default function AnchorMeterReading({ api, refreshKey, onGlobalRefresh }){
  const [reading, setReading] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [summary, setSummary] = useState(null);

  useEffect(()=>{
    setStatus('');
    setSummary(null);
    setReading('');
    setNotes('');
  }, [refreshKey]);

  async function handleSubmit(event){
    event.preventDefault();
    const parsed = Number.parseFloat(reading);
    if(!Number.isFinite(parsed) || parsed < 0){
      setStatus('Enter the kWh consumed since the last reading.');
      return;
    }
    setSubmitting(true);
    setStatus('');
    setSummary(null);
    try{
      const { data } = await api.post('/pilot/anchor/meter-reading', {
        readingKwh: parsed,
        notes: notes || undefined
      });
      setSummary(data);
      setStatus(
        data.requestedKwh > 0
          ? `Meter recorded ${parsed.toFixed(2)} kWh. ${data.requestedKwh.toFixed(2)} kWh sent to marketplace.`
          : `Meter recorded ${parsed.toFixed(2)} kWh. No additional demand posted.`
      );
      setReading('');
      setNotes('');
      onGlobalRefresh();
    }catch(err){
      const message = err?.response?.data?.error || err.message || 'Could not record meter reading.';
      setStatus(message);
    }finally{
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <div className="row row-between">
        <div>
          <h2>Enter meter reading</h2>
          <p className="section-subtitle">
            Capture today’s consumption. Any shortfall automatically becomes a marketplace request up to the anchor limit.
          </p>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          <span>Metered consumption today (kWh)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={reading}
            onChange={(event)=>setReading(event.target.value)}
            placeholder="e.g. 7.8"
          />
        </label>
        <label>
          <span>Notes (optional)</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(event)=>setNotes(event.target.value)}
            placeholder="Load spike from vaccine fridge."
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Recording…' : 'Log reading'}
        </button>
      </form>

      {status && (
        <div className="alert" style={{ marginTop: 16 }}>
          {status}
        </div>
      )}

      {summary?.matchSummary && (
        <div className="info-card" style={{ marginTop: 18 }}>
          <strong>Matching summary</strong>
          <p style={{ margin: '8px 0 0' }}>
            {summary.matchSummary.executedTrades
              ? `Executed ${summary.matchSummary.executedTrades} trade(s) after this reading.`
              : 'No supply met this request yet—operator will see the demand.'}
          </p>
        </div>
      )}
    </section>
  );
}
