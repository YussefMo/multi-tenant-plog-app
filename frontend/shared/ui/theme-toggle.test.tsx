import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../test/render';
import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  it('switches from dark to light', async () => {
    renderWithProviders(<ThemeToggle />);

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));

    fireEvent.click(screen.getByRole('button', { name: /switch to light theme/i }));

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });
});
