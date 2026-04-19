import type { ReactNode } from 'react';

export type AdminUser = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
};

export type AuthContextValue = {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
};

export declare function AuthProvider(props: { children: ReactNode }): React.JSX.Element;
export declare function useAuth(): AuthContextValue;
