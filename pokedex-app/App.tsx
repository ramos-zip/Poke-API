import React, { useState } from 'react';
import { HomeScreen } from './src/screens/HomeScreen';
import { DetailsScreen } from './src/screens/DetailsScreen';
import { PokemonSummary } from './src/types/pokemon';

export default function App() {
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonSummary | null>(null);

  if (selectedPokemon) {
    return <DetailsScreen pokemon={selectedPokemon} onBack={() => setSelectedPokemon(null)} />;
  }

  return <HomeScreen onSelectPokemon={setSelectedPokemon} />;
}
