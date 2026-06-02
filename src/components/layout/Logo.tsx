import { chakra } from '@chakra-ui/react';
import type { HTMLChakraProps } from '@chakra-ui/react';

const ACCENT_START = 'var(--chakra-colors-accent-gradient-start)';
const ACCENT_END = 'var(--chakra-colors-accent-gradient-end)';
const CUT = 'var(--chakra-colors-background)';

export function Logo(props: HTMLChakraProps<'svg'>) {
  return (
    <chakra.svg viewBox="0 0 200 200" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient
          id="auroraLogoGradient"
          x1="40%"
          y1="30%"
          x2="160%"
          y2="170%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={ACCENT_START}>
            <animate attributeName="offset" values="0%;20%;0%" dur="8s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor={ACCENT_END}>
            <animate attributeName="offset" values="80%;100%;80%" dur="8s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>

      <path
        d="M60 140 L100 45 L140 140"
        stroke={ACCENT_END}
        strokeWidth="45"
        strokeLinejoin="round"
        fill="none"
        opacity="0.25"
      >
        <animate attributeName="opacity" values="0.2;0.35;0.2" dur="6s" repeatCount="indefinite" />
      </path>

      <path d="M60 140 L100 45 L140 140" stroke={ACCENT_END} strokeWidth="38" strokeLinejoin="round" fill="none" />

      <path
        d="M60 140 L100 45 L140 140"
        stroke="url(#auroraLogoGradient)"
        strokeWidth="24"
        strokeLinejoin="round"
        fill="none"
      />

      <line x1="72" y1="105" x2="128" y2="105" stroke={CUT} strokeWidth="18" strokeLinecap="round" />
    </chakra.svg>
  );
}
