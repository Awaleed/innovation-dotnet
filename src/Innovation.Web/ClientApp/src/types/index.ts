import type { IAuthUser } from './generated';

export interface Auth {
    user: IAuthUser | null;
}

export interface SharedData {
    auth: Auth;
    [key: string]: unknown;
}
