export type EmotionTheme = {
  viewBackgroundClassName: string;
  cardClassName: string;
  scriptureContainerClassName: string;
  scriptureContextClassName: string;
  badgeClassName: string;
  controlClassName: string;
  referenceClassName: string;
};

export const emotionColorMap: Record<string, string> = {
  fear: '#6366f1',
  anger: '#ef4444',
  sadness: '#3b82f6',
  anxiety: '#f59e0b',
  loneliness: '#8b5cf6',
  joy: '#eab308',
  peace: '#10b981',
  grief: '#64748b',
  default: '#64748b',
};

const defaultTheme: EmotionTheme = {
  viewBackgroundClassName: 'bg-slate-500/10',
  cardClassName: 'border-slate-300/45 bg-slate-500/20 hover:bg-slate-500/25',
  scriptureContainerClassName: 'border-slate-300/45 bg-slate-500/10',
  scriptureContextClassName: 'border-slate-300/45 bg-slate-500/10',
  badgeClassName: 'bg-slate-500/12 text-slate-700',
  controlClassName:
    'border border-slate-300/45 bg-slate-500/10 text-slate-800 hover:bg-slate-500/10 hover:text-slate-800',
  referenceClassName: 'text-slate-700',
};

const emotionThemeMap: Record<string, EmotionTheme> = {
  fear: {
    viewBackgroundClassName: 'bg-indigo-500/10',
    cardClassName:
      'border-indigo-400/45 bg-indigo-500/20 hover:bg-indigo-500/25',
    scriptureContainerClassName: 'border-indigo-400/45 bg-indigo-500/10',
    scriptureContextClassName: 'border-indigo-400/45 bg-indigo-500/10',
    badgeClassName: 'bg-indigo-500/12 text-indigo-800',
    controlClassName:
      'border border-indigo-400/45 bg-indigo-500/10 text-indigo-800 hover:bg-indigo-500/10 hover:text-indigo-800',
    referenceClassName: 'text-indigo-900',
  },
  anger: {
    viewBackgroundClassName: 'bg-red-500/10',
    cardClassName: 'border-red-400/45 bg-red-500/20 hover:bg-red-500/25',
    scriptureContainerClassName: 'border-red-400/45 bg-red-500/10',
    scriptureContextClassName: 'border-red-400/45 bg-red-500/10',
    badgeClassName: 'bg-red-500/12 text-red-900',
    controlClassName:
      'border border-red-400/45 bg-red-500/10 text-red-900 hover:bg-red-500/10 hover:text-red-900',
    referenceClassName: 'text-red-900',
  },
  sadness: {
    viewBackgroundClassName: 'bg-blue-500/10',
    cardClassName: 'border-blue-400/45 bg-blue-500/20 hover:bg-blue-500/25',
    scriptureContainerClassName: 'border-blue-400/45 bg-blue-500/10',
    scriptureContextClassName: 'border-blue-400/45 bg-blue-500/10',
    badgeClassName: 'bg-blue-500/12 text-blue-900',
    controlClassName:
      'border border-blue-400/45 bg-blue-500/10 text-blue-900 hover:bg-blue-500/10 hover:text-blue-900',
    referenceClassName: 'text-blue-900',
  },
  anxiety: {
    viewBackgroundClassName: 'bg-amber-500/10',
    cardClassName: 'border-amber-400/45 bg-amber-500/20 hover:bg-amber-500/25',
    scriptureContainerClassName: 'border-amber-400/45 bg-amber-500/10',
    scriptureContextClassName: 'border-amber-400/45 bg-amber-500/10',
    badgeClassName: 'bg-amber-500/12 text-amber-900',
    controlClassName:
      'border border-amber-400/45 bg-amber-500/10 text-amber-900 hover:bg-amber-500/10 hover:text-amber-900',
    referenceClassName: 'text-amber-900',
  },
  loneliness: {
    viewBackgroundClassName: 'bg-violet-500/10',
    cardClassName:
      'border-violet-400/45 bg-violet-500/20 hover:bg-violet-500/25',
    scriptureContainerClassName: 'border-violet-400/45 bg-violet-500/10',
    scriptureContextClassName: 'border-violet-400/45 bg-violet-500/10',
    badgeClassName: 'bg-violet-500/12 text-violet-900',
    controlClassName:
      'border border-violet-400/45 bg-violet-500/10 text-violet-900 hover:bg-violet-500/10 hover:text-violet-900',
    referenceClassName: 'text-violet-900',
  },
  joy: {
    viewBackgroundClassName: 'bg-yellow-500/5',
    cardClassName:
      'border-yellow-300/40 bg-yellow-500/12 hover:bg-yellow-500/16',
    scriptureContainerClassName: 'border-yellow-300/40 bg-yellow-500/5',
    scriptureContextClassName: 'border-yellow-300/40 bg-yellow-500/5',
    badgeClassName: 'bg-yellow-500/12 text-yellow-900',
    controlClassName:
      'border border-yellow-300/40 bg-yellow-500/5 text-yellow-900 hover:bg-yellow-500/5 hover:text-yellow-900',
    referenceClassName: 'text-yellow-900',
  },
  peace: {
    viewBackgroundClassName: 'bg-emerald-500/10',
    cardClassName:
      'border-emerald-400/45 bg-emerald-500/20 hover:bg-emerald-500/25',
    scriptureContainerClassName: 'border-emerald-400/45 bg-emerald-500/10',
    scriptureContextClassName: 'border-emerald-400/45 bg-emerald-500/10',
    badgeClassName: 'bg-emerald-500/12 text-emerald-900',
    controlClassName:
      'border border-emerald-400/45 bg-emerald-500/10 text-emerald-900 hover:bg-emerald-500/10 hover:text-emerald-900',
    referenceClassName: 'text-emerald-900',
  },
  grief: {
    viewBackgroundClassName: 'bg-slate-500/10',
    cardClassName: 'border-slate-400/45 bg-slate-500/20 hover:bg-slate-500/25',
    scriptureContainerClassName: 'border-slate-400/45 bg-slate-500/10',
    scriptureContextClassName: 'border-slate-400/45 bg-slate-500/10',
    badgeClassName: 'bg-slate-500/12 text-slate-800',
    controlClassName:
      'border border-slate-400/45 bg-slate-500/10 text-slate-800 hover:bg-slate-500/10 hover:text-slate-800',
    referenceClassName: 'text-slate-800',
  },
};

/** Return the visual theme for a given emotion slug. */
export function getEmotionTheme(slug: string | undefined): EmotionTheme {
  if (!slug) return defaultTheme;
  return emotionThemeMap[slug] ?? defaultTheme;
}
