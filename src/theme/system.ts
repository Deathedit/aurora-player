import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  conditions: {
    noGlass: '.no-glass &',
  },
  theme: {
    tokens: {
      fonts: {
        body: { value: "'Inter Variable', system-ui, sans-serif" },
        heading: { value: "'Inter Variable', system-ui, sans-serif" },
      },
      radii: {
        sm: { value: 'calc(0.75rem * 0.6)' },
        md: { value: 'calc(0.75rem * 0.8)' },
        lg: { value: '0.75rem' },
        xl: { value: 'calc(0.75rem * 1.4)' },
        '2xl': { value: 'calc(0.75rem * 1.8)' },
        '3xl': { value: 'calc(0.75rem * 2.2)' },
        '4xl': { value: 'calc(0.75rem * 2.6)' },
      },
      colors: {
        aurora: {
          purple: { value: '#8B5CF6' },
          pink: { value: '#FF5CA8' },
          green: { value: '#1db954' },
        },
      },
    },
    semanticTokens: {
      colors: {
        background: { value: '#121212' },
        foreground: { value: '#ffffff' },
        card: { value: '#181818' },
        cardForeground: { value: '#ffffff' },
        popover: { value: '#282828' },
        popoverForeground: { value: '#ffffff' },
        primary: { value: '#1db954' },
        primaryForeground: { value: '#000000' },
        primary2: { value: '#1ed760' },
        secondary: { value: '#232323' },
        secondaryForeground: { value: '#ffffff' },
        muted: { value: '#282828' },
        mutedForeground: { value: '#b3b3b3' },
        accent: { value: '#2a2a2a' },
        accentForeground: { value: '#ffffff' },
        destructive: { value: '#ff5c5c' },
        success: { value: '#1db954' },
        border: { value: 'rgba(255, 255, 255, 0.1)' },
        input: { value: 'rgba(255, 255, 255, 0.1)' },
        ring: { value: '#1db954' },
        elevated: { value: '#1a1a1a' },
        sidebar: { value: '#000000' },
        sidebarForeground: { value: '#ffffff' },
        sidebarPrimary: { value: '#1db954' },
        sidebarPrimaryForeground: { value: '#000000' },
        sidebarAccent: { value: '#282828' },
        sidebarAccentForeground: { value: '#ffffff' },
        sidebarBorder: { value: 'rgba(255, 255, 255, 0.1)' },
        sidebarRing: { value: '#1db954' },
        accentGradientStart: { value: '#1db954' },
        accentGradientEnd: { value: '#1ed760' },
        primaryTint: {
          value: 'color-mix(in srgb, {colors.primary} 8%, transparent)',
        },
        primaryTintStrong: {
          value: 'color-mix(in srgb, {colors.primary} 12%, transparent)',
        },
      },
    },
    keyframes: {
      equalizer1: {
        '0%, 100%': { height: '3px' },
        '50%': { height: '12px' },
      },
      equalizer2: {
        '0%, 100%': { height: '5px' },
        '50%': { height: '14px' },
      },
      equalizer3: {
        '0%, 100%': { height: '4px' },
        '50%': { height: '10px' },
      },
    },
    layerStyles: {
      glass: {
        value: {
          background: 'color-mix(in oklch, {colors.sidebar} / 72%, transparent)',
          backdropFilter: 'blur(24px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
          borderColor: '{colors.border}',
          _noGlass: {
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            background: '{colors.elevated}',
          },
        },
      },
      glassSidebar: {
        value: {
          background: 'color-mix(in oklch, {colors.sidebar} / 80%, transparent)',
          backdropFilter: 'blur(24px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
          _noGlass: {
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            background: '{colors.elevated}',
          },
        },
      },
      glassElevated: {
        value: {
          background: 'color-mix(in oklch, {colors.elevated} / 70%, transparent)',
          backdropFilter: 'blur(24px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
          _noGlass: {
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            background: '{colors.background}',
          },
        },
      },
      glassBackdrop: {
        value: {
          background: 'color-mix(in oklch, {colors.background} / 40%, transparent)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          _noGlass: {
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            background: 'rgba(0, 0, 0, 0.6)',
          },
        },
      },
      accentGradient: {
        value: {
          background: 'linear-gradient(120deg, {colors.accentGradientStart}, {colors.accentGradientEnd})',
        },
      },
      accentGradientText: {
        value: {
          background: 'linear-gradient(120deg, {colors.accentGradientStart}, {colors.accentGradientEnd})',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
      },
      scrollbarHidden: {
        value: {
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      },
    },
  },
  globalCss: {
    '*': {
      boxSizing: 'border-box',
    },
    body: {
      bg: 'background',
      color: 'foreground',
      fontFamily: "'Inter Variable', system-ui, sans-serif",
    },
    html: {
      fontFamily: "'Inter Variable', system-ui, sans-serif",
    },
    ':focus-visible': {
      outline: '2px solid {colors.ring}',
      outlineOffset: '2px',
    },
    '.equalizer-bar': {
      '@media (prefers-reduced-motion: reduce)': {
        animation: 'none !important',
        height: '4px !important',
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
