/**
 * Study state in the URL so a study can be shared or bookmarked, e.g.
 * ?concepts=1277,1673&families=Indo-European&tab=chains&pair=1277,1673
 */
export interface UrlState {
  concepts: string[];
  families: string[];
  tab: string | null;
  pair: [string, string] | null;
}

const list = (value: string | null) =>
  value ? value.split(',').map(v => v.trim()).filter(Boolean) : [];

export function readUrlState(): UrlState {
  const params = new URLSearchParams(window.location.search);
  const pair = list(params.get('pair'));
  return {
    concepts: list(params.get('concepts')),
    families: params.getAll('family'),
    tab: params.get('tab'),
    pair: pair.length === 2 ? [pair[0], pair[1]] : null,
  };
}

export function writeUrlState(update: Partial<UrlState>) {
  const params = new URLSearchParams(window.location.search);
  if (update.concepts) params.set('concepts', update.concepts.join(','));
  if (update.families) {
    params.delete('family');
    update.families.forEach(f => params.append('family', f));
  }
  if (update.tab !== undefined) {
    if (update.tab) params.set('tab', update.tab);
    else params.delete('tab');
  }
  if (update.pair !== undefined) {
    if (update.pair) params.set('pair', update.pair.join(','));
    else params.delete('pair');
  }
  // Keep commas readable in shared links
  const query = params.toString().replace(/%2C/gi, ',');
  window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
}
