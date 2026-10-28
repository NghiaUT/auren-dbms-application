// ============================================================================
// File: frontend/src/auth/useAuth.ts
// Vai trò: Custom React Hook truy cập dữ liệu AuthContext một cách an toàn.
// ============================================================================

import { useContext } from 'react';
import { AuthContext, AuthContextType } from './AuthContext';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
