import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  conditions: {
    spotify: '.spotify &',
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
        background: {
          value: { base: '#0a0a0f', _spotify: '#121212' },
        },
        foreground: {
          value: { base: '#f4f4f8', _spotify: '#ffffff' },
        },
        card: {
          value: { base: '#14141c', _spotify: '#181818' },
        },
        cardForeground: {
          value: { base: '#f4f4f8', _spotify: '#ffffff' },
        },
        popover: {
          value: { base: '#1c1c26', _spotify: '#282828' },
        },
        popoverForeground: {
          value: { base: '#f4f4f8', _spotify: '#ffffff' },
        },
        primary: {
          value: { base: '#8b5cf6', _spotify: '#1db954' },
        },
        primaryForeground: {
          value: { base: '#0a0a0f', _spotify: '#000000' },
        },
        primary2: {
          value: { base: '#ff5ca8', _spotify: '#1ed760' },
        },
        secondary: {
          value: { base: '#232330', _spotify: '#232323' },
        },
        secondaryForeground: {
          value: { base: '#f4f4f8', _spotify: '#ffffff' },
        },
        muted: {
          value: { base: '#232330', _spotify: '#282828' },
        },
        mutedForeground: {
          value: { base: '#9a9aa8', _spotify: '#b3b3b3' },
        },
        accent: {
          value: { base: '#2a2a3a', _spotify: '#2a2a2a' },
        },
        accentForeground: {
          value: { base: '#f4f4f8', _spotify: '#ffffff' },
        },
        destructive: {
          value: { base: '#ff5c5c', _spotify: '#ff5c5c' },
        },
        success: {
          value: { base: '#36d399', _spotify: '#1db954' },
        },
        border: {
          value: {
            base: 'rgba(255, 255, 255, 0.08)',
            _spotify: 'rgba(255, 255, 255, 0.1)',
          },
        },
        input: {
          value: {
            base: 'rgba(255, 255, 255, 0.12)',
            _spotify: 'rgba(255, 255, 255, 0.1)',
          },
        },
        ring: {
          value: { base: '#8b5cf6', _spotify: '#1db954' },
        },
        elevated: {
          value: { base: '#1c1c26', _spotify: '#1a1a1a' },
        },
        sidebar: {
          value: { base: '#0a0a0f', _spotify: '#000000' },
        },
        sidebarForeground: {
          value: { base: '#f4f4f8', _spotify: '#ffffff' },
        },
        sidebarPrimary: {
          value: { base: '#8b5cf6', _spotify: '#1db954' },
        },
        sidebarPrimaryForeground: {
          value: { base: '#0a0a0f', _spotify: '#000000' },
        },
        sidebarAccent: {
          value: { base: '#232330', _spotify: '#282828' },
        },
        sidebarAccentForeground: {
          value: { base: '#f4f4f8', _spotify: '#ffffff' },
        },
        sidebarBorder: {
          value: {
            base: 'rgba(255, 255, 255, 0.08)',
            _spotify: 'rgba(255, 255, 255, 0.1)',
          },
        },
        sidebarRing: {
          value: { base: '#8b5cf6', _spotify: '#1db954' },
        },
        accentGradientStart: {
          value: { base: '#8B5CF6', _spotify: '#1db954' },
        },
        accentGradientEnd: {
          value: { base: '#FF5CA8', _spotify: '#1ed760' },
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
  },
});

export const system = createSystem(defaultConfig, config);
