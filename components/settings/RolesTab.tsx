/**
 * Roles Tab Component
 * Role management placeholder
 * 
 * @ai-context This component handles:
 * - Role listing
 * - Role permission management (coming soon)
 */

import React from 'react';
import { Users } from 'lucide-react';
import type { RoleDefinition } from '../../types';

interface RolesTabProps {
    roleDefinitions: RoleDefinition[];
}

export const RolesTab: React.FC<RolesTabProps> = ({ roleDefinitions }) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-deepBlue flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Role Management
                </h3>
                <p className="text-sm text-gray-500 mt-1">Configure roles and permissions for your team.</p>
            </div>
            <div className="p-6">
                <div className="text-center py-12 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="font-bold text-lg mb-2">Role Manager Coming Soon</p>
                    <p className="text-sm">Manage {roleDefinitions.length} roles with granular permissions.</p>
                </div>
            </div>
        </div>
    );
};
