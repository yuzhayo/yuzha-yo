/**
 * Placeholder utilities for shared authentication helpers.
 * Replace these stubs with project-specific passkey session logic.
 */

export type Session = {
  moduleId?: string;
  userId: string;
};

export function createPasskeySession(): never {
  throw new Error('Implement passkey session helpers for your project.');
}

export function readPasskeySession(): null {
  return null;
}

export function clearPasskeySession(): void {
  // Intentionally empty; template projects should provide an implementation.
}

// Additional functions required by usePasskeySession hook
export function getActiveSession(moduleId?: string): Session | null {
  return null;
}

export async function signInWithPasskey(passkey: string, moduleId?: string): Promise<{ session?: Session; error?: string }> {
  return { error: 'Passkey authentication not implemented' };
}

export function signOut(moduleId?: string): Promise<void> {
  return Promise.resolve();
}

export function subscribeToSessionChanges(callback: () => void, moduleId?: string): () => void {
  return () => {}; // Return empty unsubscribe function
}
