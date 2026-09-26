import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { config } from '@/services/config';

// Sprint 01 placeholder: proves routing, config wiring and the iOS bundle.
// Replaced by the real Home / onboarding flow in Sprint 06; colours move to theme tokens in Sprint 02.
export default function Index() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>FridgeChef · mode: {config.API_MODE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
