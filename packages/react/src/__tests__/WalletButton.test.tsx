// NOTE: Make sure to install @testing-library/react and @testing-library/jest-dom as devDependencies
import React from 'react';
import { render, fireEvent } from '@testing-library/react';

// Mock the entire useSbcApp hook to avoid context issues
const mockConnect = jest.fn();
jest.mock('../hooks/useSbcApp', () => ({
  useSbcApp: () => ({
    sbcAppKit: { connectWallet: mockConnect },
    refreshAccount: jest.fn(),
  }),
}));

// Mock React hooks to avoid context issues
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(() => [false, jest.fn()]),
}));

import { WalletButton } from '../components/WalletButton';

describe('WalletButton', () => {
  beforeEach(() => {
    mockConnect.mockReset();
    mockConnect.mockResolvedValue({ address: '0x123' });
  });

  it('renders with custom className', () => {
    const { getByRole } = render(
      <WalletButton className="test-class">Connect</WalletButton>
    );
    const btn = getByRole('button');
    expect(btn.className).toMatch(/test-class/);
  });

  it('calls render prop with correct props and renders custom button', () => {
    const renderFn = jest.fn(({ onClick, isConnecting, disabled, children, className }) => (
      <button data-testid="custom-btn" className={className} disabled={disabled} onClick={onClick}>
        Custom: {children}
      </button>
    ));
    const { getByTestId } = render(
      <WalletButton render={renderFn} className="custom-class">Connect Wallet</WalletButton>
    );
    const btn = getByTestId('custom-btn');
    expect(btn).toBeDefined();
    expect(btn.className).toMatch(/custom-class/);
    expect(btn.textContent).toContain('Custom: Connect Wallet');
    // Simulate click
    fireEvent.click(btn);
    expect(mockConnect).toHaveBeenCalled();
  });
}); 