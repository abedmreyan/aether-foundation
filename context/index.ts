/**
 * Context Module - Barrel Export
 * 
 * @ai-context This module provides application-wide state management
 * organized into three domains:
 * 
 * 1. **AuthContext** - User authentication and company state
 *    - Use for: login/logout, user info, role checks
 * 
 * 2. **CRMContext** - CRM configuration and entity operations  
 *    - Use for: pipelines, roles, CRUD operations on entities
 * 
 * 3. **DataContext** - Legacy data and AI features
 *    - Use for: file uploads, schemas, chat, AI recommendations
 */

// Auth
export {
    AuthContext,
    AuthProvider,
    useAuth,
    type AuthContextType
} from './AuthContext';

// CRM
export {
    CRMContext,
    CRMProvider,
    useCRM,
    type CRMContextType
} from './CRMContext';

// Data
export {
    DataContext,
    DataProvider,
    useData,
    type DataContextType
} from './DataContext';
