import React, { useEffect, useState } from 'react'

const REGION_OPTIONS = [
  { value: 'region-1', label: 'Denver Metro' },
  { value: 'region-2', label: 'region-2' }
]

export default function Profile({ user, wallet, onSave, saving, status, onTopup, topupAmountCents }) {
  const [form, setForm] = useState(defaultState(user, wallet))

  useEffect(() => {
    setForm(defaultState(user, wallet))
  }, [user?.id, wallet?.id])

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!user) return
    onSave(form)
  }

  return (
    <section className="card profile-card">
      <h2 style={{ marginTop: 0 }}>Your profile</h2>
      <p className="section-subtitle" style={{ marginTop: 4 }}>
        Update contact details, preferred region, and payout information for settlements.
      </p>
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="profile-grid">
          <Field label="Email" description="Used for login; contact support to change." descriptionPosition="below" readOnly>
            <input value={user?.email || ''} readOnly />
          </Field>
          <Field label="Name">
            <input
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Your full name"
            />
          </Field>
          <Field label="Organization">
            <input
              value={form.organization}
              onChange={e => handleChange('organization', e.target.value)}
              placeholder="Community group or company"
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={e => handleChange('phone', e.target.value)}
              placeholder="+233 555..."
            />
          </Field>
          <Field label="Region">
            <select
              value={form.regionId}
              onChange={e => handleChange('regionId', e.target.value)}
            >
              {REGION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Timezone">
            <input
              value={form.timezone}
              onChange={e => handleChange('timezone', e.target.value)}
              placeholder="Africa/Accra"
            />
          </Field>
          <Field label="Address">
            <textarea
              value={form.address}
              onChange={e => handleChange('address', e.target.value)}
              placeholder="Street, community, district"
              rows={3}
            />
          </Field>
        </div>

        <div className="profile-divider" />

        <h3>Settlement & wallet preferences</h3>
        <p className="section-subtitle">
          These details appear when operators reconcile payouts.
        </p>
        <div className="profile-grid">
          <Field label="Wallet balance" readOnly>
            <div className="wallet-balance-field">
              <input value={`$${wallet ? (wallet.balanceCents / 100).toFixed(2) : '0.00'}`} readOnly />
              {typeof onTopup === 'function' && (
                <button type="button" className="pill" onClick={onTopup}>
                  Add Funds ${((topupAmountCents ?? 0) / 100).toFixed(2)}
                </button>
              )}
            </div>
          </Field>
          <Field label="Currency" readOnly>
            <input value={wallet?.currency || 'USD'} readOnly />
          </Field>
          <Field label="Preferred payment method">
            <input
              value={form.paymentMethod}
              onChange={e => handleChange('paymentMethod', e.target.value)}
              placeholder="Mobile money, bank transfer..."
            />
          </Field>
          <Field label="Payout details">
            <textarea
              value={form.payoutDetails}
              onChange={e => handleChange('payoutDetails', e.target.value)}
              placeholder="Account name, number, or wallet address"
              rows={3}
            />
          </Field>
        </div>

        {status && <div className="profile-status">{status}</div>}

        <div className="profile-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  )
}

function Field({ label, description, descriptionPosition = 'above', readOnly, children }) {
  return (
    <label className={`profile-field ${readOnly ? 'profile-field--readonly' : ''}`}>
      <span>
        {label}
        {description && descriptionPosition === 'above' && <small>{description}</small>}
      </span>
      {children}
      {description && descriptionPosition === 'below' && <small className="profile-helper">{description}</small>}
    </label>
  )
}

function defaultState(user, wallet) {
  return {
    name: user?.name || '',
    regionId: user?.regionId || 'region-1',
    phone: user?.phone || '',
    organization: user?.organization || '',
    address: user?.address || '',
    timezone: user?.timezone || '',
    paymentMethod: wallet?.paymentMethod || '',
    payoutDetails: wallet?.payoutDetails || ''
  }
}
