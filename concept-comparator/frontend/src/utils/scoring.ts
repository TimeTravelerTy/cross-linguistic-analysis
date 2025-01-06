export const calculateEnhancedColexScore = (directScore: number, chains: any[] = []) => {
  if (!chains?.length) return directScore;
  
  // Start with direct colexification score
  let totalScore = directScore;
  
  // Add weighted chain scores with exponential decay based on path length
  chains.forEach(chain => {
    const chainLength = chain.path.length - 1; // Number of steps
    const baseWeight = Math.pow(0.8, chainLength - 1); // Exponential decay for longer paths
    const chainScore = chain.total_score * baseWeight;
    totalScore += chainScore;
  });
  
  // Cap at 1.0 and ensure non-negative
  return Math.min(Math.max(totalScore, 0), 1.0);
};