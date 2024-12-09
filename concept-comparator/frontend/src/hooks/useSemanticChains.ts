import { useQuery } from '@tanstack/react-query';
import { getSemanticChains } from '../api/client';

interface SemanticChain {
  path: string[];
  scores: number[];
  total_score: number;
}

interface SemanticChainsResponse {
  chains: SemanticChain[];
  family: string;
  concepts: [string, string];
}

export const useSemanticChains = (
  concept1: string | null,
  concept2: string | null,
  family: string | null,
) => {
  return useQuery<SemanticChainsResponse | null>({
    queryKey: ['semantic-chains', concept1, concept2, family],
    queryFn: async () => {
      if (!concept1 || !concept2 || !family) return null;
      return getSemanticChains(concept1, concept2, family);
    },
    enabled: Boolean(concept1 && concept2 && family),
    staleTime: Infinity
  });
};