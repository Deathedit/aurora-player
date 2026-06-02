import { NavLink } from 'react-router-dom';
import { Library, Disc3, Settings } from 'lucide-react';
import { NAV_ITEMS, SETTINGS } from '@/constants/text';
import { Box, chakra } from '@chakra-ui/react';

const icons = {
  '/': Library,
  '/albums': Disc3,
  '/settings': Settings,
} as const;

const ChakraNavLink = chakra(NavLink);

const activeCss = {
  '&[aria-current=page]': {
    color: 'var(--chakra-colors-primary)',
  },
} as const;

export function TabBar() {
  return (
    <Box
      as="nav"
      layerStyle="glass"
      position="fixed"
      insetX={0}
      bottom={0}
      zIndex={50}
      h="14"
      borderTopWidth="1px"
      display={{ base: 'flex', md: 'none' }}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = icons[item.path as keyof typeof icons];
        return (
          <ChakraNavLink
            key={item.path}
            to={item.path}
            flex="1"
            display="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="center"
            gap="0.5"
            fontSize="0.65rem"
            fontWeight="medium"
            transition="colors"
            color="mutedForeground"
            css={activeCss}
          >
            <Icon size={20} />
            {item.label}
          </ChakraNavLink>
        );
      })}
      <ChakraNavLink
        to="/settings"
        flex="1"
        display="flex"
        flexDir="column"
        alignItems="center"
        justifyContent="center"
        gap="0.5"
        fontSize="0.65rem"
        fontWeight="medium"
        transition="colors"
        color="mutedForeground"
        css={activeCss}
      >
        <Settings size={20} />
        {SETTINGS}
      </ChakraNavLink>
    </Box>
  );
}
