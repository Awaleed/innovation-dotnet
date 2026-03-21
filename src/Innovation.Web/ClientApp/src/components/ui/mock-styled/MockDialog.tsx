import * as React from 'react';
import {
    Dialog as DialogPrimitive,
    DialogContent as DialogContentPrimitive,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface MockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    className?: string;
}

export const Dialog: React.FC<MockDialogProps> = ({ open, onOpenChange, children }) => {
    return (
        <DialogPrimitive open={open} onOpenChange={onOpenChange}>
            {children}
        </DialogPrimitive>
    );
};

export const DialogContent: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
    <DialogContentPrimitive
        className={cn(
            'max-w-5xl border border-slate-800 bg-slate-950 p-0 text-foreground shadow-2xl',
            className
        )}
    >
        {children}
    </DialogContentPrimitive>
);

export { DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger };

