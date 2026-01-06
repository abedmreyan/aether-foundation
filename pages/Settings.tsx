/**
 * Settings Page
 * Company branding, database connection, and default settings management
 * 
 * @ai-context This is the refactored Settings page that uses modular sub-components.
 * Each tab is now a separate component in components/settings/
 */

import React, { useContext, useState, useEffect } from 'react';
import { GlobalContext } from '../App';
import {
    Settings as SettingsIcon,
    Palette,
    Database,
    Sliders,
    Check,
    AlertCircle,
    ChevronRight,
    Users,
    GitBranch
} from 'lucide-react';
import { DbConnectionConfig } from '../types';
import { canManageSettings } from '../services/permissions';

// Import modular tab components
import {
    BrandingTab,
    DatabaseTab,
    DefaultsTab,
    PipelinesTab,
    RolesTab,
    SettingsTab
} from '../components/settings';

interface SettingsProps {
    dbConnection?: DbConnectionConfig | null;
}

export const Settings: React.FC<SettingsProps> = ({ dbConnection }) => {
    const { user, company, roleDefinitions, cloudConfig, updateCloudConfig, pipelineConfigs } = useContext(GlobalContext);
    const [activeTab, setActiveTab] = useState<SettingsTab>('branding');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const hasPermission = user && canManageSettings(user, roleDefinitions);

    // Clear save message after 3 seconds
    useEffect(() => {
        if (saveMessage) {
            const timer = setTimeout(() => setSaveMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [saveMessage]);

    const handleMessage = (message: { type: 'success' | 'error'; text: string }) => {
        setSaveMessage(message);
    };

    const tabs = [
        { id: 'branding' as const, label: 'Branding', icon: Palette },
        { id: 'database' as const, label: 'Database', icon: Database },
        { id: 'defaults' as const, label: 'Defaults', icon: Sliders },
        { id: 'pipelines' as const, label: 'Pipelines', icon: GitBranch },
        { id: 'roles' as const, label: 'Roles', icon: Users }
    ];

    if (!hasPermission) {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in-up">
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-600 mb-2">Access Restricted</h2>
                    <p className="text-gray-500">You don't have permission to access settings.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-deepBlue text-white rounded-xl">
                    <SettingsIcon className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-deepBlue">Platform Settings</h2>
                    <p className="text-gray-500">Configure your workspace, database, and preferences.</p>
                </div>
            </div>

            {/* Save Message */}
            {saveMessage && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 animate-fade-in-up ${saveMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                    {saveMessage.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {saveMessage.text}
                </div>
            )}

            <div className="flex gap-6">
                {/* Sidebar Tabs */}
                <div className="w-56 flex-shrink-0">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${activeTab === tab.id
                                    ? 'bg-teal/10 text-teal border-l-4 border-teal'
                                    : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                                {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === 'branding' && (
                        <BrandingTab
                            company={company}
                            isSaving={isSaving}
                            setIsSaving={setIsSaving}
                            onMessage={handleMessage}
                        />
                    )}

                    {activeTab === 'database' && (
                        <DatabaseTab
                            company={company}
                            dbConnection={dbConnection}
                            cloudConfig={cloudConfig}
                            updateCloudConfig={updateCloudConfig}
                            isSaving={isSaving}
                            setIsSaving={setIsSaving}
                            onMessage={handleMessage}
                        />
                    )}

                    {activeTab === 'defaults' && (
                        <DefaultsTab
                            company={company}
                            isSaving={isSaving}
                            setIsSaving={setIsSaving}
                            onMessage={handleMessage}
                        />
                    )}

                    {activeTab === 'pipelines' && (
                        <PipelinesTab pipelineConfigs={pipelineConfigs} />
                    )}

                    {activeTab === 'roles' && (
                        <RolesTab roleDefinitions={roleDefinitions} />
                    )}
                </div>
            </div>
        </div>
    );
};
