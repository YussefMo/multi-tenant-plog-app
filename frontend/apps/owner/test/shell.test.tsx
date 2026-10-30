import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ConsoleSidebar from '@/layout/ConsoleSidebar';
import { renderOwner } from './utils';

describe('ConsoleSidebar', () => {
  it('renders every owner console navigation item', () => {
    renderOwner(<ConsoleSidebar />);

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Tenants' })).toHaveAttribute('href', '/tenants');
    expect(screen.getByRole('link', { name: 'Plans' })).toHaveAttribute('href', '/plans');
    expect(screen.getByRole('link', { name: 'Billing' })).toHaveAttribute('href', '/billing');
    expect(screen.getByRole('link', { name: 'Transactions' })).toHaveAttribute(
      'href',
      '/billing/transactions',
    );
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
  });
});
