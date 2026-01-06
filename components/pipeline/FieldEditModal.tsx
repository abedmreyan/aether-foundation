/**
 * Field Edit Modal
 * Modal component for editing pipeline fields
 */

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';
import type { FieldDefinition, PipelineConfig, SelectOption } from '../../types';
import { FIELD_TYPES } from './constants';

interface FieldEditModalProps {
    field: FieldDefinition;
    pipelines: PipelineConfig[];
    onSave: (field: FieldDefinition) => void;
    onClose: () => void;
}

export const FieldEditModal: React.FC<FieldEditModalProps> = ({ field, pipelines, onSave, onClose }) => {
    const [form, setForm] = useState({
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required,
        isFinancial: field.isFinancial || false,
        isSearchable: field.isSearchable || false,
        isSortable: field.isSortable || false,
        showInKanban: field.showInKanban || false,
        showInTable: field.showInTable !== false,
        placeholder: field.placeholder || '',
        options: field.options || [] as SelectOption[],
        relationConfig: field.relationConfig
    });

    const [newOption, setNewOption] = useState('');

    const handleSubmit = () => {
        onSave({
            ...field,
            ...form,
            name: form.name.toLowerCase().replace(/\s+/g, '_')
        });
    };

    const addOption = () => {
        if (newOption.trim() && !form.options.find(o => o.value === newOption.trim())) {
            setForm({
                ...form,
                options: [...form.options, { value: newOption.trim().toLowerCase().replace(/\s+/g, '_'), label: newOption.trim() }]
            });
            setNewOption('');
        }
    };

    const removeOption = (value: string) => {
        setForm({ ...form, options: form.options.filter(o => o.value !== value) });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 my-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-deepBlue">Edit Field</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Label</label>
                            <input
                                type="text"
                                value={form.label}
                                onChange={(e) => setForm({ ...form, label: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                                placeholder="Display label"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Field Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none font-mono text-sm"
                                placeholder="field_name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Field Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {FIELD_TYPES.map(ft => {
                                const Icon = ft.icon;
                                return (
                                    <button
                                        key={ft.type}
                                        onClick={() => setForm({ ...form, type: ft.type })}
                                        className={`p-2 rounded-lg border-2 text-left text-xs transition-all ${form.type === ft.type
                                            ? 'border-teal bg-teal/5'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 mb-1 ${form.type === ft.type ? 'text-teal' : 'text-gray-400'}`} />
                                        <p className="font-medium text-gray-800">{ft.label}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Options for select/multiselect */}
                    {(form.type === 'select' || form.type === 'multiselect') && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Options</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newOption}
                                    onChange={(e) => setNewOption(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                                    placeholder="Add option..."
                                />
                                <Button variant="secondary" size="sm" onClick={addOption}>Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {form.options.map(opt => (
                                    <span key={opt.value} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                                        {opt.label}
                                        <button onClick={() => removeOption(opt.value)} className="text-gray-400 hover:text-red-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Relation config */}
                    {form.type === 'relation' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Related Pipeline</label>
                            <select
                                value={form.relationConfig?.entityType || ''}
                                onChange={(e) => setForm({
                                    ...form,
                                    relationConfig: { ...form.relationConfig, entityType: e.target.value, displayField: 'name' }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                            >
                                <option value="">Select pipeline...</option>
                                {pipelines.map(p => (
                                    <option key={p.id} value={p.entityType}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Placeholder</label>
                        <input
                            type="text"
                            value={form.placeholder}
                            onChange={(e) => setForm({ ...form, placeholder: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                            placeholder="Hint text when empty"
                        />
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3 pt-2">
                        <label className="block text-sm font-bold text-gray-700">Settings</label>
                        {[
                            { key: 'required', label: 'Required', desc: 'Field must be filled' },
                            { key: 'isFinancial', label: 'Financial', desc: 'Hide from non-financial roles' },
                            { key: 'isSearchable', label: 'Searchable', desc: 'Include in search' },
                            { key: 'isSortable', label: 'Sortable', desc: 'Allow sorting by this field' },
                            { key: 'showInKanban', label: 'Show in Kanban', desc: 'Display on Kanban cards' },
                            { key: 'showInTable', label: 'Show in Table', desc: 'Display in table view' }
                        ].map(toggle => (
                            <label key={toggle.key} className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form[toggle.key as keyof typeof form] as boolean}
                                    onChange={(e) => setForm({ ...form, [toggle.key]: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-teal focus:ring-teal"
                                />
                                <div>
                                    <p className="text-sm text-gray-700">{toggle.label}</p>
                                    <p className="text-xs text-gray-500">{toggle.desc}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Field</Button>
                </div>
            </div>
        </div>
    );
};
