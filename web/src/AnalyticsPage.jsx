import React, { useCallback, useEffect, useMemo, useState } from 'react'

function formatCurrency(value) {
  if (isNaN(value)) return '$0.00'
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatNumber(value, digits = 2) {
  if (isNaN(value)) return '0'
  return value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

const REGION_LABEL = (id) => {
  if (!id || id === 'unassigned') return 'Unassigned'
  return id
}

export default function AnalyticsPage({ api }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [regionFilter, setRegionFilter] = useState('all')
  const [updatedAt, setUpdatedAt] = useState(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const response = await api.get('/analytics/overview')
      setData(response.data)
      setUpdatedAt(new Date())
    } catch (e) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const summaryCards = useMemo(() => {
    if (!data) return []
    const averageTrade = data.trades ? data.usd / data.trades : 0
    const openOrders = (data.openOffers || 0) + (data.openRequests || 0)
    return [
      { label: 'Marketplace users', value: data.users.toLocaleString(), helper: 'Participants funded and ready.' },
      { label: 'Trades settled', value: data.trades.toLocaleString(), helper: 'All-time completed trades.' },
      { label: 'kWh traded', value: formatNumber(data.kwh), helper: 'Energy routed across microgrids.' },
      { label: 'Volume (USD)', value: formatCurrency(data.usd), helper: 'Gross settlement value.' },
      { label: 'Average trade', value: formatCurrency(averageTrade), helper: 'Typical settlement size.' },
      { label: 'Open orders', value: openOrders.toLocaleString(), helper: `${data.openOffers} sell · ${data.openRequests} buy` },
      { label: 'Avg price ($/kWh)', value: formatCurrency(data.avgPrice), helper: 'Clearing price across trades.' },
      { label: 'CO₂ offset (t)', value: formatNumber(data.co2Tons, 3), helper: 'Emissions avoided to date.' }
    ]
  }, [data])

  const regionOptions = useMemo(() => {
    if (!data || !data.regions) return ['all']
    return ['all', ...data.regions.map(r => r.regionId || 'unassigned')]
  }, [data])

  const regionSnapshots = useMemo(() => {
    if (!data || !data.regions) return []
    return data.regions.map(region => {
      const supply = Number(region.offerKwh || 0)
      const demand = Number(region.requestKwh || 0)
      const totalOpen = supply + demand
      const supplyPct = totalOpen > 0 ? (supply / totalOpen) * 100 : 0
      const demandPct = totalOpen > 0 ? (demand / totalOpen) * 100 : 0
      return {
        id: region.regionId || 'unassigned',
        label: REGION_LABEL(region.regionId),
        trades: region.trades,
        tradedKwh: region.tradedKwh,
        tradedUsd: region.tradedUsd,
        openOffers: region.openOffers,
        openRequests: region.openRequests,
        supplyKwh: supply,
        demandKwh: demand,
        supplyPct,
        demandPct
      }
    })
  }, [data])

  const filteredTrades = useMemo(() => {
    if (!data || !data.recentTrades) return []
    return data.recentTrades.filter(trade => {
      if (regionFilter === 'all') return true
      const tradeRegion = trade.regionId || 'unassigned'
      return tradeRegion === regionFilter
    })
  }, [data, regionFilter])

  return (
    <div className="analytics-page">
      <section className="card">
        <div className="card-header row-between">
          <div>
            <h2 style={{ margin: 0 }}>Marketplace analytics</h2>
            <p className="section-subtitle">Macro and granular insights for your peer-to-peer energy network.</p>
          </div>
          <div className="analytics-controls">
            <button type="button" className="ghost" onClick={fetchAnalytics} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
        {error ? (
          <div className="empty-state">Analytics are offline. Start the API and try again.</div>
        ) : loading && !data ? (
          <div className="empty-state">Loading analytics…</div>
        ) : (
          <>
            <div className="metrics-grid analytics-metrics">
              {summaryCards.map(card => (
                <div className="metric-card" key={card.label}>
                  <div className="metric-card__label">{card.label}</div>
                  <div className="metric-card__value">{card.value}</div>
                  <div className="metric-card__helper">{card.helper}</div>
                </div>
              ))}
            </div>
            {updatedAt && (
              <div className="analytics-updated">Last updated {updatedAt.toLocaleString()}</div>
            )}
          </>
        )}
      </section>

      {data && !error && (
        <>
          <section className="card analytics-region-card">
            <div className="card-header row-between">
              <div>
                <h3 style={{ margin: 0 }}>Regional performance</h3>
                <p className="section-subtitle">Volume and demand depth across connected microgrids.</p>
              </div>
            </div>
            {regionSnapshots.length === 0 ? (
              <div className="empty-state">No regional data yet. Execute trades to populate insights.</div>
            ) : (
              <>
                <div className="region-card-grid">
                  {regionSnapshots.map(snapshot => (
                    <div className="region-card" key={snapshot.id}>
                      <header>
                        <span className="region-card__label">{snapshot.label}</span>
                        <span className="region-card__volume">{formatCurrency(snapshot.tradedUsd)}</span>
                      </header>
                      <dl>
                        <div>
                          <dt>Trades</dt>
                          <dd>{snapshot.trades}</dd>
                        </div>
                        <div>
                          <dt>kWh traded</dt>
                          <dd>{formatNumber(snapshot.tradedKwh)}</dd>
                        </div>
                        <div>
                          <dt>Open offers</dt>
                          <dd>{snapshot.openOffers}</dd>
                        </div>
                        <div>
                          <dt>Open requests</dt>
                          <dd>{snapshot.openRequests}</dd>
                        </div>
                      </dl>
                      {snapshot.supplyKwh + snapshot.demandKwh > 0 ? (
                        <div className="region-card__bar">
                          {snapshot.supplyKwh > 0 && (
                            <span
                              style={{ width: `${snapshot.supplyPct}%` }}
                              className="region-card__bar-fill region-card__bar-fill--supply"
                            >
                              Supply {formatNumber(snapshot.supplyKwh, 1)} kWh
                            </span>
                          )}
                          {snapshot.demandKwh > 0 && (
                            <span
                              style={{ width: `${snapshot.demandPct}%` }}
                              className="region-card__bar-fill region-card__bar-fill--demand"
                            >
                              Demand {formatNumber(snapshot.demandKwh, 1)} kWh
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="region-card__empty">No open orders</div>
                      )}
                    </div>
                  ))}
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Region</th>
                      <th>Trades</th>
                      <th>kWh traded</th>
                      <th>Volume (USD)</th>
                      <th>Open offers</th>
                      <th>Open requests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.regions.map(region => (
                      <tr key={region.regionId || 'unassigned'}>
                        <td>{REGION_LABEL(region.regionId)}</td>
                        <td>{region.trades}</td>
                        <td>{formatNumber(region.tradedKwh)}</td>
                        <td>{formatCurrency(region.tradedUsd)}</td>
                        <td>{region.openOffers}</td>
                        <td>{region.openRequests}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>

          <div className="analytics-columns">
            <section className="card">
              <div className="card-header">
                <h3 style={{ margin: 0 }}>Top sellers</h3>
                <p className="section-subtitle">Ranked by lifetime settlement volume.</p>
              </div>
              <TopList items={data.topSellers} emptyLabel="No seller history yet." />
            </section>
            <section className="card">
              <div className="card-header">
                <h3 style={{ margin: 0 }}>Top buyers</h3>
                <p className="section-subtitle">Participants driving demand on the platform.</p>
              </div>
              <TopList items={data.topBuyers} emptyLabel="No buyer history yet." />
            </section>
          </div>

          <section className="card">
            <div className="card-header row-between">
              <div>
                <h3 style={{ margin: 0 }}>Recent trades</h3>
                <p className="section-subtitle">Latest matches. Use filters to focus on a microgrid.</p>
              </div>
              <div className="analytics-controls">
                <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
                  {regionOptions.map(option => (
                    <option key={option} value={option}>
                      {option === 'all' ? 'All regions' : REGION_LABEL(option)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {filteredTrades.length === 0 ? (
              <div className="empty-state">No trades yet for this selection.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Region</th>
                    <th>Buyer</th>
                    <th>Seller</th>
                    <th>kWh</th>
                    <th>Price ($/kWh)</th>
                    <th>Amount (USD)</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.map(trade => (
                    <tr key={trade.id}>
                      <td>{REGION_LABEL(trade.regionId)}</td>
                      <td>{trade.buyerName}</td>
                      <td>{trade.sellerName}</td>
                      <td>{formatNumber(trade.quantityKwh)}</td>
                      <td>{formatCurrency(trade.priceCentsPerKwh / 100)}</td>
                      <td>{formatCurrency(trade.amountUsd)}</td>
                      <td>{new Date(trade.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function TopList({ items, emptyLabel }) {
  if (!items || items.length === 0) {
    return <div className="empty-state">{emptyLabel}</div>
  }
  return (
    <ul className="analytics-list">
      {items.map(item => (
        <li key={item.userId || item.name} className="analytics-list__item">
          <div>
            <div className="analytics-list__primary">{item.name}</div>
            <div className="analytics-list__secondary">
              {item.regionId ? REGION_LABEL(item.regionId) : 'Unassigned'} · {item.trades} trades
            </div>
          </div>
          <div className="analytics-list__stats">
            <span>{formatCurrency(item.usd)}</span>
            <small>{formatNumber(item.kwh)} kWh</small>
          </div>
        </li>
      ))}
    </ul>
  )
}
