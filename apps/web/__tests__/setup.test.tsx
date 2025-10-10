import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

function TestComponent() {
  return <div>Hello Test</div>;
}

describe('Vitest Setup', () => {
  it('renders React components correctly', () => {
    render(<TestComponent />);
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });
  
  it('supports TypeScript', () => {
    const message: string = 'TypeScript works';
    expect(message).toBe('TypeScript works');
  });
});
