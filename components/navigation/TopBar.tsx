/**
 * Top Bar Component
 * Dashboard header with search, notifications, and cloud status
 * 
 * @ai-context Top navigation bar for the main content area
 */

import React from 'react';
import { Search, Bell, Cloud } from 'lucide-react';
import type { CloudConfig } from '../../types';

interface TopBarProps {
    /** Current page title */
    title: string;
    /** Cloud configuration for status indicator */
    cloudConfig?: CloudConfig;
    /** Search handler (optional) */
    onSearch?: (query: string) => void;
    /** Notification count */
    notificationCount?: number;
    /** Notification click handler */
    onNotificationClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
    title,
    cloudConfig,
    onSearch,
    notificationCount = 0,
    onNotificationClick
}) => {
    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 flex-shrink-0">
            <h1 className="text-xl font-bold text-deepBlue capitalize flex items-center gap-3">
                {title.replace('-', ' ')}
                {cloudConfig?.enabled && (
                    <span className="px-2 py-0.5 bg-teal/10 text-teal text-xs rounded border border-teal/20 flex items-center gap-1">
                        <Cloud className="w-3 h-3" /> Cloud Active
                    </span>
                )}
            </h1>

            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative hidden md:block">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-teal w-64 transition-all focus:w-72"
                        onChange={(e) => onSearch?.(e.target.value)}
                    />
                </div>

                {/* Notifications */}
                <button
                    onClick={onNotificationClick}
                    className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <Bell className="w-5 h-5" />
                    {notificationCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-vibrantOrange rounded-full animate-pulse" />
                    )}
                </button>
            </div>
        </header>
    );
};
