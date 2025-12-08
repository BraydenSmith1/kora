import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LoginForm } from '@/components/LoginForm';
import { REGION_LABELS } from '@/constants/regions';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

type Offer = {
  id: string;
  quantityKwh: number;
  priceCentsPerKwh: number;
  createdAt: string;
};

type Request = {
  id: string;
  quantityKwh: number;
  maxPriceCentsPerKwh: number;
  createdAt: string;
};

type Trade = {
  id: string;
  quantityKwh: number;
  priceCentsPerKwh: number;
  amountCents: number;
  createdAt: string;
};

const TOPUP_CENTS = 500;

export default function MarketScreen() {
  const {
    state: { user, wallet, regionId, loading, initialized },
    refresh,
  } = useAuth();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regionLabel = useMemo(() => {
    if (!regionId) return '—';
    return REGION_LABELS[regionId] ?? regionId;
  }, [regionId]);

  const walletBalance = wallet ? (wallet.balanceCents / 100).toFixed(2) : '0.00';

  const fetchMarketplace = useCallback(async () => {
    if (!user || !regionId) return;
    setLoadingData(true);
    setError(null);
    try {
      const [offersRes, requestsRes, tradesRes] = await Promise.all([
        api.get<Offer[]>('/offers', { params: { status: 'OPEN', regionId } }),
        api.get<Request[]>('/requests', { params: { status: 'OPEN', regionId } }),
        api.get<Trade[]>('/trades', { params: { mine: true } }),
      ]);
      setOffers(offersRes.data);
      setRequests(requestsRes.data);
      setTrades(tradesRes.data);
      await refresh();
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Could not load marketplace';
      setError(message);
    } finally {
      setLoadingData(false);
    }
  }, [user, regionId, refresh]);

  useEffect(() => {
    fetchMarketplace();
  }, [fetchMarketplace]);

  const handleRefresh = useCallback(async () => {
    if (!user || !regionId) return;
    setRefreshing(true);
    await fetchMarketplace();
    setRefreshing(false);
  }, [fetchMarketplace, regionId, user]);

  const handleTopUp = useCallback(async () => {
    try {
      await api.post('/wallet/topup', { amountCents: TOPUP_CENTS });
      await refresh();
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Top-up failed';
      setError(message);
    }
  }, [refresh]);

  const handleRunMatch = useCallback(async () => {
    if (!user) return;
    setError(null);
    setLoadingData(true);
    try {
      await api.post('/match/run');
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Match run failed';
      setError(message);
    } finally {
      await fetchMarketplace();
    }
  }, [fetchMarketplace, user]);

  if (!initialized || (loading && !user)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3c9b6d" />
        <Text style={styles.centerText}>Preparing your account…</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account snapshot</Text>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Wallet balance</Text>
            <Text style={styles.statValue}>${walletBalance}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Region</Text>
            <Text style={styles.statValue}>{regionLabel}</Text>
          </View>
        </View>
        <Text style={styles.helperText}>
          Need more credits for trades? Instant top-up adds ${(TOPUP_CENTS / 100).toFixed(2)} to your wallet.
        </Text>
        <View style={styles.buttonRow}>
          <Pressable style={styles.primaryButton} onPress={handleTopUp}>
            <Text style={styles.primaryButtonLabel}>
              Add Funds ${(TOPUP_CENTS / 100).toFixed(2)}
            </Text>
          </Pressable>
        </View>
      </View>

      {error && (
        <View style={[styles.card, styles.errorCard]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Open buy requests · {regionLabel}</Text>
        {loadingData ? (
          <ActivityIndicator style={styles.listSpinner} color="#3c9b6d" />
        ) : requests.length === 0 ? (
          <Text style={styles.emptyText}>No open buy requests yet.</Text>
        ) : (
          requests.map(request => (
            <View key={request.id} style={styles.listItem}>
              <Text style={styles.listPrimary}>
                {Number(request.quantityKwh).toFixed(2)} kWh @ $
                {(request.maxPriceCentsPerKwh / 100).toFixed(2)}
              </Text>
              <Text style={styles.listSecondary}>
                {new Date(request.createdAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Open sell offers · {regionLabel}</Text>
        {loadingData ? (
          <ActivityIndicator style={styles.listSpinner} color="#3c9b6d" />
        ) : offers.length === 0 ? (
          <Text style={styles.emptyText}>No sell offers yet—create the first one!</Text>
        ) : (
          offers.map(offer => (
            <View key={offer.id} style={styles.listItem}>
              <Text style={styles.listPrimary}>
                {Number(offer.quantityKwh).toFixed(2)} kWh @ $
                {(offer.priceCentsPerKwh / 100).toFixed(2)}
              </Text>
              <Text style={styles.listSecondary}>{new Date(offer.createdAt).toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.sectionTitle}>Your trades</Text>
            <Text style={styles.helperText}>
              Matches consider open orders within <Text style={styles.bold}>{regionLabel}</Text>.
            </Text>
          </View>
          <Pressable onPress={handleRunMatch} disabled={loadingData} style={styles.secondaryButtonWrap}>
            <Text style={[styles.secondaryButton, loadingData && styles.secondaryButtonDisabled]}>
              {loadingData ? 'Matching…' : 'Run match'}
            </Text>
          </Pressable>
        </View>
        {loadingData ? (
          <ActivityIndicator style={styles.listSpinner} color="#3c9b6d" />
        ) : trades.length === 0 ? (
          <Text style={styles.emptyText}>
            No trades yet—run a match once you have overlapping orders.
          </Text>
        ) : (
          trades.map(trade => (
            <View key={trade.id} style={styles.listItem}>
              <Text style={styles.listPrimary}>
                {Number(trade.quantityKwh).toFixed(2)} kWh @ $
                {(trade.priceCentsPerKwh / 100).toFixed(2)}
              </Text>
              <Text style={styles.listSecondary}>
                Amount ${(trade.amountCents / 100).toFixed(2)} ·{' '}
                {new Date(trade.createdAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4faf6',
  },
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f4faf6',
  },
  centerText: {
    color: '#3b5a4b',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    gap: 12,
    shadowColor: '#1f3a2e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d3a2a',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d3a2a',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(60,155,109,0.08)',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#406050',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f3529',
  },
  helperText: {
    fontSize: 13,
    color: '#546d61',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  primaryButton: {
    backgroundColor: '#3c9b6d',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    shadowColor: '#3c9b6d',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  secondaryButtonWrap: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(60,155,109,0.4)',
  },
  secondaryButton: {
    color: '#3c9b6d',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  secondaryButtonDisabled: {
    color: 'rgba(60,155,109,0.5)',
  },
  listSpinner: {
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6a8075',
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30,60,45,0.08)',
  },
  listPrimary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f3529',
  },
  listSecondary: {
    fontSize: 12,
    color: '#5f7167',
    marginTop: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorCard: {
    borderColor: 'rgba(220,38,38,0.16)',
    borderWidth: 1,
    backgroundColor: 'rgba(254,226,226,0.6)',
  },
  errorText: {
    color: '#9f1239',
    fontWeight: '600',
  },
  bold: {
    fontWeight: '700',
  },
});
