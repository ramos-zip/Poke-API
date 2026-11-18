import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PokemonStat } from '../types/pokemon';

type Props = {
  stat: PokemonStat;
  color: string;
};

export function StatBar({ stat, color }: Props) {
  const percentage = Math.min(100, Math.round((stat.value / 180) * 100));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{stat.label}</Text>
      <Text style={styles.value}>{stat.value}</Text>
      <View style={styles.track}>
        <View style={[styles.progress, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12
  },
  label: {
    width: 88,
    color: '#475569',
    fontSize: 12,
    fontWeight: '900'
  },
  value: {
    width: 32,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right'
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0'
  },
  progress: {
    height: 8,
    borderRadius: 999
  }
});
