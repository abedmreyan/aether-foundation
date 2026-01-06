/**
 * Sidebar Item Component
 * Individual navigation item with icon, label, and active state
 * 
 * @ai-context Reusable sidebar item supporting collapsed/expanded states
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
    /** Lucide icon component */
    icon: LucideIcon;
    /** Item label text */
    label: string;
    /** Whether this item is currently active */
    active: boolean;
    /** Click handler */
    onClick: () => void;
    /** Whether sidebar is collapsed */
    collapsed: boolean;
    /** Optional badge count */
    badge?: number;
    /** Optional description for tooltip */
    description?: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
    icon: Icon,
    label,
    active,
    onClick,
    collapsed,
    badge,
    description
}) => (
    <button
        onClick={onClick}
        title={collapsed ? label : description}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative
        ${active ? 'bg-teal text-white shadow-lg shadow-teal/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}
        ${collapsed ? 'justify-center' : ''}`}
    >
        <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${!collapsed && active ? 'scale-110' : ''}`} />

        <span className={`font-medium whitespace-nowrap transition-all duration-300 origin-left
            ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
            {label}
        </span>

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
            <span className={`ml-auto px-2 py-0.5 text-xs font-bold rounded-full
                ${active ? 'bg-white/20 text-white' : 'bg-vibrantOrange text-white'}
                ${collapsed ? 'absolute -top-1 -right-1 ml-0' : ''}`}>
                {badge > 99 ? '99+' : badge}
            </span>
        )}

        {/* Tooltip for collapsed state */}
        {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-darkGray text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {label}
                {description && <span className="block text-gray-400 text-[10px] mt-0.5">{description}</span>}
            </div>
        )}
    </button>
);
