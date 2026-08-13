import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkeletonCard from './SkeletonCard';

describe('SkeletonCard', () => {
    it('renders default card skeleton', () => {
        render(<SkeletonCard />);
        const card = document.querySelector('.glass-panel');
        expect(card).toBeInTheDocument();
    });

    it('applies custom height class', () => {
        render(<SkeletonCard height="h-72" />);
        const card = document.querySelector('.glass-panel');
        expect(card?.className).toContain('h-72');
    });

    it('renders row skeleton when rows prop provided', () => {
        render(<SkeletonCard rows={3} />);
        const shimmerElements = document.querySelectorAll('.animate-shimmer');
        expect(shimmerElements.length).toBeGreaterThan(0);
    });

    it('applies animation delay', () => {
        render(<SkeletonCard delay={200} />);
        const card = document.querySelector('.glass-panel');
        expect(card?.getAttribute('style')).toContain('200');
    });
});
