/**
 * View Toggle Component
 * Toggle between Kanban and Table views
 */

import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

export type ViewMode = 'kanban' | 'table';

interface ViewToggleProps {
    value: ViewMode;
    onChange: (mode: ViewMode) => void;
    className?: string;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
    value,
    onChange,
    className = ''
}) => {
    return (
        <div className={`flex items-center bg-gray-100 rounded-lg p-1 ${className}`}>
            <button
                onClick={() => onChange('kanban')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                   ${value === 'kanban'
                        ? 'bg-white text-deepBlue shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'}`}
            >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Kanban</span>
            </button>

            <button
                onClick={() => onChange('table')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                   ${value === 'table'
                        ? 'bg-white text-deepBlue shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'}`}
            >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
            </button>
        </div>
    );
};

export default ViewToggle;
