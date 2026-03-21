import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function ensureRecord<K extends string | number | symbol = string, V = unknown>(value: unknown, defaultValue?: Record<K, V>): Record<K, V> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<K, V>;
    }

    if (defaultValue) return defaultValue;
    else return {} as Record<K, V>;
}
