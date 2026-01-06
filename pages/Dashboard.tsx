/**
 * Dashboard Page
 * Main application shell with sidebar navigation and content routing
 * 
 * @ai-context This is the refactored Dashboard using modular navigation components.
 * Tab content is rendered conditionally based on activeTab.
 */

import React, { useContext, useState } from 'react';
import { GlobalContext } from '../App';
import { Button } from '../components/Button';
import { CRM } from './CRM';
import { Settings } from './Settings';

// Navigation module
import {
    Sidebar,
    TopBar,
    getNavigationForRole,
    defaultSidebarConfig,
    type DashboardTab
} from '../components/navigation';

// Icons for content views
import {
    Database,
    Key,
    Link,
    Network
} from 'lucide-react';

// Charts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
    dbConnection?: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ dbConnection }) => {
    const {
        pipelines,
        dataSchemas,
        logout,
        user,
        company,
        cloudConfig,
        pipelineConfigs
    } = useContext(GlobalContext);

    const [activeTab, setActiveTab] = useState<DashboardTab>('crm');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    // Get navigation filtered by user role
    const userRole = user?.role || 'team';
    const navigationSections = getNavigationForRole(userRole, defaultSidebarConfig);

    // Chart data for overview
    const chartData = [
        { name: 'Mon', leads: 12, sales: 4 },
        { name: 'Tue', leads: 19, sales: 8 },
        { name: 'Wed', leads: 15, sales: 6 },
        { name: 'Thu', leads: 25, sales: 12 },
        { name: 'Fri', leads: 32, sales: 15 },
    ];

    // Get title for current tab
    const getTabTitle = () => {
        const titles: Record<DashboardTab, string> = {
            crm: 'CRM',
            overview: 'Overview',
            scaffold: 'The Scaffold',
            architect: 'The Architect',
            support: 'Aether Support',
            settings: 'Configuration'
        };
        return titles[activeTab] || activeTab;
    };

    return (
        <div className="flex h-screen bg-lightGray/30 overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isExpanded={isSidebarExpanded}
                onExpandChange={setIsSidebarExpanded}
                sections={navigationSections}
                user={user}
                onLogout={logout}
                branding={{
                    logo: company?.settings?.branding?.logo,
                    primaryColor: company?.settings?.branding?.primaryColor
                }}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top Bar */}
                <TopBar
                    title={getTabTitle()}
                    cloudConfig={cloudConfig}
                    notificationCount={1}
                />

                {/* View Content */}
                <div className="flex-1 overflow-y-auto p-8">

                    {activeTab === 'crm' && (
                        <CRM dbConnection={dbConnection} />
                    )}

                    {activeTab === 'overview' && (
                        <OverviewContent
                            dataSchemas={dataSchemas}
                            chartData={chartData}
                        />
                    )}

                    {activeTab === 'scaffold' && (
                        <ScaffoldContent dataSchemas={dataSchemas} />
                    )}

                    {activeTab === 'architect' && (
                        <ArchitectContent pipelines={pipelines} />
                    )}

                    {activeTab === 'support' && (
                        <SupportContent />
                    )}

                    {activeTab === 'settings' && (
                        <Settings dbConnection={dbConnection} />
                    )}
                </div>
            </main>
        </div>
    );
};

// ===== Content Components =====

const TrendingIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

interface OverviewContentProps {
    dataSchemas: any[];
    chartData: any[];
}

const OverviewContent: React.FC<OverviewContentProps> = ({ dataSchemas, chartData }) => (
    <div className="space-y-8 animate-fade-in-up">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-500 mb-1">Total Records</p>
                <h3 className="text-3xl font-bold text-deepBlue">
                    {dataSchemas.reduce((acc, curr) => acc + curr.rowCount, 0)}
                </h3>
                <span className="text-xs text-teal font-bold flex items-center mt-2">
                    Across {dataSchemas.length} tables
                </span>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-500 mb-1">Pipeline Efficiency</p>
                <h3 className="text-3xl font-bold text-deepBlue">94%</h3>
                <span className="text-xs text-forestGreen font-bold flex items-center mt-2">
                    <TrendingIcon className="w-3 h-3 mr-1" /> +5% optimization
                </span>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-500 mb-1">Relationships Detected</p>
                <h3 className="text-3xl font-bold text-deepBlue">
                    {dataSchemas.reduce((acc, curr) => acc + curr.columns.filter((c: any) => c.isForeignKey).length, 0)}
                </h3>
                <span className="text-xs text-teal font-bold flex items-center mt-2">
                    Auto-linked by ID
                </span>
            </div>
        </div>
    </div>
);

interface ScaffoldContentProps {
    dataSchemas: any[];
}

const ScaffoldContent: React.FC<ScaffoldContentProps> = ({ dataSchemas }) => (
    <div className="animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-deepBlue">The Scaffold</h2>
                <p className="text-gray-500">Visual Data Schema generated from your source files.</p>
            </div>
            <Button size="sm" variant="outline">Export SQL</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {dataSchemas.map((table, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-teal" />
                            <span className="font-bold text-deepBlue font-mono text-sm">{table.tableName}</span>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">{table.rowCount} rows</span>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-gray-100">
                                {table.columns.map((col: any, cIdx: number) => (
                                    <tr key={cIdx} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-xs font-medium text-deepBlue font-mono w-1/2 flex items-center gap-2">
                                            {col.isPrimaryKey && <Key className="w-3 h-3 text-vibrantOrange" />}
                                            {col.isForeignKey && <Link className="w-3 h-3 text-teal" />}
                                            {col.name}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-400 font-mono text-right uppercase">{col.type}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {table.columns.some((c: any) => c.isForeignKey) && (
                        <div className="bg-teal/5 px-4 py-2 border-t border-teal/10">
                            {table.columns.filter((c: any) => c.isForeignKey).map((col: any, i: number) => (
                                <div key={i} className="text-xs text-teal flex items-center gap-1">
                                    <Link className="w-3 h-3" />
                                    Links to <span className="font-bold">{col.references?.table}</span> via {col.references?.column}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
);

interface ArchitectContentProps {
    pipelines: any[];
}

const ArchitectContent: React.FC<ArchitectContentProps> = ({ pipelines }) => (
    <div className="space-y-6 animate-fade-in-up">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pipelines.map((pipeline, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-teal hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Network className="w-32 h-32 text-teal" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-bold text-deepBlue">{pipeline.title}</h3>
                            <span className="px-2 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full border border-green-100">
                                Active
                            </span>
                        </div>
                        <p className="text-gray-600 mb-6 text-sm leading-relaxed">{pipeline.description}</p>

                        <div className="space-y-4 mb-8">
                            {pipeline.steps.map((step: string, sIdx: number) => (
                                <div key={sIdx} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-lightGray text-teal flex items-center justify-center text-xs font-bold shrink-0">
                                        {sIdx + 1}
                                    </div>
                                    <span className="text-sm text-darkGray font-medium">{step}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-vibrantOrange animate-pulse" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    {pipeline.efficiencyGain}
                                </span>
                            </div>
                            <Button size="sm" variant="secondary">Configure</Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const SupportContent: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full animate-fade-in-up">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-deepBlue mb-4">Aether Support Widget</h3>
            <p className="text-gray-600 text-sm mb-6">Configure your customer facing widget.</p>
            <div className="text-center py-12 text-gray-400">
                <p>Widget configuration coming soon...</p>
            </div>
        </div>
    </div>
);
