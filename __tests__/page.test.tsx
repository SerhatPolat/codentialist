import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '@/app/page';
import { useSession, signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { project } from '@/projectInfo';

// Mock next/navigation and next-auth/react
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;
const mockAlert = jest.fn();
global.alert = mockAlert;
const mockSessionStorage = (() => {
    let store: { [key: string]: string } = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();
Object.defineProperty(global, 'sessionStorage', { value: mockSessionStorage });

describe('Home Page', () => {
  beforeEach(() => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((param) => (param === 'callbackUrl' ? '/' : null)),
    });
    mockFetch.mockClear();
    mockAlert.mockClear();
    mockSessionStorage.clear();
  });

  it('renders loading state initially', () => {
    (useSession as jest.Mock).mockReturnValue({ data: null, status: 'loading' });
    render(<Home />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders sign-in screen when not authenticated', () => {
    (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });
    render(<Home />);
    expect(screen.getByText(project.title)).toBeInTheDocument();
    expect(screen.getByText('Sign In With GitHub')).toBeInTheDocument();
  });

  it('calls signIn when "Sign In With GitHub" button is clicked', () => {
    (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });
    render(<Home />);
    fireEvent.click(screen.getByText('Sign In With GitHub'));
    expect(signIn).toHaveBeenCalledWith('github', { callbackUrl: '/' });
  });

  it('renders repository input when authenticated but no active repo', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: 'Test User' }, accessToken: 'test-token' },
      status: 'authenticated',
    });
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g., SerhatPolat/codentialist')).toBeInTheDocument();
      expect(screen.getByText('Verify Access & Open Board')).toBeInTheDocument();
    });
  });

  it('shows alert for invalid repository format', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: 'Test User' }, accessToken: 'test-token' },
      status: 'authenticated',
    });
    render(<Home />);

    const repoInput = screen.getByPlaceholderText('e.g., SerhatPolat/codentialist');
    fireEvent.change(repoInput, { target: { value: 'invalid-repo' } });
    fireEvent.click(screen.getByText('Verify Access & Open Board'));

    expect(mockAlert).toHaveBeenCalledWith('Please enter a valid format execution string (e.g., owner/repo-name)');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('verifies repository access and loads tasks', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: 'Test User' }, accessToken: 'test-token' },
      status: 'authenticated',
    });
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }) // GitHub repo check
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([{ _id: '1', title: 'Task 1', description: 'Desc 1', status: 'Pending', repository: 'owner/repo', filesSnapshot: [] }]) }); // API tasks fetch

    render(<Home />);

    const repoInputField = screen.getByPlaceholderText('e.g., SerhatPolat/codentialist');
    fireEvent.change(repoInputField, { target: { value: 'owner/repo' } });
    fireEvent.click(screen.getByText('Verify Access & Open Board'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Active Sandbox: owner/repo')).toBeInTheDocument();
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
  });

  it('shows alert if repository access is denied', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: 'Test User' }, accessToken: 'test-token' },
      status: 'authenticated',
    });
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: 'Forbidden' });

    render(<Home />);

    const repoInputField = screen.getByPlaceholderText('e.g., SerhatPolat/codentialist');
    fireEvent.change(repoInputField, { target: { value: 'owner/denied-repo' } });
    fireEvent.click(screen.getByText('Verify Access & Open Board'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockAlert).toHaveBeenCalledWith("Access Denied: Invalid repository or you don't have permission for this GitHub repository.");
    });
  });
});
