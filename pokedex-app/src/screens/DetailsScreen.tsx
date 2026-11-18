import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { fetchPokemonDetails } from '../api/pokeApi';
import { InfoPill } from '../components/InfoPill';
import { StatBar } from '../components/StatBar';
import { typeColors, typeLabels, typeSoftColors } from '../constants/pokemonTheme';
import { PokemonDetails, PokemonSummary } from '../types/pokemon';
import { formatPokemonId } from '../utils/format';

type Props = {
  pokemon: PokemonSummary;
  onBack: () => void;
};

export function DetailsScreen({ pokemon, onBack }: Props) {
  const [details, setDetails] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShiny, setShowShiny] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mainType = pokemon.types[0];
  const accent = typeColors[mainType];
  const soft = typeSoftColors[mainType];

  useEffect(() => {
    setShowShiny(false);
  }, [pokemon.id]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchPokemonDetails(pokemon);
        if (active) setDetails(response);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Não foi possível carregar os detalhes.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [pokemon, retryCount]);

  const current = details ?? pokemon;
  const badges = useMemo(() => {
    const items = [];
    if (details?.isLegendary) items.push('Lendário');
    if (details?.isMythical) items.push('Mítico');
    return items;
  }, [details]);

  return (
    <View style={[styles.safeArea, { backgroundColor: soft }]}>
      <StatusBar barStyle="dark-content" backgroundColor={soft} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.number}>{formatPokemonId(current.id)}</Text>
            <Text style={styles.title}>{current.displayName}</Text>
          </View>
        </View>

        <View style={[styles.heroCard, { backgroundColor: accent }]}>
          <View style={styles.heroCircleLarge} />
          <View style={styles.heroCircleSmall} />
          <Image source={{ uri: showShiny && current.shinyImage ? current.shinyImage : current.image }} style={styles.heroImage} resizeMode="contain" />
          <View style={styles.typeRow}>
            {current.types.map((type) => (
              <Text key={type} style={styles.typePill}>
                {typeLabels[type]}
              </Text>
            ))}
            {badges.map((badge) => (
              <Text key={badge} style={styles.typePill}>
                {badge}
              </Text>
            ))}
          </View>
        </View>

        {current.shinyImage ? (
          <Pressable style={styles.shinyButton} onPress={() => setShowShiny((value) => !value)}>
            <Text style={styles.shinyButtonText}>
              {showShiny ? '↺ Ver forma original' : '✦ Ver versão shiny'}
            </Text>
          </Pressable>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={accent} />
            <Text style={styles.loadingText}>Buscando dados da espécie...</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => setRetryCount((value) => value + 1)}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo</Text>
          <Text style={styles.description}>{details?.description ?? 'Carregando descrição...'}</Text>
          <View style={styles.infoGrid}>
            <InfoPill label="Altura" value={`${current.height} m`} />
            <InfoPill label="Peso" value={`${current.weight} kg`} />
            <InfoPill label="Experiência" value={current.baseExperience ? String(current.baseExperience) : '-'} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Características</Text>
          <View style={styles.infoGrid}>
            <InfoPill label="Espécie" value={details?.genus ?? '...'} />
            <InfoPill label="Habitat" value={details?.habitat ?? '...'} />
            <InfoPill label="Formato" value={details?.shape ?? '...'} />
          </View>
          <View style={styles.abilitiesBox}>
            <Text style={styles.abilitiesLabel}>Habilidades</Text>
            <Text style={styles.abilitiesText}>{current.abilities.join(', ')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atributos base</Text>
          {current.stats.map((stat) => (
            <StatBar key={stat.name} stat={stat} color={accent} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 10 : 0
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
    marginBottom: 12
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  backIcon: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '900',
    marginTop: -10
  },
  headerText: {
    flex: 1
  },
  number: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '900'
  },
  title: {
    color: '#0F172A',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -0.9
  },
  heroCard: {
    minHeight: 330,
    borderRadius: 34,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 6
  },
  heroImage: {
    width: 280,
    height: 280,
    zIndex: 3
  },
  heroCircleLarge: {
    position: 'absolute',
    width: 310,
    height: 310,
    borderRadius: 155,
    borderWidth: 42,
    borderColor: 'rgba(255,255,255,0.18)',
    top: -82,
    right: -72
  },
  heroCircleSmall: {
    position: 'absolute',
    width: 178,
    height: 178,
    borderRadius: 89,
    borderWidth: 28,
    borderColor: 'rgba(255,255,255,0.13)',
    bottom: -40,
    left: -50
  },
  typeRow: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    right: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 4
  },
  typePill: {
    height: 30,
    minWidth: 72,
    color: '#0F172A',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 13,
    paddingVertical: 0,
    fontSize: 12,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false
  },
  shinyButton: {
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginBottom: 16
  },
  shinyButtonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800'
  },
  retryText: {
    color: '#B91C1C',
    fontWeight: '900',
    marginTop: 8,
    textDecorationLine: 'underline'
  },
  loadingBox: {
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  loadingText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '800'
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '800'
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 26,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.9)'
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 12
  },
  description: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 14
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  abilitiesBox: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  abilitiesLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.7
  },
  abilitiesText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800'
  }
});
