/**
 * Sidebar Component
 * Collapsible navigation sidebar with branding and user profile
 * 
 * @ai-context Main sidebar component for Dashboard navigation.
 * Features:
 * - Auto-expand on hover
 * - Section grouping
 * - User profile with logout
 * - Company branding
 */

import React from 'react';
import { LogOut } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { SidebarItem } from './SidebarItem';
import type { DashboardTab, NavigationSection } from './types';
import type { User } from '../../types';

interface SidebarProps {
    /** Currently active tab */
    activeTab: DashboardTab;
    /** Tab change handler */
    onTabChange: (tab: DashboardTab) => void;
    /** Whether sidebar is expanded */
    isExpanded: boolean;
    /** Expand state change handler */
    onExpandChange: (expanded: boolean) => void;
    /** Navigation sections to display */
    sections: NavigationSection[];
    /** Current user */
    user: User | null;
    /** Logout handler */
    onLogout: () => void;
    /** Optional company branding */
    branding?: {
        logo?: string;
        primaryColor?: string;
    };
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    onTabChange,
    isExpanded,
    onExpandChange,
    sections,
    user,
    onLogout,
    branding
}) => {
    return (
        <aside
            className={`bg-deepBlue flex flex-col flex-shrink-0 text-white transition-all duration-300 ease-in-out z-20 shadow-2xl
            ${isExpanded ? 'w-64' : 'w-20'}`}
            onMouseEnter={() => onExpandChange(true)}
            onMouseLeave={() => onExpandChange(false)}
        >
            {/* Logo */}
            <div className="h-20 flex items-center justify-center border-b border-white/10 overflow-hidden">
                <div className={`${isExpanded ? 'px-6 w-full' : 'px-0'}`}>
                    {branding?.logo ? (
                        <img
                            src={branding.logo}
                            alt="Logo"
                            className={`h-10 object-contain transition-all ${isExpanded ? 'w-auto' : 'w-10'}`}
                        />
                    ) : (
                        <Logo variant="light" collapsed={!isExpanded} />
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
                {sections.map((section, sIdx) => (
                    <div key={sIdx}>
                        {/* Section title */}
                        {section.title && (
                            <div className={`pt-8 pb-2 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider transition-opacity duration-300 
                                ${!isExpanded ? 'opacity-0 hidden' : 'opacity-100'}`}>
                                {section.title}
                            </div>
                        )}

                        {/* Section items */}
                        {section.items.map(item => (
                            <SidebarItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                active={activeTab === item.id}
                                onClick={() => onTabChange(item.id)}
                                collapsed={!isExpanded}
                                badge={item.badge}
                                description={item.description}
                            />
                        ))}
                    </div>
                ))}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-white/10 bg-deepBlue">
                <div className={`flex items-center gap-3 transition-all duration-300 ${!isExpanded ? 'justify-center' : ''}`}>
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0"
                        style={{ backgroundColor: branding?.primaryColor || '#05B3B4' }}
                    >
                        {user?.avatar || user?.name?.substring(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${!isExpanded ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                        <p className="font-medium truncate text-sm">{user?.name || 'User'}</p>
                        <button
                            onClick={onLogout}
                            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mt-0.5 transition-colors"
                        >
                            <LogOut className="w-3 h-3" /> Log Out
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};
