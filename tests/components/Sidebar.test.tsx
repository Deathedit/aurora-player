// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@/theme/system';
import { Sidebar } from '@/components/layout/Sidebar';

function renderSidebar(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <ChakraProvider value={system}>{ui}</ChakraProvider>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('Sidebar collapse toggle', () => {
  it('exposes an Expand label and aria-expanded=false when collapsed', () => {
    const onToggle = vi.fn();
    renderSidebar(<Sidebar collapsed onToggle={onToggle} />);
    const btn = screen.getByRole('button', { hidden: true });

    expect(btn.getAttribute('aria-label')).toBe('Expand sidebar');
    expect(btn.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('exposes a Collapse label and aria-expanded=true when expanded', () => {
    renderSidebar(<Sidebar collapsed={false} onToggle={vi.fn()} />);
    const btn = screen.getByRole('button', { hidden: true });

    expect(btn.getAttribute('aria-label')).toBe('Collapse sidebar');
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });
});
