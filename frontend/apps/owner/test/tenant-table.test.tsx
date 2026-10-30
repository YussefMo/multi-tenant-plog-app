import type { ReactElement } from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TenantTable from '@/components/tenant/TenantTable';
import type { Tenant } from '@/lib/types/tenant.type';
import { renderOwner } from './utils';

const tenant: Tenant = {
  id: 7,
  name: 'Acme Inc',
  category: 'Technology',
  allow_support: true,
  is_due: false,
  deleted_at: null,
  created_at: '2026-10-01T00:00:00+00:00',
};

function renderTable(ui: ReactElement) {
  return renderOwner(ui);
}

describe('TenantTable', () => {
  it('shows an empty state when there are no tenants', () => {
    renderTable(<TenantTable tenants={[]} />);

    expect(screen.getByText('No tenants yet')).toBeInTheDocument();
  });

  it('renders tenant rows and status badges', () => {
    renderTable(<TenantTable tenants={[tenant]} />);

    expect(screen.getByText('Acme Inc')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('renders recovery actions for deleted tenants', () => {
    renderTable(
      <TenantTable
        tenants={[{ ...tenant, deleted_at: '2026-10-05T00:00:00+00:00' }]}
        mode="trashed"
      />,
    );

    expect(screen.getByLabelText('Restore')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete forever')).toBeInTheDocument();
    expect(screen.queryByLabelText('View tenant')).not.toBeInTheDocument();
  });

  it('renders the loading skeleton instead of the empty state', () => {
    renderTable(<TenantTable tenants={[]} isLoading />);

    expect(screen.queryByText('No tenants yet')).not.toBeInTheDocument();
  });
});
