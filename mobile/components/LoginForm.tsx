import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { REGION_OPTIONS } from '@/constants/regions';
import { useAuth } from '@/hooks/useAuth';

export function LoginForm() {
  const {
    login,
    state: { loading },
  } = useAuth();

  const [email, setEmail] = useState('you@demo.com');
  const [name, setName] = useState('You');
  const [regionId, setRegionId] = useState(REGION_OPTIONS[0]?.value ?? 'region-1');

  async function handleSubmit() {
    try {
      await login({ email, name, regionId });
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Could not sign in right now. Try again shortly.';
      Alert.alert('Login failed', message);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.container}
    >
      <Text style={styles.badge}>KORA · SUSTAINABLE ENERGY</Text>
      <Text style={styles.title}>Power your neighbors with clean energy.</Text>
      <Text style={styles.subtitle}>
        Launch the sandbox in seconds—no emails sent, you get a funded wallet instantly.
      </Text>

      <View style={styles.fieldset}>
        <TextInput
          style={styles.input}
          placeholder="you@demo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Your name"
          value={name}
          onChangeText={setName}
        />

        <View>
          <Text style={styles.label}>Select a region</Text>
          <View style={styles.regionRow}>
            {REGION_OPTIONS.map(region => {
              const selected = region.value === regionId;
              return (
                <Pressable
                  key={region.value}
                  onPress={() => setRegionId(region.value)}
                  style={[styles.regionChip, selected && styles.regionChipActive]}
                >
                  <Text style={[styles.regionChipText, selected && styles.regionChipTextActive]}>
                    {region.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonLabel}>Launch Kora Demo</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 20,
    justifyContent: 'center',
  },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(60,155,109,0.12)',
    color: '#1d4531',
    fontWeight: '600',
    letterSpacing: 1.6,
    fontSize: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1f3529',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4d6157',
    lineHeight: 22,
  },
  fieldset: {
    gap: 12,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(66, 109, 86, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    color: '#375043',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  regionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  regionChip: {
    flexGrow: 1,
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
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#3c9b6d',
    shadowColor: '#3c9b6d',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonLabel: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.6,
  },
});
