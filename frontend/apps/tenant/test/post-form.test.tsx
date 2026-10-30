import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PostForm from '@/components/post/PostForm';

describe('PostForm', () => {
  it('validates title and body', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<PostForm mode="create" onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /create post/i }));

    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByText('Body is required.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a valid post', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<PostForm mode="create" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Title'), 'Hello');
    await user.type(screen.getByLabelText('Body'), 'World');
    await user.click(screen.getByRole('button', { name: /create post/i }));

    expect(onSubmit).toHaveBeenCalledWith({ title: 'Hello', body: 'World' });
  });
});
