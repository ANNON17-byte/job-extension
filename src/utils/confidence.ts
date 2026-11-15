export type ConfidenceLevel = 'high' | 'medium' | 'low';

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.85) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

export function getConfidenceColor(score: number): {
  bg: string;
  text: string;
  border: string;
  badge: string;
} {
  const level = getConfidenceLevel(score);
  switch (level) {
    case 'high':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500',
      };
    case 'medium':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500',
      };
    case 'low':
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-500/30',
        badge: 'bg-rose-500',
      };
  }
}

export function getConfidenceLabel(score: number, source?: string): string {
  const percentage = Math.round(score * 100);
  if (source === 'ai_generated') {
    return `AI Suggestion (${percentage}%)`;
  }
  if (score >= 0.95) return `Exact Match (${percentage}%)`;
  if (score >= 0.85) return `High Confidence (${percentage}%)`;
  if (score >= 0.6) return `Semantic Match (${percentage}%)`;
  if (score >= 0.4) return `Probable Match (${percentage}%)`;
  return `Uncertain / Missing (${percentage}%)`;
}

