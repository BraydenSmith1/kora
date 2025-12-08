import React from 'react';

const steps = [
  {
    title: '1. Set the day’s price',
    detail: 'Update the USD/kWh rate on the dashboard each morning. This is the price used for every automatic match.'
  },
  {
    title: '2. Log production and load',
    detail: 'Enter total generation and local consumption. Any surplus posts to the marketplace and instantly attempts to match.'
  },
  {
    title: '3. Review matches and ledger',
    detail: 'Check the dashboard summary and ledger for trades, payments, and on-chain receipts recorded for compliance.'
  },
  {
    title: '4. Support the anchor',
    detail: 'If no trades happen, confirm the anchor is logging meter readings and that your price matches their budget.'
  }
];

export default function OperatorInstructions(){
  return (
    <section className="card">
      <h2>Operator instructions</h2>
      <p className="section-subtitle">
        Quick reference for running the pilot. Complete these steps daily to keep the marketplace and ledger in sync.
      </p>
      <div className="info-card" style={{ display: 'grid', gap: '14px' }}>
        {steps.map(step => (
          <div key={step.title}>
            <strong>{step.title}</strong>
            <p style={{ margin: '4px 0 0' }}>{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
