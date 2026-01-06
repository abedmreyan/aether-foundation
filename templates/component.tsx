// Component Template
// Usage: Copy this file to components/<type>/<ComponentName>.tsx
// Replace all instances of "ComponentName" with your component name

import { type ReactNode } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface ComponentNameProps {
    /** Required: Brief description */
    children?: ReactNode;
    /** Optional: Additional CSS classes */
    className?: string;
    // Add your props here
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ComponentName - Brief description of what this component does
 * 
 * @example
 * <ComponentName>
 *   Content here
 * </ComponentName>
 */
export function ComponentName({
    children,
    className = '',
}: ComponentNameProps) {
    // Hooks
    // const { user } = useAuth();
    // const { someData } = useCRM();

    // State
    // const [isOpen, setIsOpen] = useState(false);

    // Handlers
    // const handleClick = () => { ... };

    return (
        <div className={`component-name ${className}`}>
            {children}
        </div>
    );
}

// =============================================================================
// REMEMBER TO:
// 1. Export from components/<type>/index.ts
// 2. Run: npm run build
// =============================================================================
