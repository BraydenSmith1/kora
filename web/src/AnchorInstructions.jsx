import React from 'react';

export default function AnchorInstructions(){
  const steps = [
    {
      title: '1. Capture meter reading daily',
      detail: 'Log the kWh consumed in “Enter Meter Reading”. The system raises a marketplace request for any shortfall.'
    },
    {
      title: '2. Review deliveries',
      detail: 'The dashboard shows energy purchased today and the week-to-date spend so you can confirm supply is arriving.'
    },
    {
      title: '3. Pay down weekly',
      detail: 'Use “Weekly Balance Due” to record cash settlements. This keeps the operator and ledger aligned.'
    },
    {
      title: '4. Keep notes tidy',
      detail: 'Add notes when demand spikes or key equipment is online—these appear in the ledger for audits.'
    }
  ];

  return (
    <section className="card">
      <h2>Anchor instructions</h2>
      <p className="section-subtitle">
        A lightweight SOP for the pilot anchor site. Following these steps ensures balances reconcile at settlement.
      </p>
      <div className="info-card" style={{ display: 'grid', gap: '14px' }}>
        {steps.map((step)=>(
          <div key={step.title}>
            <strong>{step.title}</strong>
            <p style={{ margin: '4px 0 0' }}>{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
