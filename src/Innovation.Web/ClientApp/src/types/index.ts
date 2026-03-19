import type { IAuthUser } from './generated';

export interface Auth {
    user: IAuthUser | null;
}

export interface SharedData {
    auth: Auth;
    name?: string;
    quote?: { message: string; author: string };
    [key: string]: unknown;
}
