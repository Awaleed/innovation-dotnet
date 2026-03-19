import { z } from 'zod';
import { makeZodI18nMap } from 'zod-i18n-map';
import i18n from './i18n';

/**
 * Initialize Zod i18n error map with current i18next configuration
 * This function sets up Zod to use translated error messages based on the current locale
 */
export function initZodI18nMap() {
    // Create and set the error map using makeZodI18nMap
    // This connects Zod validation errors to i18next translations
    z.setErrorMap(
        makeZodI18nMap({
            t: i18n.t, // Pass the i18next translation function
            ns: 'zod', // Use the 'zod' namespace for error messages
        }),
    );
}

/**
 * Re-initialize the error map when language changes
 * This ensures that validation errors update to the new language
 */
export function reinitZodI18nMap() {
    initZodI18nMap();
}

// Initialize the error map immediately when this module is imported
initZodI18nMap();

// Set up listener for language changes to re-initialize the error map
// This ensures that when users switch languages, validation messages update accordingly
i18n.on('languageChanged', (lng) => {
    console.log(`Zod i18n map updated for language: ${lng}`);
    reinitZodI18nMap();
});
