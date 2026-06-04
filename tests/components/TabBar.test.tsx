// @vitest-environment happy-dom
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@/theme/system';
import { TabBar } from '@/components/layout/TabBar';
import { NAV_ITEMS, SETTINGS } from '@/constants/text';

afterEach(cleanup);

describe('TabBar', () => {
  it('renders a link for each nav item plus settings', () => {
    render(
      <ChakraProvider value={system}>
        <MemoryRouter>
          <TabBar />
        </MemoryRouter>
      </ChakraProvider>,
    );

    for (const item of NAV_ITEMS) {
      expect(screen.getByText(item.label)).toBeTruthy();
    }
    expect(screen.getByText(SETTINGS)).toBeTruthy();
    expect(document.querySelectorAll('a')).toHaveLength(NAV_ITEMS.length + 1);
  });
});
