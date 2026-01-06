// Example: Using All Three Context Providers
// Shows how to access Auth, CRM, and Data contexts

import { useAuth, useCRM, useData } from '../context';

export function ContextUsageExample() {
    // ==========================================================================
    // AUTH CONTEXT - User authentication and identity
    // ==========================================================================
    const {
        user,           // Current user object (null if not logged in)
        company,        // Current company object
        login,          // login(email, password) -> Promise<boolean>
        logout,         // logout() -> void
        isPrivileged,   // isPrivileged() -> boolean (admin/dev/management)
    } = useAuth();

    // ==========================================================================
    // CRM CONTEXT - Pipelines and entity management
    // ==========================================================================
    const {
        pipelineConfigs,  // Array of all pipeline configurations
        roles,            // Array of role definitions
        getEntities,      // getEntities(entityType, filters?) -> Promise<Entity[]>
        createEntity,     // createEntity(entityType, data) -> Promise<Entity>
        updateEntity,     // updateEntity(entityType, id, data) -> Promise<void>
        deleteEntity,     // deleteEntity(entityType, id) -> Promise<void>
    } = useCRM();

    // ==========================================================================
    // DATA CONTEXT - Files and AI chat
    // ==========================================================================
    const {
        uploadedFiles,    // Array of uploaded file metadata
        addFile,          // addFile(file, description) -> void
        removeFile,       // removeFile(fileId) -> void
        chatHistory,      // Array of AI chat messages
        addMessage,       // addMessage(message) -> void
    } = useData();

    // ==========================================================================
    // COMMON USAGE PATTERNS
    // ==========================================================================

    // Check if user is logged in
    if (!user) {
        return <div>Please log in</div>;
    }

    // Check user role
    if (user.role === 'admin') {
        // Admin-only content
    }

    // Get entities for a pipeline
    const loadStudents = async () => {
        const students = await getEntities('students');
        console.log(students);
    };

    // Check privilege level
    if (isPrivileged()) {
        // Show management features
    }

    return (
        <div>
            <p>Welcome, {user.name}!</p>
            <p>Company: {company?.name}</p>
            <p>Pipelines: {pipelineConfigs.length}</p>
            <p>Files: {uploadedFiles.length}</p>
        </div>
    );
}

// Key patterns:
// 1. Always destructure only what you need
// 2. Check user existence before accessing properties
// 3. Use isPrivileged() for management features
// 4. Async operations return Promises
