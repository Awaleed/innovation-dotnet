export interface AuthUser {
    id: string;
    name: string;
    email: string;
}

export interface SharedProps {
    auth: {
        user: AuthUser | null;
    };
}
