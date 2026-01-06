/**
 * Pipeline Builder Component
 * UI for customizing pipeline stages, fields, and automations
 */

import React, { useState, useContext } from 'react';
import { GlobalContext } from '../App';
import { Button } from './Button';
import { platformDb } from '../services/platformDatabase';
import {
    PipelineConfig,
    StageDefinition,
    FieldDefinition,
    FieldType,
    SelectOption,
    StageAction
} from '../types';
import {
    Plus,
    Trash2,
    Edit2,
    GripVertical,
    ChevronDown,
    ChevronUp,
    Save,
    X,
    Palette,
    Type,
    Mail,
    Phone,
    Hash,
    DollarSign,
    Calendar,
    List,
    ToggleLeft,
    FileText,
    Link,
    Globe,
    Check,
    AlertCircle,
    Zap,
    Settings
} from 'lucide-react';

// Field type options
const FIELD_TYPES: { type: FieldType; label: string; icon: React.ElementType; description: string }[] = [
    { type: 'text', label: 'Text', icon: Type, description: 'Short text input' },
    { type: 'email', label: 'Email', icon: Mail, description: 'Email with validation' },
    { type: 'phone', label: 'Phone', icon: Phone, description: 'Phone number' },
    { type: 'number', label: 'Number', icon: Hash, description: 'Numeric value' },
    { type: 'currency', label: 'Currency', icon: DollarSign, description: 'Financial amount' },
    { type: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
    { type: 'datetime', label: 'Date & Time', icon: Calendar, description: 'Date and time' },
    { type: 'select', label: 'Dropdown', icon: List, description: 'Single selection' },
    { type: 'multiselect', label: 'Multi-Select', icon: List, description: 'Multiple selections' },
    { type: 'boolean', label: 'Toggle', icon: ToggleLeft, description: 'Yes/No switch' },
    { type: 'textarea', label: 'Long Text', icon: FileText, description: 'Multi-line text' },
    { type: 'url', label: 'URL', icon: Globe, description: 'Web link' },
    { type: 'relation', label: 'Relation', icon: Link, description: 'Link to another entity' }
];

// Color presets for stages
const STAGE_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#6B7280', '#14B8A6', '#F97316'
];

interface PipelineBuilderProps {
    pipeline: PipelineConfig;
    onUpdate: (pipeline: PipelineConfig) => void;
    onClose?: () => void;
}

export const PipelineBuilder: React.FC<PipelineBuilderProps> = ({ pipeline, onUpdate, onClose }) => {
    const { pipelineConfigs } = useContext(GlobalContext);
    const [activeSection, setActiveSection] = useState<'stages' | 'fields' | 'automations'>('stages');
    const [editingStage, setEditingStage] = useState<StageDefinition | null>(null);
    const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Local state for editing
    const [stages, setStages] = useState<StageDefinition[]>(pipeline.stages);
    const [fields, setFields] = useState<FieldDefinition[]>(pipeline.fields);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedPipeline = {
                ...pipeline,
                stages,
                fields,
                updatedAt: Date.now()
            };
            await platformDb.updatePipelineConfig(pipeline.id, updatedPipeline);
            onUpdate(updatedPipeline);
            setSaveMessage({ type: 'success', text: 'Pipeline saved successfully!' });
        } catch (e) {
            setSaveMessage({ type: 'error', text: 'Failed to save pipeline' });
        }
        setIsSaving(false);
        setTimeout(() => setSaveMessage(null), 3000);
    };

    // Stage Management
    const addStage = () => {
        const newStage: StageDefinition = {
            id: `stage-${Date.now()}`,
            name: 'New Stage',
            color: STAGE_COLORS[stages.length % STAGE_COLORS.length],
            order: stages.length + 1
        };
        setStages([...stages, newStage]);
        setEditingStage(newStage);
    };

    const updateStage = (updatedStage: StageDefinition) => {
        setStages(stages.map(s => s.id === updatedStage.id ? updatedStage : s));
        setEditingStage(null);
    };

    const deleteStage = (stageId: string) => {
        if (stages.length <= 1) {
            setSaveMessage({ type: 'error', text: 'Pipeline must have at least one stage' });
            return;
        }
        setStages(stages.filter(s => s.id !== stageId).map((s, i) => ({ ...s, order: i + 1 })));
    };

    const moveStage = (stageId: string, direction: 'up' | 'down') => {
        const index = stages.findIndex(s => s.id === stageId);
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === stages.length - 1)) {
            return;
        }
        const newStages = [...stages];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];
        setStages(newStages.map((s, i) => ({ ...s, order: i + 1 })));
    };

    // Field Management
    const addField = () => {
        const newField: FieldDefinition = {
            id: `field-${Date.now()}`,
            name: `field_${fields.length + 1}`,
            type: 'text',
            label: 'New Field',
            required: false,
            showInKanban: false,
            showInTable: true,
            isSearchable: false,
            isSortable: false,
            order: fields.length + 1
        };
        setFields([...fields, newField]);
        setEditingField(newField);
    };

    const updateField = (updatedField: FieldDefinition) => {
        setFields(fields.map(f => f.id === updatedField.id ? updatedField : f));
        setEditingField(null);
    };

    const deleteField = (fieldId: string) => {
        setFields(fields.filter(f => f.id !== fieldId).map((f, i) => ({ ...f, order: i + 1 })));
    };

    const moveField = (fieldId: string, direction: 'up' | 'down') => {
        const index = fields.findIndex(f => f.id === fieldId);
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === fields.length - 1)) {
            return;
        }
        const newFields = [...fields];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
        setFields(newFields.map((f, i) => ({ ...f, order: i + 1 })));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-deepBlue">{pipeline.name}</h3>
                    <p className="text-sm text-gray-500">{pipeline.description || 'Configure stages and fields for this pipeline'}</p>
                </div>
                <div className="flex items-center gap-3">
                    {saveMessage && (
                        <span className={`text-sm font-medium flex items-center gap-1 ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                            {saveMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {saveMessage.text}
                        </span>
                    )}
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {[
                    { id: 'stages' as const, label: 'Stages', count: stages.length },
                    { id: 'fields' as const, label: 'Fields', count: fields.length },
                    { id: 'automations' as const, label: 'Automations', count: 0 }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id)}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${activeSection === tab.id
                                ? 'border-teal text-teal'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs">
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Stages Section */}
            {activeSection === 'stages' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Define the stages that entities flow through in this pipeline.</p>
                        <Button variant="secondary" size="sm" onClick={addStage}>
                            <Plus className="w-4 h-4 mr-1" /> Add Stage
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {stages.sort((a, b) => a.order - b.order).map((stage, index) => (
                            <div
                                key={stage.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
                            >
                                <div className="flex flex-col gap-1 text-gray-400">
                                    <button
                                        onClick={() => moveStage(stage.id, 'up')}
                                        disabled={index === 0}
                                        className="hover:text-gray-600 disabled:opacity-30"
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => moveStage(stage.id, 'down')}
                                        disabled={index === stages.length - 1}
                                        className="hover:text-gray-600 disabled:opacity-30"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </div>

                                <div
                                    className="w-4 h-4 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: stage.color }}
                                />

                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{stage.name}</p>
                                    {stage.description && (
                                        <p className="text-xs text-gray-500">{stage.description}</p>
                                    )}
                                </div>

                                <span className="text-xs text-gray-400 font-mono">#{stage.order}</span>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingStage(stage)}
                                        className="p-2 text-gray-400 hover:text-teal hover:bg-teal/10 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteStage(stage.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Fields Section */}
            {activeSection === 'fields' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Define the data fields collected for entities in this pipeline.</p>
                        <Button variant="secondary" size="sm" onClick={addField}>
                            <Plus className="w-4 h-4 mr-1" /> Add Field
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {fields.sort((a, b) => a.order - b.order).map((field, index) => {
                            const fieldTypeInfo = FIELD_TYPES.find(t => t.type === field.type);
                            const FieldIcon = fieldTypeInfo?.icon || Type;

                            return (
                                <div
                                    key={field.id}
                                    className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
                                >
                                    <div className="flex flex-col gap-1 text-gray-400">
                                        <button
                                            onClick={() => moveField(field.id, 'up')}
                                            disabled={index === 0}
                                            className="hover:text-gray-600 disabled:opacity-30"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => moveField(field.id, 'down')}
                                            disabled={index === fields.length - 1}
                                            className="hover:text-gray-600 disabled:opacity-30"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <FieldIcon className="w-4 h-4 text-gray-600" />
                                    </div>

                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">{field.label}</p>
                                        <p className="text-xs text-gray-500 font-mono">{field.name} • {fieldTypeInfo?.label || field.type}</p>
                                    </div>

                                    <div className="flex gap-2 text-xs">
                                        {field.required && (
                                            <span className="px-2 py-1 bg-red-50 text-red-600 rounded">Required</span>
                                        )}
                                        {field.isFinancial && (
                                            <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded">Financial</span>
                                        )}
                                        {field.showInKanban && (
                                            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">Kanban</span>
                                        )}
                                        {field.showInTable && (
                                            <span className="px-2 py-1 bg-green-50 text-green-600 rounded">Table</span>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingField(field)}
                                            className="p-2 text-gray-400 hover:text-teal hover:bg-teal/10 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteField(field.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Automations Section - Placeholder */}
            {activeSection === 'automations' && (
                <div className="text-center py-12">
                    <Zap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="font-bold text-lg text-gray-600 mb-2">Automation Editor Coming Soon</p>
                    <p className="text-sm text-gray-500">Configure automatic actions when entities move between stages.</p>
                </div>
            )}

            {/* Stage Edit Modal */}
            {editingStage && (
                <StageEditModal
                    stage={editingStage}
                    onSave={updateStage}
                    onClose={() => setEditingStage(null)}
                />
            )}

            {/* Field Edit Modal */}
            {editingField && (
                <FieldEditModal
                    field={editingField}
                    pipelines={pipelineConfigs}
                    onSave={updateField}
                    onClose={() => setEditingField(null)}
                />
            )}
        </div>
    );
};

// Stage Edit Modal
const StageEditModal: React.FC<{
    stage: StageDefinition;
    onSave: (stage: StageDefinition) => void;
    onClose: () => void;
}> = ({ stage, onSave, onClose }) => {
    const [form, setForm] = useState({
        name: stage.name,
        color: stage.color,
        description: stage.description || ''
    });

    const handleSubmit = () => {
        onSave({ ...stage, ...form });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-deepBlue">Edit Stage</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Stage Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                            placeholder="e.g., In Progress"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Description (optional)</label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                            placeholder="Brief description of this stage"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Color</label>
                        <div className="flex gap-2 flex-wrap">
                            {STAGE_COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setForm({ ...form, color })}
                                    className={`w-8 h-8 rounded-lg transition-transform ${form.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <input
                                type="color"
                                value={form.color}
                                onChange={(e) => setForm({ ...form, color: e.target.value })}
                                className="w-8 h-8 rounded-lg cursor-pointer border border-gray-300"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Stage</Button>
                </div>
            </div>
        </div>
    );
};

// Field Edit Modal
const FieldEditModal: React.FC<{
    field: FieldDefinition;
    pipelines: PipelineConfig[];
    onSave: (field: FieldDefinition) => void;
    onClose: () => void;
}> = ({ field, pipelines, onSave, onClose }) => {
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
