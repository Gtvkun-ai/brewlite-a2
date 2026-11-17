import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PwaRegister } from '../components/PwaRegister';

describe('PwaRegister Component (Progressive Web App Install Flow)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // Default matchMedia to non-standalone
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('renders install banner when user visits on non-standalone browser', () => {
    render(<PwaRegister />);

    expect(screen.getByTestId('pwa-install-banner')).toBeInTheDocument();
    expect(screen.getByText('Cài đặt Ứng dụng BrewLite')).toBeInTheDocument();
    expect(screen.getByTestId('pwa-install-btn')).toBeInTheDocument();
    expect(screen.getByTestId('pwa-dismiss-btn')).toBeInTheDocument();
  });

  it('dismisses banner and saves to sessionStorage when "Để sau" is clicked', () => {
    render(<PwaRegister />);

    const dismissBtn = screen.getByTestId('pwa-dismiss-btn');
    fireEvent.click(dismissBtn);

    expect(screen.queryByTestId('pwa-install-banner')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('brewlite_pwa_dismissed')).toBe('1');
  });

  it('opens instruction guide modal when "Cài đặt ngay" is clicked without deferred prompt', () => {
    render(<PwaRegister />);

    const installBtn = screen.getByTestId('pwa-install-btn');
    fireEvent.click(installBtn);

    expect(screen.getByText('Cài đặt BrewLite lên màn hình chính')).toBeInTheDocument();
    expect(screen.getByText('Android (Chrome)')).toBeInTheDocument();
    expect(screen.getByText('iPhone / iPad')).toBeInTheDocument();
    expect(screen.getByText('Máy tính / PC')).toBeInTheDocument();
  });

  it('switches tabs properly between Android, iOS, and PC instructions', () => {
    render(<PwaRegister />);

    fireEvent.click(screen.getByTestId('pwa-install-btn'));

    // Switch to iOS
    fireEvent.click(screen.getByText('iPhone / iPad'));
    expect(screen.getByText(/Mở bằng trình duyệt Safari/i)).toBeInTheDocument();
    expect(screen.getByText(/Nhấn nút Chia sẻ \(Share\)/i)).toBeInTheDocument();

    // Switch to PC
    fireEvent.click(screen.getByText('Máy tính / PC'));
    expect(screen.getByText(/Thanh địa chỉ URL/i)).toBeInTheDocument();

    // Switch back to Android
    fireEvent.click(screen.getByText('Android (Chrome)'));
    expect(screen.getByText(/Mở menu trình duyệt Chrome/i)).toBeInTheDocument();
  });

  it('closes instruction modal when confirm button is clicked', () => {
    render(<PwaRegister />);

    fireEvent.click(screen.getByTestId('pwa-install-btn'));
    expect(screen.getByText('Cài đặt BrewLite lên màn hình chính')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Đã hiểu, đóng hướng dẫn/i));
    expect(screen.queryByText('Cài đặt BrewLite lên màn hình chính')).not.toBeInTheDocument();
  });

  it('opens guide modal when "brewlite:install-pwa" custom event is dispatched', () => {
    render(<PwaRegister />);

    act(() => {
      window.dispatchEvent(new CustomEvent('brewlite:install-pwa'));
    });

    expect(screen.getByText('Cài đặt BrewLite lên màn hình chính')).toBeInTheDocument();
  });

  it('handles native beforeinstallprompt event and triggers prompt when clicked', async () => {
    render(<PwaRegister />);

    const promptMock = vi.fn().mockResolvedValue(undefined);
    const userChoiceMock = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });

    const beforeInstallEvent = new Event('beforeinstallprompt') as any;
    beforeInstallEvent.prompt = promptMock;
    beforeInstallEvent.userChoice = userChoiceMock;

    act(() => {
      window.dispatchEvent(beforeInstallEvent);
    });

    const installBtn = screen.getByTestId('pwa-install-btn');
    await act(async () => {
      fireEvent.click(installBtn);
    });

    expect(promptMock).toHaveBeenCalled();
  });

  it('does not render banner if already running in standalone mode', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<PwaRegister />);
    expect(screen.queryByTestId('pwa-install-banner')).not.toBeInTheDocument();
  });
});
