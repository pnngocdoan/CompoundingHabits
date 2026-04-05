// All colors, spacing, and debug toggles live here.
// Set DEBUG_OUTLINES = true during development to show borderWidth: 1 on all components.

export const DEBUG_OUTLINES = false;

export const FONTS = {
  // Bricolage Grotesque — headings
  heading: {
    extraLight: 'BricolageGrotesque-ExtraLight',
    light:      'BricolageGrotesque-Light',
    regular:    'BricolageGrotesque-Regular',
    medium:     'BricolageGrotesque-Medium',
    semiBold:   'BricolageGrotesque-SemiBold',
    bold:       'BricolageGrotesque-Bold',
    extraBold:  'BricolageGrotesque-ExtraBold',
  },
  // DM Sans — body
  body: {
    thin:             'DMSans-Thin',
    thinItalic:       'DMSans-ThinItalic',
    extraLight:       'DMSans-ExtraLight',
    extraLightItalic: 'DMSans-ExtraLightItalic',
    light:            'DMSans-Light',
    lightItalic:      'DMSans-LightItalic',
    regular:          'DMSans-Regular',
    italic:           'DMSans-Italic',
    medium:           'DMSans-Medium',
    mediumItalic:     'DMSans-MediumItalic',
    semiBold:         'DMSans-SemiBold',
    semiBoldItalic:   'DMSans-SemiBoldItalic',
    bold:             'DMSans-Bold',
    boldItalic:       'DMSans-BoldItalic',
    extraBold:        'DMSans-ExtraBold',
    extraBoldItalic:  'DMSans-ExtraBoldItalic',
    black:            'DMSans-Black',
    blackItalic:      'DMSans-BlackItalic',
  },
};

export const COLORS = {
  bg: '#FFFFFF',
  bgCard: '#F7F7F7',
  bgCardAlt: '#F0F0F0',
  text: '#000000',
  textMuted: '#8A8A8A',
  textSecondary: '#4A4A4A',
  win: '#0BDA51',    // 1.01x days — used sparingly
  winLight: '#7de78b', // for calendar
  loss: '#FF8080',   // 0.99x days — used sparingly
  neutral: '#D4D4D4',
  border: '#D4D4D4',
  separator: '#F0F0F0',
};

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 18,
  xl: 22,
  xxl: 30,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export function withOpacity(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Compound interest formula: V = 1.0 * 1.01^wins * 0.99^losses
export function calcMultiplier(wins: number, losses: number): number {
  return Math.pow(1.01, wins) * Math.pow(0.99, losses);
}

// Reference paths for the graph
export const IDEAL_1_YEAR = Math.pow(1.01, 365); // ~37.7
export const WORST_1_YEAR = Math.pow(0.99, 365); // ~0.03

// Milestone system — maxDays (X cap), maxVal (Y ceiling), heightRatio (% of screen height)
// All three must correspond so the ideal curve always reaches the top at the X cap.
export type Milestone = { maxDays: number; maxVal: number; heightRatio: number };
export function getMilestone(daysElapsed: number): Milestone {
  if (daysElapsed <= 30)  return { maxDays: 30,  maxVal: Math.pow(1.01, 30),  heightRatio: 0.22 };
  if (daysElapsed <= 90)  return { maxDays: 90,  maxVal: Math.pow(1.01, 90),  heightRatio: 0.27 };
  if (daysElapsed <= 365) return { maxDays: 365, maxVal: Math.pow(1.01, 365), heightRatio: 0.35 };
  return                          { maxDays: 730, maxVal: Math.pow(1.01, 730), heightRatio: 0.40 };
}
