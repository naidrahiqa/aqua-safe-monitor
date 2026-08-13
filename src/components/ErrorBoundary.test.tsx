import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

function ThrowingComponent() {
    throw new Error('Test error');
}

function WorkingComponent() {
    return <div>Works!</div>;
}

describe('ErrorBoundary', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    it('renders children when no error', () => {
        render(
            <ErrorBoundary>
                <WorkingComponent />
            </ErrorBoundary>,
        );
        expect(screen.getByText('Works!')).toBeInTheDocument();
    });

    it('renders default fallback on error', () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent />
            </ErrorBoundary>,
        );
        expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument();
        expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
        render(
            <ErrorBoundary fallback={<div>Custom Error</div>}>
                <ThrowingComponent />
            </ErrorBoundary>,
        );
        expect(screen.getByText('Custom Error')).toBeInTheDocument();
    });

    it('shows reload button', () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent />
            </ErrorBoundary>,
        );
        expect(screen.getByText('Muat Ulang')).toBeInTheDocument();
    });
});
