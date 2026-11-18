import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import {
  fetchPokemonBatch,
  fetchPokemonIndex,
  fetchPokemonTypeIndex,
  PokemonIndexEntry
} from '../api/pokeApi';
import { EmptyState } from '../components/EmptyState';
import { PokemonCard } from '../components/PokemonCard';
import { SearchBar } from '../components/SearchBar';
import { TypeFilter } from '../components/TypeFilter';
import { PokemonSummary, PokemonTypeName } from '../types/pokemon';

const PAGE_SIZE = 18;

type Props = { onSelectPokemon: (pokemon: PokemonSummary) => void };

/**
 * O índice contém todos os Pokémon. Apenas os detalhes necessários para
 * desenhar os cards são buscados em lotes quando o aluno rola a lista.
 */
export function HomeScreen({ onSelectPokemon }: Props) {
  const [pokemons, setPokemons] = useState<PokemonSummary[]>([]);
  const [selectedType, setSelectedType] = useState<PokemonTypeName | 'all'>('all');
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [refreshNumber, setRefreshNumber] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // useRef é usado para impedir buscas paralelas e descartar resultados antigos.
  const revisionRef = useRef(0);
  const busyRef = useRef(false);
  const blockedRef = useRef(false);
  const nextIndexRef = useRef(0);
  const catalogRef = useRef<PokemonIndexEntry[]>([]);

  const loadNext = useCallback(async (revision: number, firstPage: boolean) => {
    if (busyRef.current || blockedRef.current) return;
    const catalog = catalogRef.current;
    if (nextIndexRef.current >= catalog.length) return;

    busyRef.current = true;
    if (!firstPage) setLoadingMore(true);
    setMoreError(null);

    const from = nextIndexRef.current;
    const to = Math.min(from + PAGE_SIZE, catalog.length);
    try {
      const batch = await fetchPokemonBatch(catalog.slice(from, to));
      // Se o filtro mudou enquanto esperávamos, esse retorno não é mais válido.
      if (revision !== revisionRef.current) return;
      nextIndexRef.current = to;
      setPokemons((current) => firstPage ? batch : [...current, ...batch]);
      setHasMore(to < catalog.length);
    } catch (cause) {
      if (revision !== revisionRef.current) return;
      blockedRef.current = true; // uma falha não causa loop de tentativas
      setMoreError(cause instanceof Error ? cause.message : 'Falha na comunicação com a PokeAPI.');
    } finally {
      if (revision === revisionRef.current) {
        busyRef.current = false;
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    const revision = ++revisionRef.current;
    busyRef.current = false;
    blockedRef.current = false;
    nextIndexRef.current = 0;
    catalogRef.current = [];
    setPokemons([]);
    setLoading(true);
    setHasMore(false);
    setMoreError(null);
    setError(null);

    const loadCatalog = async () => {
      try {
        const all = await fetchPokemonIndex();
        if (revision !== revisionRef.current) return;
        setTotalCount(all.length);
        const fromType = selectedType === 'all' ? all : await fetchPokemonTypeIndex(selectedType, all);
        if (revision !== revisionRef.current) return;

        const query = submittedSearch.trim().toLowerCase();
        const matches = fromType.filter((item) =>
          !query || item.name.includes(query) || String(item.id) === query || String(item.id).padStart(3, '0') === query
        );

        catalogRef.current = matches;
        setResultCount(matches.length);
        setHasMore(matches.length > 0);
        if (matches.length) await loadNext(revision, true);
      } catch (cause) {
        if (revision !== revisionRef.current) return;
        setError(cause instanceof Error ? cause.message : 'Não foi possível consultar a PokeAPI.');
      } finally {
        if (revision === revisionRef.current) setLoading(false);
      }
    };

    void loadCatalog();
    return () => { if (revision === revisionRef.current) revisionRef.current++; };
  }, [selectedType, submittedSearch, refreshNumber, loadNext]);

  const handleLoadMore = () => {
    if (loading || loadingMore || error || moreError || !hasMore) return;
    void loadNext(revisionRef.current, false);
  };

  const handleRetryMore = () => {
    blockedRef.current = false;
    setMoreError(null);
    void loadNext(revisionRef.current, false);
  };

  const handleSearch = () => {
    const query = search.trim().toLowerCase();
    // A busca vale para todo o índice (inclusive Pokémon não paginados).
    setSubmittedSearch(query);
    if (query === submittedSearch) setRefreshNumber((value) => value + 1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setSubmittedSearch('');
  };

  const handleRefresh = () => setRefreshNumber((value) => value + 1);

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.pokeballLine} />
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>PokeAPI • Expo SDK 56</Text>
              <Text style={styles.title}>Pokédex</Text>
              <Text style={styles.subtitle}>Explore toda a Pokédex com informações reais da API.</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeNumber}>{totalCount || '—'}</Text>
              <Text style={styles.badgeText}>espécies</Text>
            </View>
          </View>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            onSubmit={handleSearch}
            onClear={handleClearSearch}
            loading={loading}
          />
        </View>

        <TypeFilter selectedType={selectedType} onSelect={setSelectedType} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catálogo</Text>
          <Text style={styles.sectionCounter}>{resultCount} resultados • {pokemons.length} exibidos</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={handleRefresh} style={styles.errorButton}>
              <Text style={styles.errorButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color="#EF4444" />
            <Text style={styles.loadingText}>Consultando a PokeAPI...</Text>
          </View>
        ) : (
          <FlatList
            data={pokemons}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <PokemonCard pokemon={item} onPress={onSelectPokemon} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor="#EF4444" />
            }
            ListEmptyComponent={
              !error ? (
                <EmptyState
                  title="Nenhum Pokémon encontrado"
                  message="Tente outro nome, número ou tipo. A busca consulta o catálogo inteiro."
                  actionLabel="Limpar busca"
                  onAction={handleClearSearch}
                />
              ) : null
            }
            ListFooterComponent={
              moreError ? (
                <View style={styles.footerLoading}>
                  <Text style={styles.footerText}>{moreError}</Text>
                  <Pressable style={styles.errorButton} onPress={handleRetryMore}>
                    <Text style={styles.errorButtonText}>Tentar novamente</Text>
                  </Pressable>
                </View>
              ) : loadingMore ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator color="#EF4444" />
                  <Text style={styles.footerText}>Carregando mais Pokémon...</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? 10 : 0
  },
  container: {
    flex: 1,
    paddingHorizontal: 16
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    //marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4
  },
  pokeballLine: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 34,
    borderColor: '#F1F5F9',
    top: -122,
    right: -86
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18
  },
  eyebrow: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  title: {
    color: '#0F172A',
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
    letterSpacing: -1.4,
    marginTop: 4
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    marginTop: 5,
    maxWidth: 260
  },
  badge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 82
  },
  badgeNumber: {
    color: '#B91C1C',
    fontSize: 20,
    fontWeight: '900'
  },
  badgeText: {
    color: '#991B1B',
    fontSize: 10,
    fontWeight: '900'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 21,
    fontWeight: '900'
  },
  sectionCounter: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900'
  },
  listContent: {
    paddingBottom: 28
  },
  columnWrapper: {
    gap: 0
  },
  loadingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '800'
  },
  footerLoading: {
    paddingVertical: 22,
    alignItems: 'center',
    gap: 8
  },
  footerText: {
    color: '#64748B',
    fontWeight: '800'
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  errorText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '800'
  },
  errorButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900'
  }
});
