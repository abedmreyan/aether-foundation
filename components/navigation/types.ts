/**
 * Navigation Types
 * Types for enterprise navigation configuration
 * 
 * @ai-context Navigation configuration for the Dashboard.
 * Supports dynamic menu items, icons, badges, and role-based visibility.
 */

import { LucideIcon } from 'lucide-react';

export type DashboardTab = 'overview' | 'crm' | 'scaffold' | 'architect' | 'support' | 'settings';

export interface NavigationItem {
    /** Unique identifier matching DashboardTab */
    id: DashboardTab;
    /** Display label */
    label: string;
    /** Lucide icon component */
    icon: LucideIcon;
    /** Optional badge count */
    badge?: number;
    /** Roles allowed to see this item (empty = all) */
    allowedRoles?: string[];
    /** Whether this is a settings item (shown in separate section) */
    isSettings?: boolean;
    /** Description for tooltips */
    description?: string;
}

export interface NavigationSection {
    /** Section title (optional) */
    title?: string;
    /** Navigation items in this section */
    items: NavigationItem[];
}

export interface SidebarConfig {
    /** Main navigation sections */
    sections: NavigationSection[];
    /** Whether sidebar starts expanded */
    defaultExpanded?: boolean;
    /** Company branding */
    branding?: {
        logo?: string;
        primaryColor?: string;
    };
}
