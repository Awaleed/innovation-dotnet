import type { z } from 'zod';

/**
 * Fetch JSON and validate the response shape with a Zod schema.
 * Throws ZodError if the response doesn't match the expected shape.
 */
export async function safeFetch<T>(
    url: string,
    schema: z.ZodType<T>,
    init?: RequestInit,
): Promise<T> {
    const response = await fetch(url, init);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
    }
    const data: unknown = await response.json();
    return schema.parse(data);
}
