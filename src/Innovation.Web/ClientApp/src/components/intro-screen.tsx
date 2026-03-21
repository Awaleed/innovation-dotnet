import React, { useEffect, useRef } from 'react';
import { AnimatedLogo } from './animated-logo';

interface IntroScreenProps {
    onComplete: () => void;
    shouldExit: boolean; // Controlled by parent when page is loaded
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete, shouldExit }) => {
    const hasStartedExit = useRef(false);

    useEffect(() => {
        if (!shouldExit || hasStartedExit.current) return;

        hasStartedExit.current = true;
        // onComplete is called after logo exit animation finishes (800ms)
        const exitTimer = setTimeout(() => {
            onComplete();
        }, 800);

        return () => clearTimeout(exitTimer);
    }, [shouldExit, onComplete]);

    return (
        <div
            className={`fixed inset-0 z-9999 flex items-center justify-center bg-background ${
                shouldExit ? 'animate-overlay-fade-out' : ''
            }`}
            style={{
                willChange: 'opacity',
                backfaceVisibility: 'hidden',
                WebkitFontSmoothing: 'antialiased',
                pointerEvents: shouldExit ? 'none' : 'auto',
            }}
        >
            {/* Background ambient glow - hardware accelerated */}
            <div
                className="pointer-events-none absolute rounded-full bg-primary animate-glow-pulse"
                style={{
                    left: '50%',
                    top: '50%',
                    width: '600px',
                    height: '600px',
                    transform: 'translate(-50%, -50%)',
                    opacity: 0.2,
                    filter: 'blur(100px)',
                    willChange: 'transform, opacity',
                    backfaceVisibility: 'hidden',
                }}
            />

            {/* Logo container - hardware accelerated */}
            <div
                className={`relative z-10 mx-auto px-4 ${shouldExit ? 'animate-logo-exit' : ''}`}
                style={{
                    width: '80vw',
                    maxWidth: '800px',
                    willChange: 'transform, filter',
                    backfaceVisibility: 'hidden',
                }}
            >
                <AnimatedLogo isAnimated={true} />
            </div>
        </div>
    );
};
