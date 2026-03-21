/**
 * Format a date string using the current locale
 */
export const formatDate = (dateString: string | null | undefined, locale: string = 'en-US'): string => {
    if (!dateString) {
        return '-';
    }

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Format a number as currency
 */
export const formatCurrency = (amount: number, currency: string = 'USD', locale: string = 'en-US') => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

/**
 * Format a number with thousand separators
 */
export const formatNumber = (num: number, locale: string = 'en-US') => {
    return new Intl.NumberFormat(locale).format(num);
};

/**
 * Format a percentage
 */
export const formatPercentage = (num: number, locale: string = 'en-US', decimals: number = 1) => {
    return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num / 100);
};

/**
 * Strip Google consent redirect wrapper from signal source URLs.
 * Google News RSS sometimes wraps URLs in https://consent.google.com/ml?continue=<actual_url>
 */
export const cleanSourceUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        if (parsed.hostname === 'consent.google.com') {
            const continueUrl = parsed.searchParams.get('continue');
            if (continueUrl) return continueUrl;
        }
    } catch {
        // Not a valid URL, return as-is
    }
    return url;
};

/**
 * Format a multilingual string
 */
export const formatMultilingualString = (mString: undefined | string | { ar?: string; en?: string }, locale: string = 'en'): string => {
    if (!mString) return '';

    let obj: { ar?: string; en?: string };

    // If it's a string, try to parse it as JSON first
    if (typeof mString === 'string') {
        try {
            const parsed = JSON.parse(mString);
            if (typeof parsed === 'object' && (parsed.ar || parsed.en)) {
                obj = parsed;
            } else {
                // Not a multilingual object, return as-is
                return mString;
            }
        } catch {
            // Not valid JSON, return as-is
            return mString;
        }
    } else {
        obj = mString;
    }

    // Normalize locale to just the language code (e.g., "ar-SA" -> "ar", "en-US" -> "en")
    const lang = locale.split('-')[0];

    return obj[lang as keyof typeof obj] || obj.en || obj.ar || '';
};
