import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TableHeaderRe from '@shared/components/components-parts/TableHeaderRe';
import { Table } from '@shared/ui/table';

function renderHeader(lastColumnAlign?: 'start' | 'end') {
  return render(
    <Table>
      <TableHeaderRe headers={['Name', 'Amount', 'Actions']} lastColumnAlign={lastColumnAlign} />
    </Table>,
  );
}

describe('TableHeaderRe', () => {
  it('left-aligns every header by default', () => {
    renderHeader();

    const headers = screen.getAllByRole('columnheader');

    expect(headers[0]).toHaveClass('text-left');
    expect(headers[1]).toHaveClass('text-left');
    expect(headers[2]).toHaveClass('text-left');
    expect(headers[1]).not.toHaveClass('text-center');
    expect(headers[2]).not.toHaveClass('text-end');
  });

  it('right-aligns the last header when requested', () => {
    renderHeader('end');

    const headers = screen.getAllByRole('columnheader');

    expect(headers[2]).toHaveClass('text-end');
  });
});
