/**
 * Database Tab Component
 * Database connection configuration
 * 
 * @ai-context This component handles:
 * - Database type selection (local, supabase, postgres, mysql)
 * - Connection string configuration
 * - Connection testing
 * - Saving database configuration
 */

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { platformDb } from '../../services/platformDatabase';
import { db } from '../../services/database';
import {
    Database,
    Cloud,
    Server,
    Key,
    Wifi,
    WifiOff,
    ShieldCheck,
    AlertCircle,
    Save
} from 'lucide-react';
import type { Company, CloudConfig, DbConnectionConfig } from '../../types';
import type { DatabaseFormState, ConnectionTestStatus } from './types';

interface DatabaseTabProps {
    company: Company | null;
    dbConnection: DbConnectionConfig | null | undefined;
    cloudConfig: CloudConfig;
    updateCloudConfig: (config: Partial<CloudConfig>) => void;
    isSaving: boolean;
    setIsSaving: (saving: boolean) => void;
    onMessage: (message: { type: 'success' | 'error'; text: string }) => void;
}

export const DatabaseTab: React.FC<DatabaseTabProps> = ({
    company,
    dbConnection,
    cloudConfig,
    updateCloudConfig,
    isSaving,
    setIsSaving,
    onMessage
}) => {
    const [form, setForm] = useState<DatabaseFormState>({
        type: dbConnection?.type || 'local',
        name: dbConnection?.name || 'Production Database',
        host: dbConnection?.host || '',
        port: dbConnection?.port?.toString() || '5432',
        database: dbConnection?.database || '',
        username: dbConnection?.username || '',
        password: '',
        apiUrl: dbConnection?.apiUrl || cloudConfig.apiUrl || '',
        apiKey: dbConnection?.apiKey || cloudConfig.apiKey || '',
        sslEnabled: dbConnection?.sslEnabled ?? true
    });
    const [testStatus, setTestStatus] = useState<ConnectionTestStatus>('idle');

    const handleTestConnection = async () => {
        setTestStatus('testing');

        if (form.type === 'local') {
            setTestStatus('success');
            return;
        }

        if (form.type === 'supabase') {
            updateCloudConfig({
                enabled: true,
                apiUrl: form.apiUrl,
                apiKey: form.apiKey
            });
            const success = await db.testConnection();
            setTestStatus(success ? 'success' : 'failed');
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setTestStatus('failed');
            onMessage({ type: 'error', text: 'Direct database connections require a backend proxy. Please use Supabase or configure a REST endpoint.' });
        }
    };

    const handleSave = async () => {
        if (!company) return;
        setIsSaving(true);
        try {
            await platformDb.saveDbConnection(company.id, {
                type: form.type,
                name: form.name,
                host: form.host || undefined,
                port: form.port ? parseInt(form.port) : undefined,
                database: form.database || undefined,
                username: form.username || undefined,
                apiUrl: form.apiUrl || undefined,
                apiKey: form.apiKey || undefined,
                sslEnabled: form.sslEnabled,
                isActive: true,
                testStatus: testStatus === 'success' ? 'success' : testStatus === 'failed' ? 'failed' : 'pending',
                lastTestedAt: Date.now()
            });

            if (form.type === 'local') {
                updateCloudConfig({ enabled: false });
            } else if (form.type === 'supabase') {
                updateCloudConfig({ enabled: true, apiUrl: form.apiUrl, apiKey: form.apiKey });
            }

            onMessage({ type: 'success', text: 'Database connection saved!' });
        } catch (e) {
            onMessage({ type: 'error', text: 'Failed to save database connection' });
        }
        setIsSaving(false);
    };

    const dbTypeOptions = [
        { type: 'local' as const, label: 'Local Sandbox', icon: Server, desc: 'Browser storage' },
        { type: 'supabase' as const, label: 'Supabase', icon: Cloud, desc: 'REST API' },
        { type: 'postgres' as const, label: 'PostgreSQL', icon: Database, desc: 'Direct connection' },
        { type: 'mysql' as const, label: 'MySQL', icon: Database, desc: 'Direct connection' }
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-deepBlue flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Database Connection
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Configure your data storage backend.</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${form.type !== 'local'
                    ? 'bg-teal/10 text-teal border-teal/20'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                    {form.type !== 'local' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {form.type !== 'local' ? 'Cloud Database' : 'Local Sandbox'}
                </div>
            </div>
            <div className="p-6 space-y-6">
                {/* Database Type Selection */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Database Type</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {dbTypeOptions.map(opt => (
                            <button
                                key={opt.type}
                                onClick={() => setForm(prev => ({ ...prev, type: opt.type }))}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${form.type === opt.type
                                    ? 'border-teal bg-teal/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <opt.icon className={`w-6 h-6 mb-2 ${form.type === opt.type ? 'text-teal' : 'text-gray-400'}`} />
                                <p className="font-bold text-sm text-gray-800">{opt.label}</p>
                                <p className="text-xs text-gray-500">{opt.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Connection Name */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Connection Name</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                        placeholder="e.g., Production Database"
                    />
                </div>

                {/* Supabase Config */}
                {form.type === 'supabase' && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">API Endpoint URL</label>
                            <div className="relative">
                                <Cloud className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                                    placeholder="https://xyz.supabase.co/rest/v1"
                                    value={form.apiUrl}
                                    onChange={(e) => setForm(prev => ({ ...prev, apiUrl: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service API Key</label>
                            <div className="relative">
                                <Key className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                <input
                                    type="password"
                                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                                    placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                                    value={form.apiKey}
                                    onChange={(e) => setForm(prev => ({ ...prev, apiKey: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Direct DB Config (PostgreSQL/MySQL) */}
                {(form.type === 'postgres' || form.type === 'mysql') && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Backend Proxy Required</p>
                                <p className="text-xs mt-1">Direct database connections from the browser are not possible for security reasons. You'll need to set up a backend proxy or use Supabase/PostgREST.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Host</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                                    placeholder="localhost or IP"
                                    value={form.host}
                                    onChange={(e) => setForm(prev => ({ ...prev, host: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Port</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                                    placeholder={form.type === 'postgres' ? '5432' : '3306'}
                                    value={form.port}
                                    onChange={(e) => setForm(prev => ({ ...prev, port: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Database Name</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                                placeholder="my_database"
                                value={form.database}
                                onChange={(e) => setForm(prev => ({ ...prev, database: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                                    placeholder="postgres"
                                    value={form.username}
                                    onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                                <input
                                    type="password"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="ssl-enabled"
                                checked={form.sslEnabled}
                                onChange={(e) => setForm(prev => ({ ...prev, sslEnabled: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-300 text-teal focus:ring-teal"
                            />
                            <label htmlFor="ssl-enabled" className="text-sm text-gray-700">Enable SSL/TLS encryption</label>
                        </div>
                    </div>
                )}

                {/* Local storage info */}
                {form.type === 'local' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                        <p className="font-bold flex items-center gap-2"><Server className="w-4 h-4" /> Local Browser Storage</p>
                        <p className="text-xs mt-1">Data is stored in your browser's localStorage. Fast for testing, but data will not sync across devices or persist if browser data is cleared.</p>
                    </div>
                )}

                {/* Test & Save */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <Button variant="secondary" onClick={handleTestConnection} disabled={testStatus === 'testing'}>
                        {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <div className="flex items-center gap-4">
                        {testStatus === 'success' && (
                            <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                                <ShieldCheck className="w-4 h-4" /> Connection Verified
                            </span>
                        )}
                        {testStatus === 'failed' && (
                            <span className="text-sm font-bold text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> Connection Failed
                            </span>
                        )}
                        <Button onClick={handleSave} disabled={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Connection'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
