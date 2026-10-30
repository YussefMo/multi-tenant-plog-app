import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Page from './page';

describe('owner app route', () => {
  it('renders the owner placeholder', () => {
    render(<Page />);

    expect(screen.getByRole('heading', { name: /owner frontend/i })).toBeInTheDocument();
  });
});
