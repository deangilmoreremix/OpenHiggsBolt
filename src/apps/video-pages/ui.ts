/** Class strings for the Video Pages studio, built from this app's tokens (see src/shared/styles/designTokens.ts). */
export const ui = {
  root: 'w-full h-full flex flex-col items-center bg-app-bg relative overflow-hidden',
  body: 'flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-32 px-4 md:px-6 pt-8',
  panel: 'rounded-xl border border-white/5 bg-white/[0.03] p-4',
  card: 'rounded-xl border border-white/5 bg-card-bg p-4',
  label: 'text-[11px] font-bold uppercase tracking-widest text-white/40',
  input: 'w-full bg-white/5 rounded-xl px-3 py-2 border border-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors',
  primary: 'px-4 py-2.5 bg-[#22d3ee] text-black text-xs font-black uppercase tracking-[0.15em] rounded-xl hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2',
  ghost: 'px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-[13px] font-bold text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-colors disabled:opacity-40 inline-flex items-center gap-2',
  danger: 'text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider',
  chip: 'text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20',
  chipMuted: 'text-[10px] font-bold text-white/50 px-2 py-0.5 bg-white/5 rounded border border-white/10',
  error: 'px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]',
  ok: 'px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[12px]',
  tab: (active: boolean) => `relative text-[13px] font-medium whitespace-nowrap px-1 h-9 ${active ? 'text-[#22d3ee]' : 'text-white/50 hover:text-white'}`,
  tabLine: 'absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#22d3ee] to-[#a855f7] rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]',
  pill: (active: boolean) => `flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${active ? 'bg-primary/15 border-primary text-primary' : 'bg-card-bg border-white/5 text-white/40 hover:text-white'}`,
} as const
