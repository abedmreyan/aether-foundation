/**
 * Navigation Components - Barrel Export
 * 
 * @ai-context Navigation module for the Dashboard.
 * Includes sidebar, topbar, and configuration utilities.
 */

// Components
export { Sidebar } from './Sidebar';
export { SidebarItem } from './SidebarItem';
export { TopBar } from './TopBar';

// Configuration
export {
    mainNavItems,
    settingsNavItems,
    defaultSidebarConfig,
    getNavigationForRole,
    getAllNavigationItems,
    getNavigationItem
} from './config';

// Types
export * from './types';
