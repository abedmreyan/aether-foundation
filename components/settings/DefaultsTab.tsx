/**
 * Defaults Tab Component
 * Default view and pagination settings
 * 
 * @ai-context This component handles:
 * - Default pipeline view selection (kanban/table)
 * - Entries per page configuration
 */

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { platformDb } from '../../services/platformDatabase';
import { Sliders, Save } from 'lucide-react';
import type { Company } from '../../types';
import type { DefaultsFormState } from './types';

interface DefaultsTabProps {
    company: Company | null;
    isSaving: boolean;
    setIsSaving: (saving: boolean) => void;
    onMessage: (message: { type: 'success' | 'error'; text: string }) => void;
}

export const DefaultsTab: React.FC<DefaultsTabProps> = ({
    company,
    isSaving,
    setIsSaving,
    onMessage
}) => {
    const [form, setForm] = useState<DefaultsFormState>({
        defaultView: company?.settings?.defaults?.defaultView || 'kanban',
        entriesPerPage: company?.settings?.defaults?.entriesPerPage || 25
    });

    const handleSave = async () => {
        if (!company) return;
        setIsSaving(true);
        try {
            await platformDb.updateCompanySettings(company.id, {
                defaults: {
                    defaultView: form.defaultView,
                    entriesPerPage: form.entriesPerPage
                }
            });
            onMessage({ type: 'success', text: 'Default settings saved!' });
        } catch (e) {
            onMessage({ type: 'error', text: 'Failed to save default settings' });
        }
        setIsSaving(false);
    };

    const viewOptions = [
        { value: 'kanban' as const, label: 'Kanban Board', desc: 'Drag and drop cards between stages' },
        { value: 'table' as const, label: 'Table View', desc: 'Spreadsheet-style data view' }
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-deepBlue flex items-center gap-2">
                    <Sliders className="w-5 h-5" />
                    Default Settings
                </h3>
                <p className="text-sm text-gray-500 mt-1">Configure default behaviors for your CRM.</p>
            </div>
            <div className="p-6 space-y-6">
                {/* Default View */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Default Pipeline View</label>
                    <div className="flex gap-4">
                        {viewOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setForm(prev => ({ ...prev, defaultView: opt.value }))}
                                className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${form.defaultView === opt.value
                                    ? 'border-teal bg-teal/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <p className="font-bold text-gray-800">{opt.label}</p>
                                <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Entries Per Page */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Entries Per Page</label>
                    <div className="flex gap-3">
                        {[25, 50, 100].map(num => (
                            <button
                                key={num}
                                onClick={() => setForm(prev => ({ ...prev, entriesPerPage: num as 25 | 50 | 100 }))}
                                className={`px-6 py-2 rounded-lg border-2 font-bold transition-all ${form.entriesPerPage === num
                                    ? 'border-teal bg-teal text-white'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Defaults'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
