import axios from 'axios';

// Create axios instance with defaults
const api = axios.create({
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

// Add CSRF token to all requests
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (csrfToken) {
    api.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

// Fetch XSRF token from antiforgery endpoint and set for all state-changing requests
async function initCsrfToken() {
    try {
        const { data } = await api.get<{ token: string }>('/antiforgery/token');
        if (data.token) {
            api.defaults.headers.common['X-XSRF-TOKEN'] = data.token;
        }
    } catch {
        // Token fetch may fail if not authenticated — that's OK
    }
}

// Initialize CSRF token on module load
void initCsrfToken();

// Response interceptor for global error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status === 401) {
                console.warn('Unauthorized request detected');
            } else if (status === 403) {
                console.warn('Forbidden request detected');
            } else if (status === 500) {
                console.error('Server error detected');
            }
        }
        return Promise.reject(error);
    },
);

/**
 * Generic fetcher for React Query queryFn.
 * Usage: queryFn: () => fetcher<MyType>(url)
 */
export async function fetcher<T>(url: string): Promise<T> {
    const { data } = await api.get<T>(url);
    return data;
}

export { api, initCsrfToken };
export default api;
