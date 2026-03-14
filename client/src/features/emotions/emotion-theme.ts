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
  stress: '#f97316',
  guilt: '#14b8a6',
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
  stress: {
    viewBackgroundClassName: 'bg-orange-500/10',
    cardClassName:
      'border-orange-400/45 bg-orange-500/20 hover:bg-orange-500/25',
    scriptureContainerClassName: 'border-orange-400/45 bg-orange-500/10',
    scriptureContextClassName: 'border-orange-400/45 bg-orange-500/10',
    badgeClassName: 'bg-orange-500/12 text-orange-900',
    controlClassName:
      'border border-orange-400/45 bg-orange-500/10 text-orange-900 hover:bg-orange-500/10 hover:text-orange-900',
    referenceClassName: 'text-orange-900',
  },
  guilt: {
    viewBackgroundClassName: 'bg-teal-500/10',
    cardClassName: 'border-teal-400/45 bg-teal-500/20 hover:bg-teal-500/25',
    scriptureContainerClassName: 'border-teal-400/45 bg-teal-500/10',
    scriptureContextClassName: 'border-teal-400/45 bg-teal-500/10',
    badgeClassName: 'bg-teal-500/12 text-teal-900',
    controlClassName:
      'border border-teal-400/45 bg-teal-500/10 text-teal-900 hover:bg-teal-500/10 hover:text-teal-900',
    referenceClassName: 'text-teal-900',
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
