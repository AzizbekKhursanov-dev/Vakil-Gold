export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "manager" | "user"
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}
