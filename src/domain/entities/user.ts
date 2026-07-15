/**
 * User Entity - Domain model
 * Represents a user in the system
 */
export type Role = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new user
 */
export interface CreateUserInput {
  id: string; // From NextAuth session
  email: string;
  name?: string;
  role?: Role;
}

/**
 * Input for updating a user
 */
export interface UpdateUserInput {
  name?: string;
  role?: Role;
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'ADMIN';
}

/**
 * Check if user has access to admin panel
 */
export function canAccessAdmin(user: User | null): boolean {
  return user !== null && user.role === 'ADMIN';
}