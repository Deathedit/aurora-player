// @vitest-environment happy-dom
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { VolumeIcon } from '@/components/ui/volume-icon';

afterEach(cleanup);

const icon = (volume: number) => render(<VolumeIcon volume={volume} />).container.querySelector('svg');

describe('VolumeIcon', () => {
  it('shows the muted icon at zero volume', () => {
    expect(icon(0)?.getAttribute('class')).toContain('volume-x');
  });

  it('shows the low icon below half volume', () => {
    expect(icon(0.3)?.getAttribute('class')).toContain('volume-1');
  });

  it('shows the full icon at half volume and above', () => {
    expect(icon(0.8)?.getAttribute('class')).toContain('volume-2');
  });
});
