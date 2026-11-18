import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: string;
};

export function InfoPill({ label, value }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 95,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  value: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4
  },
  label: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800'
  }
});
