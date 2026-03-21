import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/hooks/use-theme';
import { getContrastTextColor } from '@/lib/utils/brand-colors';

interface TabsContextValue {
    activeValue: string;
    setActiveValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
    value?: string;
    onValueChange?: (value: string) => void;
    defaultValue?: string;
    children: React.ReactNode;
    className?: string;
}

export function Tabs({ value, onValueChange, defaultValue, children, className }: TabsProps) {
    const isControlled = typeof value === 'string' && typeof onValueChange === 'function';
    const [uncontrolledValue, setUncontrolledValue] = useState<string>(defaultValue ?? '');

    const activeValue = isControlled ? (value as string) : uncontrolledValue;
    const setActiveValue = useCallback((v: string) => {
        if (isControlled) {
            (onValueChange as (value: string) => void)(v);
        } else {
            setUncontrolledValue(v);
        }
    }, [isControlled, onValueChange]);

    const contextValue = useMemo(() => ({ activeValue, setActiveValue }), [activeValue, setActiveValue]);

    return (
        <TabsContext.Provider value={contextValue} >
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn('inline-flex items-center mb-4 justify-center rounded-alinma-md p-1 bg-primary/5', className)}
        >
            {children}
        </div>
    );
}

interface TabsTriggerProps {
    value: string;
    children: React.ReactNode;
    className?: string;
    discount?: boolean;
}

export function TabsTrigger({ value, children, className, discount = false }: TabsTriggerProps) {
    const ctx = useContext(TabsContext);
    if (!ctx) throw new Error('TabsTrigger must be used within Tabs');
    const isActive = ctx.activeValue === value;
    
    const theme = useTheme();
    const tabsConfig = theme.tabs || { indicatorColor: 'primary', autoContrast: true };
    const indicatorColorName = tabsConfig.indicatorColor || 'primary';
    const autoContrast = tabsConfig.autoContrast !== false; // Default to true
    const has3dEffect = theme.effects?.includes('3d') ?? false;

    // Get indicator color value from theme
    const indicatorColor = theme.colors[indicatorColorName] || theme.colors.primary || '#1B1717';
    
    // Determine text color based on indicator darkness if autoContrast is enabled
    const getTextColorStyle = () => {
        if (!isActive) {
            return { color: undefined }; // Use default text-primary/80 class
        }
        
        if (autoContrast && indicatorColor) {
            const contrastColor = getContrastTextColor(indicatorColor);
            return { color: contrastColor };
        }
        
        return { color: undefined }; // Use default text-primary class
    };
    
    const textColorStyle = getTextColorStyle();
    
    return (
        <button
            type="button"
            onClick={() => ctx.setActiveValue(value)}
            className={cn(
                'relative w-fit px-4 py-2  text-sm font-heading font-medium capitalize',
                'transition-colors duration-200',
                'inline-flex min-w-20 items-center justify-center whitespace-nowrap rounded-alinma-sm',
                'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                discount && 'flex items-center justify-center gap-2.5',
                !isActive && 'font-sans',
                !isActive && 'text-primary/80',
                !textColorStyle.color && isActive && 'text-primary',
                className
            )}
            style={textColorStyle.color ? textColorStyle : undefined}
        >
            <span className="relative z-10">{children}</span>
            {isActive && (
                <motion.span
                    layoutId="tab"
                    transition={{ type: "spring", duration: 0.4 }}
                    className="absolute inset-0 z-0 rounded-alinma-sm"
                    style={has3dEffect ? {
                        background: `linear-gradient(180deg, color-mix(in oklch, ${indicatorColor} 82%, white 18%) 0%, ${indicatorColor} 45%, color-mix(in oklch, ${indicatorColor} 78%, black 22%) 100%)`,
                        border: `1px solid color-mix(in oklch, ${indicatorColor} 70%, white 30%)`,
                        boxShadow: `inset 0 1px 0 0 color-mix(in oklch, ${indicatorColor} 50%, white 50%), inset 0 -1px 0 0 color-mix(in oklch, ${indicatorColor} 68%, black 32%), 0 3px 10px 0 color-mix(in oklch, ${indicatorColor} 45%, transparent)`,
                    } : {
                        backgroundColor: indicatorColor,
                    }}
                />
            )}
            {discount && (
                <Badge
                    variant="secondary"
                    className={cn(
                        "relative z-10 whitespace-nowrap",
                        isActive && "bg-muted"
                    )}
                >
                    Save 35%
                </Badge>
            )}
        </button>
    );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
    const ctx = useContext(TabsContext);
    if (!ctx) throw new Error('TabsContent must be used within Tabs');
    if (ctx.activeValue !== value) return null;
    return <div className={className}>{children}</div>;
}

export default {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
};


