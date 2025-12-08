import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { LoginForm } from '@/components/LoginForm';
import { REGION_OPTIONS } from '@/constants/regions';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

type ProfileForm = {
  name: string;
  organization: string;
  phone: string;
  regionId: string;
  timezone: string;
  address: string;
  paymentMethod: string;
  payoutDetails: string;
};

const defaultForm = (): ProfileForm => ({
  name: '',
  organization: '',
  phone: '',
  regionId: REGION_OPTIONS[0]?.value ?? 'region-1',
  timezone: '',
  address: '',
  paymentMethod: '',
  payoutDetails: '',
});

export default function ProfileScreen() {
  const {
    state: { user, wallet, regionId, initialized, loading },
    refresh,
    logout,
  } = useAuth();

  const [form, setForm] = useState<ProfileForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);

  const walletBalance = wallet ? (wallet.balanceCents / 100).toFixed(2) : '0.00';

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? '',
      organization: user.organization ?? '',
      phone: user.phone ?? '',
      regionId: user.regionId ?? regionId ?? defaultForm().regionId,
      timezone: user.timezone ?? '',
      address: user.address ?? '',
      paymentMethod: wallet?.paymentMethod ?? '',
      payoutDetails: wallet?.payoutDetails ?? '',
    });
  }, [regionId, user, wallet]);

  const regionButtons = useMemo(
    () =>
      REGION_OPTIONS.map(option => {
        const selected = option.value === form.regionId;
        return (
          <Pressable
            key={option.value}
            style={[styles.regionChip, selected && styles.regionChipActive]}
            onPress={() => setForm(prev => ({ ...prev, regionId: option.value }))}
          >
            <Text style={[styles.regionChipText, selected && styles.regionChipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      }),
    [form.regionId]
  );

  async function handleSave() {
    setSaving(true);
    setSavingStatus(null);
    try {
      await api.put('/profile', form);
      await refresh();
      setSavingStatus('Profile updated');
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Could not update profile. Try once the API is online.';
      setSavingStatus(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to sign out of the sandbox?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          logout();
        },
      },
    ]);
  }

  if (!initialized || (loading && !user)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3c9b6d" />
        <Text style={styles.centerText}>Loading profile…</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your profile</Text>
      <Text style={styles.subtitle}>
        Update contact details, preferred region, and payout information for settlements.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <View style={styles.fieldset}>
          <Label>Email</Label>
          <TextInput style={[styles.input, styles.inputReadonly]} value={user.email ?? ''} editable={false} />

          <Label>Name</Label>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={value => setForm(prev => ({ ...prev, name: value }))}
            placeholder="Your full name"
          />

          <Label>Organization</Label>
          <TextInput
            style={styles.input}
            value={form.organization}
            onChangeText={value => setForm(prev => ({ ...prev, organization: value }))}
            placeholder="Community group or company"
          />

          <Label>Phone</Label>
          <TextInput
            style={styles.input}
            value={form.phone}
            keyboardType="phone-pad"
            onChangeText={value => setForm(prev => ({ ...prev, phone: value }))}
            placeholder="+233 555..."
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Label>Region</Label>
        <View style={styles.regionRow}>{regionButtons}</View>

        <Label>Timezone</Label>
        <TextInput
          style={styles.input}
          value={form.timezone}
          onChangeText={value => setForm(prev => ({ ...prev, timezone: value }))}
          placeholder="Africa/Accra"
        />

        <Label>Address</Label>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.address}
          multiline
          numberOfLines={3}
          onChangeText={value => setForm(prev => ({ ...prev, address: value }))}
          placeholder="Street, community, district"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Settlements & wallet</Text>
        <View style={styles.fieldset}>
          <Label>Wallet balance</Label>
          <TextInput
            style={[styles.input, styles.inputReadonly]}
            value={`$${walletBalance}`}
            editable={false}
          />

          <Label>Currency</Label>
          <TextInput
            style={[styles.input, styles.inputReadonly]}
            value={wallet?.currency ?? 'USD'}
            editable={false}
          />

          <Label>Preferred payment method</Label>
          <TextInput
            style={styles.input}
            value={form.paymentMethod}
            onChangeText={value => setForm(prev => ({ ...prev, paymentMethod: value }))}
            placeholder="Mobile money, bank transfer..."
          />

          <Label>Payout details</Label>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.payoutDetails}
            multiline
            numberOfLines={3}
            onChangeText={value => setForm(prev => ({ ...prev, payoutDetails: value }))}
            placeholder="Account name, number, or wallet address"
          />
        </View>
      </View>

      {savingStatus ? <Text style={styles.status}>{savingStatus}</Text> : null}

      <View style={styles.actions}>
        <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonLabel}>Save changes</Text>}
        </Pressable>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutLabel}>Log out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.label}>
      {children}
    </Text>
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
    paddingBottom: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d3a2a',
  },
  subtitle: {
    fontSize: 15,
    color: '#4d6257',
    lineHeight: 20,
  },
  card: {
    gap: 14,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#1f3a2e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d3a2a',
  },
  fieldset: {
    gap: 10,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#3f5b4d',
    fontWeight: '600',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(66, 109, 86, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputReadonly: {
    backgroundColor: 'rgba(226,232,240,0.5)',
    color: '#4b5563',
  },
  textArea: {
    textAlignVertical: 'top',
  },
  regionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  regionChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(92,140,116,0.35)',
    backgroundColor: 'rgba(92,140,116,0.12)',
  },
  regionChipActive: {
    backgroundColor: '#3c9b6d',
    borderColor: '#2e6d4d',
  },
  regionChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2f4b3a',
  },
  regionChipTextActive: {
    color: '#ffffff',
  },
  status: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(60,155,109,0.12)',
    color: '#2f6a4f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#3c9b6d',
    shadowColor: '#3c9b6d',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonLabel: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.6,
  },
  logoutButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(60,155,109,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: {
    color: '#3c9b6d',
    fontWeight: '600',
    letterSpacing: 0.6,
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
