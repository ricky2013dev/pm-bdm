export interface User {
  id: string;
  username: string;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
