import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Movie from '../Movie';
import { vi } from 'vitest';

// Mock AuthContext to avoid Firebase dependencies
vi.mock('../../utils/AuthContext', () => ({
  UserAuth: () => ({ user: null }),
}));

// Minimal smoke test for Movie component
describe('Movie component', () => {
  const item = {
    id: 123,
    title: 'Test Movie',
    backdrop_path: '/test.jpg',
  };

  it('renders the image and title', () => {
    render(<Movie item={item} />);
    const img = screen.getByAltText('Test Movie');
    expect(img).toBeTruthy();
  });

  it('has a save button with accessible name', () => {
    render(<Movie item={item} />);
    const btn = screen.getByRole('button', { name: /save show/i });
    expect(btn).toBeTruthy();
  });
});
