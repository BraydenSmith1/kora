import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LoginForm } from '@/components/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

type AnalyticsOverview = {
  kwh: number;
  usd: number;
  co2Tons: number;
  trades: number;
};

export default function AnalyticsScreen() {
  const {
    state: { user, initialized, loading },
  } = useAuth();

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    setError(null);
    try {
      const { data } = await api.get<AnalyticsOverview>('/analytics/overview');
      setOverview(data);
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Failed to load analytics';
      setError(message);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchOverview();
    setRefreshing(false);
  }, [fetchOverview, user]);

  if (!initialized || (loading && !user)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3c9b6d" />
        <Text style={styles.centerText}>Loading analytics…</Text>
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
      <Text style={styles.title}>Grid health at a glance</Text>
      <Text style={styles.subtitle}>
        Live marketplace totals from the Kora sandbox. Refresh to sync the latest lamp-post level
        trades.
      </Text>

      {error ? (
        <View style={[styles.card, styles.errorCard]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.metricsRow}>
        <MetricCard
          title="kWh traded"
          value={overview ? overview.kwh.toFixed(2) : '—'}
          helper="Energy flowing peer-to-peer."
          loading={loadingData}
        />
        <MetricCard
          title="Volume (USD)"
          value={overview ? `$${overview.usd.toFixed(2)}` : '—'}
          helper="Community savings to date."
          loading={loadingData}
        />
      </View>

      <View style={styles.metricsRow}>
        <MetricCard
          title="CO₂ offset (t)"
          value={overview ? overview.co2Tons.toFixed(3) : '—'}
          helper="Diesel burn avoided."
          loading={loadingData}
        />
        <MetricCard
          title="Trades"
          value={overview ? `${overview.trades}` : '—'}
          helper="Executed matches in the region."
          loading={loadingData}
        />
      </View>
    </ScrollView>
  );
}

function MetricCard({
  title,
  value,
  helper,
  loading,
}: {
  title: string;
  value: string;
  helper: string;
  loading: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.metricTitle}>{title}</Text>
      <View style={styles.metricValueWrap}>
        {loading ? <ActivityIndicator color="#3c9b6d" /> : <Text style={styles.metricValue}>{value}</Text>}
      </View>
      <Text style={styles.metricHelper}>{helper}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4faf6',
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d3a2a',
  },
  subtitle: {
    fontSize: 15,
    color: '#4d6257',
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 8,
    shadowColor: '#1f3a2e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 1,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#3f5b4d',
  },
  metricValueWrap: {
    minHeight: 44,
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f3529',
  },
  metricHelper: {
    fontSize: 13,
    color: '#546d61',
  },
  errorCard: {
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.16)',
    backgroundColor: 'rgba(254,226,226,0.6)',
  },
  errorText: {
    color: '#9f1239',
    fontWeight: '600',
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
  },
});
