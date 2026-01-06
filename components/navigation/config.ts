/**
 * Navigation Configuration
 * Default navigation structure for the CRM
 * 
 * @ai-context This file defines the navigation menu structure.
 * To add new menu items:
 * 1. Add the tab type to DashboardTab in types.ts
 * 2. Add the navigation item here
 * 3. Add the corresponding content in Dashboard.tsx
 */

import {
    LayoutDashboard,
    Table,
    Network,
    MessageSquare,
    Settings as SettingsIcon,
    Users,
    BarChart3,
    FileText,
    Zap,
    Shield
} from 'lucide-react';
import type { NavigationItem, NavigationSection, SidebarConfig } from './types';

/**
 * Main navigation items
 * These appear in the main section of the sidebar
 */
export const mainNavItems: NavigationItem[] = [
    {
        id: 'crm',
        label: 'CRM',
        icon: Users,
        description: 'Manage your customers, leads, and deals'
    },
    {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboard,
        description: 'Dashboard analytics and metrics'
    },
    {
        id: 'scaffold',
        label: 'The Scaffold',
        icon: Table,
        description: 'Visual data schema from your sources'
    },
    {
        id: 'architect',
        label: 'The Architect',
        icon: Network,
        description: 'Pipeline and automation configuration'
    },
    {
        id: 'support',
        label: 'Aether Support',
        icon: MessageSquare,
        description: 'AI-powered customer support widget'
    }
];

/**
 * Settings navigation items
 * These appear in the settings section of the sidebar
 */
export const settingsNavItems: NavigationItem[] = [
    {
        id: 'settings',
        label: 'Configuration',
        icon: SettingsIcon,
        isSettings: true,
        description: 'Platform settings and configuration',
        allowedRoles: ['admin', 'dev', 'management']
    }
];

/**
 * Default sidebar configuration
 */
export const defaultSidebarConfig: SidebarConfig = {
    sections: [
        {
            items: mainNavItems
        },
        {
            title: 'Settings',
            items: settingsNavItems
        }
    ],
    defaultExpanded: false
};

/**
 * Get navigation items filtered by user role
 */
export function getNavigationForRole(role: string, config: SidebarConfig = defaultSidebarConfig): NavigationSection[] {
    return config.sections.map(section => ({
        ...section,
        items: section.items.filter(item => {
            if (!item.allowedRoles || item.allowedRoles.length === 0) {
                return true;
            }
            return item.allowedRoles.includes(role);
        })
    })).filter(section => section.items.length > 0);
}

/**
 * Get a flat list of all navigation items
 */
export function getAllNavigationItems(config: SidebarConfig = defaultSidebarConfig): NavigationItem[] {
    return config.sections.flatMap(section => section.items);
}

/**
 * Find a navigation item by ID
 */
export function getNavigationItem(id: string, config: SidebarConfig = defaultSidebarConfig): NavigationItem | undefined {
    return getAllNavigationItems(config).find(item => item.id === id);
}
