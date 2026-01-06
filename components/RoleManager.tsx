/**
 * Role Manager Component
 * UI for creating and managing custom roles with granular permissions
 */

import React, { useState, useContext } from 'react';
import { GlobalContext } from '../App';
import { Button } from './Button';
import { platformDb } from '../services/platformDatabase';
import { RoleDefinition, RolePermissions, PipelineConfig, PipelineAccessLevel } from '../types';
import {
    Plus,
    Trash2,
    Edit2,
    Shield,
    ShieldCheck,
    ShieldOff,
    Lock,
    Check,
    X,
    AlertCircle,
    Save,
    Users,
    Eye,
    EyeOff,
    Settings,
    Database,
    Download,
    GitBranch,
    Key
} from 'lucide-react';
import { DEFAULT_ROLE_PERMISSIONS } from '../services/permissions';

interface RoleManagerProps {
    onRoleUpdate?: () => void;
}

export const RoleManager: React.FC<RoleManagerProps> = ({ onRoleUpdate }) => {
    const { company, roleDefinitions, pipelineConfigs } = useContext(GlobalContext);
    const [roles, setRoles] = useState<RoleDefinition[]>(roleDefinitions);
    const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleCreateRole = () => {
        const newRole: RoleDefinition = {
            id: `role-${Date.now()}`,
            companyId: company?.id || '',
            name: 'New Role',
            description: '',
            isSystemRole: false,
            permissions: {
                canViewAllData: false,
                canViewFinancialData: false,
                canManageUsers: false,
                canManageRoles: false,
                canManagePipelines: false,
                canManageSettings: false,
                canManageIntegrations: false,
                canExportData: false,
                canDeleteRecords: false,
                pipelineAccess: {}
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        setEditingRole(newRole);
        setIsCreating(true);
    };

    const handleSaveRole = async (role: RoleDefinition) => {
        if (!company) return;
        setIsSaving(true);

        try {
            if (isCreating) {
                const savedRole = await platformDb.saveRoleDefinition(company.id, {
                    name: role.name,
                    description: role.description,
                    isSystemRole: false,
                    permissions: role.permissions
                });
                setRoles([...roles, savedRole]);
            } else {
                await platformDb.updateRoleDefinition(role.id, {
                    name: role.name,
                    description: role.description,
                    permissions: role.permissions
                });
                setRoles(roles.map(r => r.id === role.id ? role : r));
            }
            setSaveMessage({ type: 'success', text: `Role ${isCreating ? 'created' : 'updated'} successfully!` });
            setEditingRole(null);
            setIsCreating(false);
            onRoleUpdate?.();
        } catch (e) {
            setSaveMessage({ type: 'error', text: 'Failed to save role' });
        }
        setIsSaving(false);
        setTimeout(() => setSaveMessage(null), 3000);
    };

    const handleDeleteRole = async (roleId: string) => {
        const role = roles.find(r => r.id === roleId);
        if (!role || role.isSystemRole) return;

        if (!confirm(`Are you sure you want to delete the "${role.name}" role?`)) return;

        try {
            await platformDb.deleteRoleDefinition(roleId);
            setRoles(roles.filter(r => r.id !== roleId));
            setSaveMessage({ type: 'success', text: 'Role deleted successfully!' });
        } catch (e) {
            setSaveMessage({ type: 'error', text: 'Failed to delete role' });
        }
        setTimeout(() => setSaveMessage(null), 3000);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-deepBlue flex items-center gap-2">
                        <Shield className="w-6 h-6" />
                        Role Management
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Configure roles and permissions for your team.</p>
                </div>
                <Button onClick={handleCreateRole}>
                    <Plus className="w-4 h-4 mr-2" /> Create Role
                </Button>
            </div>

            {/* Save Message */}
            {saveMessage && (
                <div className={`p-4 rounded-lg flex items-center gap-3 animate-fade-in-up ${saveMessage.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                    {saveMessage.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {saveMessage.text}
                </div>
            )}

            {/* Role Grid */}
            <div className="grid gap-4">
                {roles.map(role => (
                    <div
                        key={role.id}
                        className={`bg-white border rounded-xl p-5 hover:shadow-sm transition-all ${role.isSystemRole ? 'border-gray-200' : 'border-gray-200 hover:border-teal'
                            }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${role.isSystemRole ? 'bg-gray-100' : 'bg-teal/10'
                                    }`}>
                                    {role.isSystemRole ? (
                                        <ShieldCheck className="w-6 h-6 text-gray-600" />
                                    ) : (
                                        <Shield className="w-6 h-6 text-teal" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-800">{role.name}</h4>
                                        {role.isSystemRole && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium flex items-center gap-1">
                                                <Lock className="w-3 h-3" /> System
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{role.description || 'No description'}</p>

                                    {/* Permission Badges */}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {role.permissions.canViewAllData && (
                                            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded">View All Data</span>
                                        )}
                                        {role.permissions.canViewFinancialData && (
                                            <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs rounded">Financial Access</span>
                                        )}
                                        {role.permissions.canManageUsers && (
                                            <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded">Manage Users</span>
                                        )}
                                        {role.permissions.canManageSettings && (
                                            <span className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded">Settings</span>
                                        )}
                                        {role.permissions.canExportData && (
                                            <span className="px-2 py-1 bg-teal-50 text-teal-600 text-xs rounded">Export</span>
                                        )}
                                        {!role.permissions.canViewAllData && !role.permissions.canManageUsers && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                                                {Object.keys(role.permissions.pipelineAccess).length} pipeline access rules
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setEditingRole(role); setIsCreating(false); }}
                                    className={`p-2 rounded-lg transition-colors ${role.isSystemRole
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-400 hover:text-teal hover:bg-teal/10'
                                        }`}
                                    disabled={role.isSystemRole}
                                    title={role.isSystemRole ? 'System roles cannot be edited' : 'Edit role'}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteRole(role.id)}
                                    className={`p-2 rounded-lg transition-colors ${role.isSystemRole
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                        }`}
                                    disabled={role.isSystemRole}
                                    title={role.isSystemRole ? 'System roles cannot be deleted' : 'Delete role'}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingRole && (
                <RoleEditModal
                    role={editingRole}
                    isNew={isCreating}
                    pipelines={pipelineConfigs}
                    onSave={handleSaveRole}
                    onClose={() => { setEditingRole(null); setIsCreating(false); }}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
};

// Role Edit Modal
const RoleEditModal: React.FC<{
    role: RoleDefinition;
    isNew: boolean;
    pipelines: PipelineConfig[];
    onSave: (role: RoleDefinition) => void;
    onClose: () => void;
    isSaving: boolean;
}> = ({ role, isNew, pipelines, onSave, onClose, isSaving }) => {
    const [form, setForm] = useState({
        name: role.name,
        description: role.description || '',
        permissions: { ...role.permissions }
    });
    const [activeSection, setActiveSection] = useState<'global' | 'pipelines'>('global');

    const handleSubmit = () => {
        onSave({
            ...role,
            name: form.name,
            description: form.description,
            permissions: form.permissions,
            updatedAt: Date.now()
        });
    };

    const updatePermission = (key: keyof RolePermissions, value: any) => {
        setForm({
            ...form,
            permissions: { ...form.permissions, [key]: value }
        });
    };

    const updatePipelineAccess = (pipelineId: string, level: PipelineAccessLevel) => {
        const currentAccess = form.permissions.pipelineAccess[pipelineId] || { level: 'none' };
        setForm({
            ...form,
            permissions: {
                ...form.permissions,
                pipelineAccess: {
                    ...form.permissions.pipelineAccess,
                    [pipelineId]: { ...currentAccess, level }
                }
            }
        });
    };

    const globalPermissions: { key: keyof RolePermissions; label: string; icon: React.ElementType; desc: string }[] = [
        { key: 'canViewAllData', label: 'View All Data', icon: Eye, desc: 'Access all records across all pipelines' },
        { key: 'canViewFinancialData', label: 'View Financial Data', icon: Database, desc: 'See financial fields like price and payments' },
        { key: 'canManageUsers', label: 'Manage Users', icon: Users, desc: 'Create, edit, and delete user accounts' },
        { key: 'canManageRoles', label: 'Manage Roles', icon: Shield, desc: 'Create and edit role permissions' },
        { key: 'canManagePipelines', label: 'Manage Pipelines', icon: GitBranch, desc: 'Configure stages and fields' },
        { key: 'canManageSettings', label: 'Manage Settings', icon: Settings, desc: 'Access company settings' },
        { key: 'canManageIntegrations', label: 'Manage Integrations', icon: Key, desc: 'Configure database connections' },
        { key: 'canExportData', label: 'Export Data', icon: Download, desc: 'Download CSV/Excel exports' },
        { key: 'canDeleteRecords', label: 'Delete Records', icon: Trash2, desc: 'Permanently remove entities' }
    ];

    const accessLevels: { value: PipelineAccessLevel; label: string; desc: string; color: string }[] = [
        { value: 'none', label: 'None', desc: 'No access', color: 'bg-gray-100 text-gray-600' },
        { value: 'view', label: 'View', desc: 'Read only', color: 'bg-blue-100 text-blue-600' },
        { value: 'edit', label: 'Edit', desc: 'Create & modify', color: 'bg-amber-100 text-amber-600' },
        { value: 'full', label: 'Full', desc: 'All actions', color: 'bg-green-100 text-green-600' }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-auto" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-deepBlue">{isNew ? 'Create New Role' : 'Edit Role'}</h3>
                        <p className="text-sm text-gray-500 mt-1">Configure permissions for this role</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Role Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                                placeholder="e.g., Sales Manager"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                                placeholder="Brief description of this role"
                            />
                        </div>
                    </div>

                    {/* Section Tabs */}
                    <div className="flex gap-2 mb-4 border-b border-gray-200">
                        {[
                            { id: 'global' as const, label: 'Global Permissions' },
                            { id: 'pipelines' as const, label: 'Pipeline Access' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id)}
                                className={`px-4 py-2 font-medium text-sm border-b-2 transition-all ${activeSection === tab.id
                                        ? 'border-teal text-teal'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Global Permissions */}
                    {activeSection === 'global' && (
                        <div className="space-y-3">
                            {globalPermissions.map(perm => {
                                const Icon = perm.icon;
                                const isChecked = form.permissions[perm.key] as boolean;
                                return (
                                    <label
                                        key={perm.key}
                                        className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${isChecked ? 'border-teal bg-teal/5' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => updatePermission(perm.key, e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-teal focus:ring-teal"
                                        />
                                        <Icon className={`w-5 h-5 ${isChecked ? 'text-teal' : 'text-gray-400'}`} />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">{perm.label}</p>
                                            <p className="text-xs text-gray-500">{perm.desc}</p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}

                    {/* Pipeline Access */}
                    {activeSection === 'pipelines' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Configure access levels for each pipeline. Users with "View All Data" permission will have full access regardless of these settings.
                            </p>
                            {pipelines.map(pipeline => {
                                const currentAccess = form.permissions.pipelineAccess[pipeline.entityType];
                                const currentLevel = currentAccess?.level || 'none';

                                return (
                                    <div key={pipeline.id} className="p-4 border border-gray-200 rounded-lg">
                                        <p className="font-medium text-gray-800 mb-3">{pipeline.name}</p>
                                        <div className="flex gap-2">
                                            {accessLevels.map(level => (
                                                <button
                                                    key={level.value}
                                                    onClick={() => updatePipelineAccess(pipeline.entityType, level.value)}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${currentLevel === level.value
                                                            ? level.color
                                                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {level.label}
                                                    <span className="block text-[10px] font-normal opacity-75">{level.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSaving || !form.name.trim()}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : isNew ? 'Create Role' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
