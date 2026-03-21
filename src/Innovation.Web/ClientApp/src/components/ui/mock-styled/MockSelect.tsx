import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';

interface SelectOption {
    label: string;
    value: string;
}

interface MockSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export const MockSelect: React.FC<MockSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className = '',
    disabled = false,
}) => {


    return <Select
        value={value}
        onValueChange={
            (value) => {
                onChange(value);
            }
        }
        disabled={disabled}
    >
        <SelectTrigger>
            <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
            {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                    {option.label}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
    // const [isOpen, setIsOpen] = useState(false);
    // const containerRef = useRef<HTMLDivElement>(null);

    // const selectedLabel = options.find((opt) => opt.value === value)?.label;

    // useEffect(() => {
    //     const handleClickOutside = (event: MouseEvent) => {
    //         if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
    //             setIsOpen(false);
    //         }
    //     };

    //     document.addEventListener('mousedown', handleClickOutside);
    //     return () => document.removeEventListener('mousedown', handleClickOutside);
    // }, []);

    // const handleSelect = (val: string) => {
    //     if (disabled) return;
    //     onChange(val);
    //     setIsOpen(false);
    // };

    // return (
    //     <div className={cn('relative w-full', className)} ref={containerRef}>
    //         <button
    //             type="button"
    //             onClick={() => !disabled && setIsOpen(!isOpen)}
    //             disabled={disabled}
    //             className={cn(
    //                 'flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors',
    //                 'border-border bg-card text-foreground ring-offset-background placeholder:text-muted-foreground',
    //                 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    //                 isOpen && 'border-ring ring-2 ring-ring ring-offset-background',
    //                 !disabled && 'hover:bg-muted/60'
    //             )}
    //             aria-haspopup="listbox"
    //             aria-expanded={isOpen}
    //         >
    //             <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
    //                 {selectedLabel || placeholder}
    //             </span>
    //             <ChevronDown className={cn('h-4 w-4 opacity-60 transition-transform', isOpen && 'rotate-180')} />
    //         </button>

    //         {isOpen && (
    //             <div className="absolute z-[50000] mt-2 w-full min-w-32 overflow-hidden rounded-md border border-border bg-card text-foreground shadow-xl animate-fade-in dark:bg-slate-950">
    //                 <div className="p-1">
    //                     {options.map((option) => (
    //                         <div
    //                             key={option.value}
    //                             onClick={() => handleSelect(option.value)}
    //                             className={cn(
    //                                 'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
    //                                 value === option.value
    //                                     ? 'bg-muted text-foreground'
    //                                     : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
    //                             )}
    //                         >
    //                             {value === option.value && (
    //                                 <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
    //                                     <Check className="h-4 w-4" />
    //                                 </span>
    //                             )}
    //                             {option.label}
    //                         </div>
    //                     ))}
    //                 </div>
    //             </div>
    //         )}
    //     </div>
    // );
};

