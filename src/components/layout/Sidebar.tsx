import { NavLink } from 'react-router-dom';
import { Library, Disc3, Settings, ChevronsRight, ChevronsLeft } from 'lucide-react';
import { APP_NAME, NAV_ITEMS, SETTINGS, EXPAND_SIDEBAR, COLLAPSE_SIDEBAR } from '@/constants/text';
import { Box, Flex, Text, chakra } from '@chakra-ui/react';
import { Logo } from '@/components/layout/Logo';

const icons = {
  '/': Library,
  '/albums': Disc3,
} as const;

const ChakraNavLink = chakra(NavLink);

const navLinkCss = {
  '&[aria-current=page]': {
    background: 'var(--chakra-colors-primary-tint-strong)',
    color: 'var(--chakra-colors-primary)',
  },
} as const;

const scrollbarHiddenCss = {
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
} as const;

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <Box
      as="aside"
      layerStyle="glassSidebar"
      display={{ base: 'none', md: 'flex' }}
      flexDir="column"
      borderRightWidth="1px"
      borderColor="sidebarBorder"
      position="sticky"
      top={0}
      maxH="calc(100svh - 4rem)"
      overflowY="auto"
      w={collapsed ? '4rem' : '16rem'}
      transition="width 0.2s"
      css={scrollbarHiddenCss}
    >
      <Flex
        h="14"
        flexShrink={0}
        alignItems="center"
        justifyContent={collapsed ? 'center' : undefined}
        gap={collapsed ? undefined : '2.5'}
        px={collapsed ? undefined : '6'}
      >
        <Logo w="8" h="8" flexShrink={0} />
        {!collapsed && (
          <Text fontSize="lg" fontWeight="semibold" letterSpacing="tight" layerStyle="accentGradientText">
            {APP_NAME}
          </Text>
        )}
      </Flex>

      <Box as="nav" flex="1" overflowY="auto" px={collapsed ? '2' : '3'} pt="2" css={scrollbarHiddenCss}>
        <Flex flexDir="column" gap="1">
          {NAV_ITEMS.map((item) => {
            const Icon = icons[item.path as keyof typeof icons];
            return (
              <ChakraNavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                display="flex"
                alignItems="center"
                rounded="lg"
                fontSize="sm"
                fontWeight="medium"
                transition="colors"
                justifyContent={collapsed ? 'center' : undefined}
                px={collapsed ? '0' : '3'}
                py={collapsed ? '2.5' : '2'}
                gap={collapsed ? undefined : '3'}
                color="mutedForeground"
                _hover={{ bg: 'muted', color: 'foreground' }}
                css={navLinkCss}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && item.label}
              </ChakraNavLink>
            );
          })}
        </Flex>
      </Box>

      <Box flexShrink={0} px={collapsed ? '2' : '3'} pt="2" pb="1">
        <chakra.button
          type="button"
          onClick={onToggle}
          title={collapsed ? EXPAND_SIDEBAR : COLLAPSE_SIDEBAR}
          display="flex"
          alignItems="center"
          rounded="lg"
          p="1.5"
          color="foreground"
          transition="colors"
          _hover={{ bg: 'muted' }}
          mx={collapsed ? 'auto' : undefined}
          ml={collapsed ? undefined : 'auto'}
        >
          {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={16} />}
        </chakra.button>
      </Box>

      <Box flexShrink={0} px={collapsed ? '2' : '3'} pt="1" pb="2">
        <ChakraNavLink
          to="/settings"
          title={collapsed ? SETTINGS : undefined}
          display="flex"
          alignItems="center"
          rounded="lg"
          fontSize="sm"
          fontWeight="medium"
          transition="colors"
          justifyContent={collapsed ? 'center' : undefined}
          px={collapsed ? '0' : '3'}
          py={collapsed ? '2.5' : '2'}
          gap={collapsed ? undefined : '3'}
          color="mutedForeground"
          _hover={{ bg: 'muted', color: 'foreground' }}
          css={navLinkCss}
        >
          <Settings size={16} style={{ flexShrink: 0 }} />
          {!collapsed && SETTINGS}
        </ChakraNavLink>
      </Box>
    </Box>
  );
}
