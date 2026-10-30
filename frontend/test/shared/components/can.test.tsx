import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Can, Cannot } from '@shared/components/app-parts/Can';

describe('Can', () => {
  it('renders children when allowed', () => {
    render(
      <Can allowed>
        <span>Visible</span>
      </Can>,
    );

    expect(screen.getByText('Visible')).toBeInTheDocument();
  });

  it('renders the fallback when not allowed', () => {
    render(
      <Can allowed={false} fallback={<span>Denied</span>}>
        <span>Visible</span>
      </Can>,
    );

    expect(screen.getByText('Denied')).toBeInTheDocument();
  });

  it('renders Cannot when access is denied', () => {
    render(
      <Cannot allowed={false}>
        <span>Inverse</span>
      </Cannot>,
    );

    expect(screen.getByText('Inverse')).toBeInTheDocument();
  });
});
