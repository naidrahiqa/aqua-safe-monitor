import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback ?? (
                    <div className="min-h-screen bg-surface flex items-center justify-center p-8">
                        <div className="glass-panel rounded-2xl p-8 max-w-md text-center">
                            <div className="text-4xl mb-4">⚠️</div>
                            <h2 className="text-xl font-bold text-text-primary mb-2">
                                Terjadi Kesalahan
                            </h2>
                            <p className="text-text-secondary text-sm mb-4">
                                {this.state.error?.message ?? 'Unknown error'}
                            </p>
                            <button
                                onClick={() => {
                                    this.setState({ hasError: false, error: null });
                                    window.location.reload();
                                }}
                                className="px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-colors text-sm font-medium"
                            >
                                Muat Ulang
                            </button>
                        </div>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}
