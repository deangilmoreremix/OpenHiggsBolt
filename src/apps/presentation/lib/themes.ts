export type ThemeMode = 'light' | 'dark'

export type ThemeName =
  | 'daktilo'
  | 'noir'
  | 'cornflower'
  | 'indigo'
  | 'orbit'
  | 'cosmos'
  | 'piano'
  | 'ebony'
  | 'mystique'
  | 'phantom'
  | 'allweoneLight'
  | 'allweoneDark'
  | 'crimson'
  | 'ember'
  | 'sunset'
  | 'dusk'
  | 'forest'
  | 'canopy'
  | 'aurora'
  | 'borealis'
  | 'sakura'
  | 'midnight'
  | 'ocean'
  | 'abyss'
  | 'sand'
  | 'obsidian'
  | 'mint'
  | 'jade'
  | 'rose'
  | 'wine'
  | 'arctic'
  | 'glacier'
  | 'honey'
  | 'amber'
  | 'coral'
  | 'magma'
  | 'lavender'
  | 'velvet'

export interface ThemeColors {
  primary: string
  accent: string
  background: string
  text: string
  heading: string
  cardBackground: string
}

export interface ThemeFonts {
  heading: string
  body: string
}

export interface ThemeProperties {
  id: ThemeName
  name: string
  description: string
  mode: ThemeMode
  colors: ThemeColors
  fonts: ThemeFonts
  background: string
}

export type Themes = keyof typeof themes

export function isLightTheme(theme: ThemeProperties): boolean {
  return theme.mode === 'light'
}

export function isDarkTheme(theme: ThemeProperties): boolean {
  return theme.mode === 'dark'
}

export function getThemesByMode(mode: ThemeMode): ThemeProperties[] {
  return Object.values(themes).filter((t) => t.mode === mode)
}

export const themes: Record<ThemeName, ThemeProperties> = {
  daktilo: {
    id: 'daktilo',
    name: 'Daktilo',
    description: 'Modern and clean',
    mode: 'light',
    colors: {
      primary: '#3B82F6',
      accent: '#60A5FA',
      background: '#FFFFFF',
      text: '#1F2937',
      heading: '#3B82F6',
      cardBackground: '#F3F4F6',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
    background: `radial-gradient(circle at 10% 10%, #3B82F615 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #60A5FA15 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #1F293710 0%, transparent 50%),
        #FFFFFF`,
  },
  noir: {
    id: 'noir',
    name: 'Noir',
    description: 'Sleek film noir aesthetic',
    mode: 'dark',
    colors: {
      primary: '#60A5FA',
      accent: '#93C5FD',
      background: '#111827',
      text: '#E5E7EB',
      heading: '#60A5FA',
      cardBackground: '#1F2937',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
    background: `radial-gradient(circle at 10% 10%, #60A5FA20 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #93C5FD20 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #E5E7EB15 0%, transparent 50%),
        #111827`,
  },
  cornflower: {
    id: 'cornflower',
    name: 'Cornflower',
    description: 'Professional and bold',
    mode: 'light',
    colors: {
      primary: '#4F46E5',
      accent: '#818CF8',
      background: '#F8FAFC',
      text: '#334155',
      heading: '#4F46E5',
      cardBackground: '#FFFFFF',
    },
    fonts: { heading: 'Poppins', body: 'Source Sans Pro' },
    background: `radial-gradient(circle at 10% 10%, #4F46E515 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #818CF815 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #312E8110 0%, transparent 50%),
        #F8FAFC`,
  },
  indigo: {
    id: 'indigo',
    name: 'Indigo',
    description: 'Deep and immersive',
    mode: 'dark',
    colors: {
      primary: '#818CF8',
      accent: '#A5B4FC',
      background: '#1E1B4B',
      text: '#E2E8F0',
      heading: '#818CF8',
      cardBackground: '#312E81',
    },
    fonts: { heading: 'Poppins', body: 'Source Sans Pro' },
    background: `radial-gradient(circle at 10% 10%, #818CF820 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #A5B4FC20 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #C7D2FE15 0%, transparent 50%),
        #1E1B4B`,
  },
  orbit: {
    id: 'orbit',
    name: 'Orbit',
    description: 'Futuristic and dynamic',
    mode: 'light',
    colors: {
      primary: '#312E81',
      accent: '#3B82F6',
      background: '#FFFFFF',
      text: '#1F2937',
      heading: '#312E81',
      cardBackground: '#F3F4F6',
    },
    fonts: { heading: 'Space Grotesk', body: 'IBM Plex Sans' },
    background: `radial-gradient(circle at 10% 10%, #312E8115 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #3B82F615 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #4338CA10 0%, transparent 50%),
        #FFFFFF`,
  },
  cosmos: {
    id: 'cosmos',
    name: 'Cosmos',
    description: 'Deep space exploration',
    mode: 'dark',
    colors: {
      primary: '#818CF8',
      accent: '#60A5FA',
      background: '#030712',
      text: '#E5E7EB',
      heading: '#818CF8',
      cardBackground: '#111827',
    },
    fonts: { heading: 'Space Grotesk', body: 'IBM Plex Sans' },
    background: `radial-gradient(circle at 10% 10%, #818CF820 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #60A5FA20 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #A5B4FC15 0%, transparent 50%),
        #030712`,
  },
  piano: {
    id: 'piano',
    name: 'Piano',
    description: 'Classic and elegant',
    mode: 'light',
    colors: {
      primary: '#1F2937',
      accent: '#4B5563',
      background: '#F3F4F6',
      text: '#374151',
      heading: '#1F2937',
      cardBackground: '#FFFFFF',
    },
    fonts: { heading: 'Playfair Display', body: 'Lora' },
    background: `radial-gradient(circle at 10% 10%, #1F293715 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #4B556315 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #37415110 0%, transparent 50%),
        #F3F4F6`,
  },
  ebony: {
    id: 'ebony',
    name: 'Ebony',
    description: 'Refined dark elegance',
    mode: 'dark',
    colors: {
      primary: '#E5E7EB',
      accent: '#9CA3AF',
      background: '#111827',
      text: '#E5E7EB',
      heading: '#E5E7EB',
      cardBackground: '#1F2937',
    },
    fonts: { heading: 'Playfair Display', body: 'Lora' },
    background: `radial-gradient(circle at 10% 10%, #E5E7EB20 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #9CA3AF20 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #D1D5DB15 0%, transparent 50%),
        #111827`,
  },
  mystique: {
    id: 'mystique',
    name: 'Mystique',
    description: 'Mysterious and sophisticated',
    mode: 'light',
    colors: {
      primary: '#7C3AED',
      accent: '#8B5CF6',
      background: '#FFFFFF',
      text: '#1F2937',
      heading: '#7C3AED',
      cardBackground: '#F5F3FF',
    },
    fonts: { heading: 'Montserrat', body: 'Raleway' },
    background: `radial-gradient(circle at 10% 10%, #7C3AED15 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #8B5CF615 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #5B21B610 0%, transparent 50%),
        #FFFFFF`,
  },
  phantom: {
    id: 'phantom',
    name: 'Phantom',
    description: 'Ethereal and haunting',
    mode: 'dark',
    colors: {
      primary: '#A78BFA',
      accent: '#C4B5FD',
      background: '#18181B',
      text: '#D4D4D8',
      heading: '#A78BFA',
      cardBackground: '#27272A',
    },
    fonts: { heading: 'Montserrat', body: 'Raleway' },
    background: `radial-gradient(circle at 10% 10%, #A78BFA20 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #C4B5FD20 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #8B5CF615 0%, transparent 50%),
        #18181B`,
  },
  allweoneLight: {
    id: 'allweoneLight',
    name: 'Allweone',
    description: 'Clean and high contrast',
    mode: 'light',
    colors: {
      primary: '#06B6D4',
      accent: '#0EA5E9',
      background: '#FFFFFF',
      text: '#0F172A',
      heading: '#06B6D4',
      cardBackground: '#ECFEFF',
    },
    fonts: { heading: 'JetBrains Mono', body: 'Inter' },
    background: `radial-gradient(circle at 10% 10%, #06B6D415 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #0EA5E915 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #0E749010 0%, transparent 50%),
        #FFFFFF`,
  },
  allweoneDark: {
    id: 'allweoneDark',
    name: 'Allweone',
    description: 'Cyberpunk glow',
    mode: 'dark',
    colors: {
      primary: '#22D3EE',
      accent: '#38BDF8',
      background: '#0F172A',
      text: '#E2E8F0',
      heading: '#22D3EE',
      cardBackground: '#1E293B',
    },
    fonts: { heading: 'JetBrains Mono', body: 'Inter' },
    background: `radial-gradient(circle at 10% 10%, #22D3EE20 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #38BDF820 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #67E8F915 0%, transparent 50%),
        #0F172A`,
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson',
    description: 'Bold and passionate',
    mode: 'light',
    colors: {
      primary: '#DC2626',
      accent: '#F87171',
      background: '#FFFFFF',
      text: '#1F2937',
      heading: '#DC2626',
      cardBackground: '#FEF2F2',
    },
    fonts: { heading: 'Merriweather', body: 'Source Sans Pro' },
    background: `radial-gradient(circle at 10% 10%, #DC262615 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #F8717115 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #991B1B10 0%, transparent 50%),
        #FFFFFF`,
  },
  ember: {
    id: 'ember',
    name: 'Ember',
    description: 'Smoldering intensity',
    mode: 'dark',
    colors: {
      primary: '#F87171',
      accent: '#EF4444',
      background: '#18181B',
      text: '#E5E7EB',
      heading: '#F87171',
      cardBackground: '#27272A',
    },
    fonts: { heading: 'Merriweather', body: 'Source Sans Pro' },
    background: `radial-gradient(circle at 10% 10%, #F8717120 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #EF444420 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #FCA5A515 0%, transparent 50%),
        #18181B`,
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm and inviting',
    mode: 'light',
    colors: {
      primary: '#EA580C',
      accent: '#FB923C',
      background: '#FFFBEB',
      text: '#292524',
      heading: '#EA580C',
      cardBackground: '#FFFFFF',
    },
    fonts: { heading: 'DM Serif Display', body: 'DM Sans' },
    background: `radial-gradient(circle at 10% 10%, #EA580C15 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #FB923C15 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #C2410C10 0%, transparent 50%),
        #FFFBEB`,
  },
  dusk: {
    id: 'dusk',
    name: 'Dusk',
    description: 'Twilight tranquility',
    mode: 'dark',
    colors: {
      primary: '#FB923C',
      accent: '#F97316',
      background: '#1C1917',
      text: '#E7E5E4',
      heading: '#FB923C',
      cardBackground: '#292524',
    },
    fonts: { heading: 'DM Serif Display', body: 'DM Sans' },
    background: `radial-gradient(circle at 10% 10%, #FB923C20 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #F9731620 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #FDBA7415 0%, transparent 50%),
        #1C1917`,
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Natural and serene',
    mode: 'light',
    colors: {
      primary: '#059669',
      accent: '#34D399',
      background: '#F0FDF4',
      text: '#1F2937',
      heading: '#059669',
      cardBackground: '#FFFFFF',
    },
    fonts: { heading: 'Bitter', body: 'Source Sans Pro' },
    background: `radial-gradient(circle at 10% 10%, #05966915 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #34D39915 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #04785710 0%, transparent 50%),
        #F0FDF4`,
  },
  canopy: {
    id: 'canopy',
    name: 'Canopy',
    description: 'Deep forest sanctuary',
    mode: 'dark',
    colors: {
      primary: '#34D399',
      accent: '#10B981',
      background: '#064E3B',
      text: '#E5E7EB',
      heading: '#34D399',
      cardBackground: '#065F46',
    },
    fonts: { heading: 'Bitter', body: 'Source Sans Pro' },
    background: `radial-gradient(circle at 10% 10%, #34D39920 0%, transparent 30%),
        radial-gradient(circle at 90% 20%, #10B98120 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #6EE7B715 0%, transparent 50%),
        #064E3B`,
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora',
    description: 'Northern lights at dawn',
    mode: 'light',
    colors: {
      primary: '#06B6D4',
      accent: '#34D399',
      background: '#F0FDFA',
      text: '#134E4A',
      heading: '#0891B2',
      cardBackground: '#FFFFFF',
    },
    fonts: { heading: 'Quicksand', body: 'Nunito' },
    background: `radial-gradient(circle at 20% 20%, #06B6D420 0%, transparent 40%),
        radial-gradient(circle at 80% 30%, #8B5CF620 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #34D39915 0%, transparent 50%),
        #F0FDFA`,
  },
  borealis: {
    id: 'borealis',
    name: 'Borealis',
    description: 'Northern lights at midnight',
    mode: 'dark',
    colors: {
      primary: '#22D3EE',
      accent: '#4ADE80',
      background: '#0C1222',
      text: '#E2E8F0',
      heading: '#67E8F9',
      cardBackground: '#1E293B',
    },
    fonts: { heading: 'Quicksand', body: 'Nunito' },
    background: `radial-gradient(circle at 20% 20%, #22D3EE25 0%, transparent 40%),
        radial-gradient(circle at 80% 30%, #A78BFA25 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, #4ADE8020 0%, transparent 50%),
        #0C1222`,
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura',
    description: 'Cherry blossom spring',
    mode: 'light',
    colors: {
      primary: '#EC4899',
      accent: '#F472B6',
      background: '#FDF2F8',
      text: '#831843',
      heading: '#BE185D',
      cardBackground: '#FFFFFF',
    },
    fonts: { heading: 'Cormorant Garamond', body: 'Lato' },
    background: `radial-gradient(circle at 10% 10%, #EC489920 0%, transparent 35%),
        radial-gradient(circle at 90% 20%, #F472B620 0%, transparent 40%),
        radial-gradient(circle at 50% 90%, #DB277715 0%, transparent 50%),
        #FDF2F8`,
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    description: 'Moonlit cherry blossoms',
    mode: 'dark',
    colors: {
      primary: '#F472B6',
      accent: '#FDA4AF',
      background: '#1A0A14',
      text: '#FECDD3',
      heading: '#F9A8D4',
      cardBackground: '#2D1F2B',
    },
    fonts: { heading: 'Cormorant Garamond', body: 'Lato' },
    background: `radial-gradient(circle at 10% 10%, #F472B625 0%, transparent 35%),
        radial-gradient(circle at 90% 20%, #FDA4AF20 0%, transparent 40%),
        radial-gradient(circle at 50% 90%, #FB718520 0%, transparent 50%),
        #1A0A14`,
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    description: 'Sunlit tropical waters',
    mode: 'light',
    colors: {
      primary: '#0284C7',
      accent: '#38BDF8',
      background: '#F0F9FF',
      text: '#0C4A6E',
      heading: '#0369A1',
      cardBackground: '#FFFFFF',
    },
    fonts: { heading: 'Outfit', body: 'Work Sans' },
    background: `radial-gradient(circle at 30% 20%, #0284C720 0%, transparent 40%),
        radial-gradient(circle at 70% 60%, #38BDF820 0%, transparent 45%),
        radial-gradient(circle at 50% 90%, #0369A115 0%, transparent 50%),
        #F0F9FF`,
  },
  abyss: {
    id: 'abyss',
    name: 'Abyss',
    description: 'Deep sea mysteries',
    mode: 'dark',
    colors: {
      primary: '#38BDF8',
      accent: '#0EA5E9',
      background: '#020617',
      text: '#BAE6FD',
      heading: '#7DD3FC',
      cardBackground: '#0F172A',
    },
    fonts: { heading: 'Outfit', body: 'Work Sans' },
    background: `radial-gradient(circle at 30% 20%, #38BDF825 0%, transparent 40%),
        radial-gradient(circle at 70% 60%, #0EA5E920 0%, transparent 45%),
        radial-gradient(circle at 50% 90%, #7DD3FC15 0%, transparent 50%),
        #020617`,
  },
  sand: {
    id: 'sand',
    name: 'Sand',
    description: 'Warm desert dunes',
    mode: 'light',
    colors: {
      primary: '#A16207',
      accent: '#CA8A04',
      background: '#FEFCE8',
      text: '#422006',
      heading: '#A16207',
      cardBackground: '#FFFFFF',
    },
    fonts: { heading: 'Fraunces', body: 'Commissioner' },
    background: `radial-gradient(circle at 20% 30%, #A1620715 0%, transparent 40%),
        radial-gradient(circle at 80% 50%, #CA8A0415 0%, transparent 45%),
        radial-gradient(circle at 40% 80%, #854D0E10 0%, transparent 50%),
        #FEFCE8`,
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    description: 'Volcanic glass night',
    mode: 'dark',
    colors: {
      primary: '#FACC15',
      accent: '#EAB308',
      background: '#0A0A0A',
      text: '#E7E5E4',
      heading: '#FDE047',
      cardBackground: '#1C1917',
    },
    fonts: { heading: 'Fraunces', body: 'Commissioner' },
    background: `radial-gradient(circle at 20% 30%, #FACC1520 0%, transparent 40%),
        radial-gradient(circle at 80% 50%, #EAB30820 0%, transparent 45%),
        radial-gradient(circle at 40% 80%, #FDE04715 0%, transparent 50%),
        #0A0A0A`,
  },
  mint: {
    id: 'mint',
    name: 'Mint',
    description: 'Fresh and cool',
    mode: 'light',
    colors: {
      primary: '#10B981',
      accent: '#34D399',
      background: '#ECFDF5',
      text: '#064E3B',
      heading: '#047857',
      cardBackground: '#FFFFFF',
    },
    fonts: { heading: 'Plus Jakarta Sans', body: 'Inter' },
    background: `radial-gradient(circle at 15% 25%, #10B98118 0%, transparent 40%),
        radial-gradient(circle at 85% 35%, #34D39918 0%, transparent 45%),
        radial-gradient(circle at 50% 85%, #05966912 0%, transparent 50%),
        #ECFDF5`,
  },
  jade: {
    id: 'jade',
    name: 'Jade',
    description: 'Precious stone depths',
    mode: 'dark',
    colors: {
      primary: '#34D399',
      accent: '#10B981',
      background: '#022C22',
      text: '#A7F3D0',
      heading: '#6EE7B7',
      cardBackground: '#064E3B',
    },
    fonts: { heading: 'Plus Jakarta Sans', body: 'Inter' },
    background: `radial-gradient(circle at 15% 25%, #34D39922 0%, transparent 40%),
        radial-gradient(circle at 85% 35%, #10B98120 0%, transparent 45%),
        radial-gradient(circle at 50% 85%, #6EE7B715 0%, transparent 50%),
        #022C22`,
  },
  rose: {
    id: 'rose',
    name: 'Rose',
    description: 'Soft romantic petals',
    mode: 'light',
    colors: {
      primary: '#E11D48',
      accent: '#FB7185',
      background: '#FFF1F2',
      text: '#4C0519',
      heading: '#BE123C',
      cardBackground: '#FFFFFF',
    },
    fonts: { heading: 'Libre Baskerville', body: 'Source Serif Pro' },
    background: `radial-gradient(circle at 10% 20%, #E11D4818 0%, transparent 35%),
        radial-gradient(circle at 90% 30%, #FB718518 0%, transparent 40%),
        radial-gradient(circle at 50% 85%, #BE123C12 0%, transparent 50%),
        #FFF1F2`,
  },
  wine: {
    id: 'wine',
    name: 'Wine',
    description: 'Rich burgundy elegance',
    mode: 'dark',
    colors: {
      primary: '#FB7185',
      accent: '#F43F5E',
      background: '#1C0A10',
      text: '#FECDD3',
      heading: '#FDA4AF',
      cardBackground: '#3F1525',
    },
    fonts: { heading: 'Libre Baskerville', body: 'Source Serif Pro' },
    background: `radial-gradient(circle at 10% 20%, #FB718522 0%, transparent 35%),
        radial-gradient(circle at 90% 30%, #F43F5E20 0%, transparent 40%),
        radial-gradient(circle at 50% 85%, #FDA4AF15 0%, transparent 50%),
        #1C0A10`,
  },
  arctic: {
    id: 'arctic',
    name: 'Arctic',
    description: 'Crisp icy morning',
    mode: 'light',
    colors: {
      primary: '#6366F1',
      accent: '#818CF8',
      background: '#EEF2FF',
      text: '#312E81',
      heading: '#4338CA',
      cardBackground: '#FFFFFF',
    },
    fonts: { heading: 'Manrope', body: 'Public Sans' },
    background: `radial-gradient(circle at 25% 25%, #6366F118 0%, transparent 40%),
        radial-gradient(circle at 75% 40%, #818CF818 0%, transparent 45%),
        radial-gradient(circle at 50% 80%, #4F46E512 0%, transparent 50%),
        #EEF2FF`,
  },
  glacier: {
    id: 'glacier',
    name: 'Glacier',
    description: 'Frozen twilight depths',
    mode: 'dark',
    colors: {
      primary: '#A5B4FC',
      accent: '#818CF8',
      background: '#0C0A1D',
      text: '#E0E7FF',
      heading: '#C7D2FE',
      cardBackground: '#1E1B4B',
    },
    fonts: { heading: 'Manrope', body: 'Public Sans' },
    background: `radial-gradient(circle at 25% 25%, #A5B4FC22 0%, transparent 40%),
        radial-gradient(circle at 75% 40%, #818CF820 0%, transparent 45%),
        radial-gradient(circle at 50% 80%, #C7D2FE15 0%, transparent 50%),
        #0C0A1D`,
  },
  honey: {
    id: 'honey',
    name: 'Honey',
    description: 'Golden sweetness',
    mode: 'light',
    colors: {
      primary: '#D97706',
      accent: '#FBBF24',
      background: '#FFFBEB',
      text: '#451A03',
      heading: '#B45309',
      cardBackground: '#FFFFFF',
    },
    fonts: { heading: 'Bricolage Grotesque', body: 'Atkinson Hyperlegible' },
    background: `radial-gradient(circle at 20% 30%, #D9770618 0%, transparent 40%),
        radial-gradient(circle at 80% 40%, #FBBF2418 0%, transparent 45%),
        radial-gradient(circle at 45% 85%, #B4530912 0%, transparent 50%),
        #FFFBEB`,
  },
  amber: {
    id: 'amber',
    name: 'Amber',
    description: 'Fossilized warmth',
    mode: 'dark',
    colors: {
      primary: '#FBBF24',
      accent: '#F59E0B',
      background: '#1A1207',
      text: '#FEF3C7',
      heading: '#FCD34D',
      cardBackground: '#2D2410',
    },
    fonts: { heading: 'Bricolage Grotesque', body: 'Atkinson Hyperlegible' },
    background: `radial-gradient(circle at 20% 30%, #FBBF2422 0%, transparent 40%),
        radial-gradient(circle at 80% 40%, #F59E0B20 0%, transparent 45%),
        radial-gradient(circle at 45% 85%, #FCD34D15 0%, transparent 50%),
        #1A1207`,
  },
  coral: {
    id: 'coral',
    name: 'Coral',
    description: 'Vibrant reef life',
    mode: 'light',
    colors: {
      primary: '#F97316',
      accent: '#FB923C',
      background: '#FFF7ED',
      text: '#431407',
      heading: '#C2410C',
      cardBackground: '#FFFFFF',
    },
    fonts: { heading: 'Sora', body: 'Karla' },
    background: `radial-gradient(circle at 15% 20%, #F9731618 0%, transparent 40%),
        radial-gradient(circle at 85% 35%, #FB923C18 0%, transparent 45%),
        radial-gradient(circle at 50% 80%, #EA580C12 0%, transparent 50%),
        #FFF7ED`,
  },
  magma: {
    id: 'magma',
    name: 'Magma',
    description: 'Molten volcanic fire',
    mode: 'dark',
    colors: {
      primary: '#FB923C',
      accent: '#F97316',
      background: '#1A0F0A',
      text: '#FFEDD5',
      heading: '#FDBA74',
      cardBackground: '#2D1A10',
    },
    fonts: { heading: 'Sora', body: 'Karla' },
    background: `radial-gradient(circle at 15% 20%, #FB923C22 0%, transparent 40%),
        radial-gradient(circle at 85% 35%, #F9731620 0%, transparent 45%),
        radial-gradient(circle at 50% 80%, #FDBA7415 0%, transparent 50%),
        #1A0F0A`,
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender',
    description: 'Calming purple fields',
    mode: 'light',
    colors: {
      primary: '#9333EA',
      accent: '#A855F7',
      background: '#FAF5FF',
      text: '#3B0764',
      heading: '#7E22CE',
      cardBackground: '#FFFFFF',
    },
    fonts: { heading: 'Epilogue', body: 'Rubik' },
    background: `radial-gradient(circle at 10% 25%, #9333EA18 0%, transparent 40%),
        radial-gradient(circle at 90% 35%, #A855F718 0%, transparent 45%),
        radial-gradient(circle at 50% 85%, #7C3AED12 0%, transparent 50%),
        #FAF5FF`,
  },
  velvet: {
    id: 'velvet',
    name: 'Velvet',
    description: 'Luxurious purple night',
    mode: 'dark',
    colors: {
      primary: '#C084FC',
      accent: '#A855F7',
      background: '#120A1C',
      text: '#E9D5FF',
      heading: '#D8B4FE',
      cardBackground: '#2E1A47',
    },
    fonts: { heading: 'Epilogue', body: 'Rubik' },
    background: `radial-gradient(circle at 10% 25%, #C084FC22 0%, transparent 40%),
        radial-gradient(circle at 90% 35%, #A855F720 0%, transparent 45%),
        radial-gradient(circle at 50% 85%, #D8B4FE15 0%, transparent 50%),
        #120A1C`,
  },
}

export const defaultThemeId: ThemeName = 'mystique'

export function getThemeById(id: string | null | undefined): ThemeProperties {
  if (!id) return themes[defaultThemeId]
  return themes[id as ThemeName] ?? themes[defaultThemeId]
}
