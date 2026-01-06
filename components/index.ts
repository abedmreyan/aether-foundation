/**
 * Components - Barrel Export
 * 
 * @ai-context Central export for all UI components.
 * Components are organized into logical groups:
 * - ui/ - Reusable primitives (Button, Logo, etc.)
 * - pipeline/ - Pipeline-specific components  
 * - navigation/ - Sidebar, TopBar, navigation config
 * - settings/ - Settings page sub-components
 */

// UI primitives
export { Button } from './ui/Button';
export { Logo } from './ui/Logo';
export { ViewToggle } from './ui/ViewToggle';

// Pipeline components
export { StageEditModal } from './pipeline/StageEditModal';
export { FieldEditModal } from './pipeline/FieldEditModal';
export { FIELD_TYPES, STAGE_COLORS } from './pipeline/constants';

// Navigation components
export * from './navigation';

// Settings components
export * from './settings';

// Main components
export { PipelineBuilder } from './PipelineBuilder';
export { PipelineKanban } from './PipelineKanban';
export { PipelineTable } from './PipelineTable';
export { EntityForm } from './EntityForm';
export { RoleManager } from './RoleManager';
