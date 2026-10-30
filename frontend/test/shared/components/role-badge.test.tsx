import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RoleBadge from '@shared/components/components-parts/RoleBadge';

describe('RoleBadge', () => {
  it('renders a normalized role label', () => {
    render(<RoleBadge value="admin" />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('renders support as a role', () => {
    render(<RoleBadge isSupport />);

    expect(screen.getByText('Support')).toBeInTheDocument();
  });
});
