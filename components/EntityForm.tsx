/**
 * Entity Form Component
 * Dynamic form builder based on FieldDefinition
 */

import React, { useState, useEffect } from 'react';
import {
    FieldDefinition,
    CRMEntity,
    PipelineConfig,
    StageDefinition
} from '../types';
import { validateField, validateForm, FormValidationResult } from '../services/validation';
import { X, Save, AlertCircle } from 'lucide-react';

interface EntityFormProps {
    pipeline: PipelineConfig;
    item?: CRMEntity | null;
    initialStage?: string;
    onSave: (data: Partial<CRMEntity>) => Promise<void>;
    onCancel: () => void;
    relatedData?: Record<string, CRMEntity[]>;
    visibleFields: FieldDefinition[];
}

export const EntityForm: React.FC<EntityFormProps> = ({
    pipeline,
    item,
    initialStage,
    onSave,
    onCancel,
    relatedData,
    visibleFields
}) => {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isEdit = !!item;

    useEffect(() => {
        if (item) {
            // Populate form with existing data
            const data: Record<string, any> = { stage: item.stage };
            for (const field of visibleFields) {
                data[field.name] = item[field.name] ?? field.defaultValue ?? '';
            }
            setFormData(data);
        } else {
            // Initialize with defaults
            const data: Record<string, any> = { stage: initialStage || pipeline.stages[0]?.id || 'new' };
            for (const field of visibleFields) {
                data[field.name] = field.defaultValue ?? '';
            }
            setFormData(data);
        }
    }, [item, visibleFields, initialStage, pipeline.stages]);

    const handleChange = (fieldName: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));

        // Clear error for this field
        if (errors[fieldName]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[fieldName];
                return next;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        // Validate
        const validation = validateForm(formData, visibleFields);
        if (!validation.isValid) {
            setErrors(validation.fieldErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            await onSave(formData);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderField = (field: FieldDefinition) => {
        const value = formData[field.name] ?? '';
        const fieldErrors = errors[field.name] || [];
        const hasError = fieldErrors.length > 0;

        const baseInputClass = `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors
                           ${hasError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-200 focus:border-teal focus:ring-teal/20'}`;

        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className={baseInputClass}
                    />
                );

            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className={`${baseInputClass} cursor-pointer`}
                    >
                        <option value="">Select {field.label}</option>
                        {field.options?.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                );

            case 'multiselect':
                return (
                    <div className="space-y-1">
                        {field.options?.map(option => (
                            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={(value || []).includes(option.value)}
                                    onChange={(e) => {
                                        const current = value || [];
                                        const next = e.target.checked
                                            ? [...current, option.value]
                                            : current.filter((v: string) => v !== option.value);
                                        handleChange(field.name, next);
                                    }}
                                    className="w-4 h-4 text-teal rounded focus:ring-teal"
                                />
                                <span className="text-sm text-gray-700">{option.label}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'boolean':
                return (
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => handleChange(field.name, e.target.checked)}
                            className="w-4 h-4 text-teal rounded focus:ring-teal"
                        />
                        <span className="text-sm text-gray-700">{field.label}</span>
                    </label>
                );

            case 'number':
            case 'currency':
                return (
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value ? Number(e.target.value) : '')}
                        placeholder={field.placeholder}
                        min={field.validation?.min}
                        max={field.validation?.max}
                        step={field.type === 'currency' ? '0.01' : '1'}
                        className={baseInputClass}
                    />
                );

            case 'date':
                return (
                    <input
                        type="date"
                        value={value ? new Date(value).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleChange(field.name, e.target.value ? new Date(e.target.value).getTime() : '')}
                        className={baseInputClass}
                    />
                );

            case 'datetime':
                return (
                    <input
                        type="datetime-local"
                        value={value ? new Date(value).toISOString().slice(0, 16) : ''}
                        onChange={(e) => handleChange(field.name, e.target.value ? new Date(e.target.value).getTime() : '')}
                        className={baseInputClass}
                    />
                );

            case 'relation':
                if (!field.relationConfig || !relatedData) {
                    return <input type="text" value={value} onChange={(e) => handleChange(field.name, e.target.value)} className={baseInputClass} />;
                }
                const relatedItems = relatedData[field.relationConfig.entityType] || [];
                return (
                    <select
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className={`${baseInputClass} cursor-pointer`}
                    >
                        <option value="">Select {field.label}</option>
                        {relatedItems.map(item => (
                            <option key={item.id} value={item.id}>
                                {item[field.relationConfig!.displayField] || item.id}
                            </option>
                        ))}
                    </select>
                );

            case 'email':
                return (
                    <input
                        type="email"
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || 'email@example.com'}
                        className={baseInputClass}
                    />
                );

            case 'phone':
                return (
                    <input
                        type="tel"
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || '+1 (234) 567-8900'}
                        className={baseInputClass}
                    />
                );

            case 'url':
                return (
                    <input
                        type="url"
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || 'https://example.com'}
                        className={baseInputClass}
                    />
                );

            case 'text':
            default:
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        maxLength={field.validation?.maxLength}
                        className={baseInputClass}
                    />
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-deepBlue">
                        {isEdit ? 'Edit' : 'Add New'} {pipeline.name.replace(' Pipeline', '')}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    {submitError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {submitError}
                        </div>
                    )}

                    {/* Stage Selector */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stage
                        </label>
                        <select
                            value={formData.stage || ''}
                            onChange={(e) => handleChange('stage', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20"
                        >
                            {pipeline.stages.map(stage => (
                                <option key={stage.id} value={stage.id}>{stage.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Dynamic Fields */}
                    <div className="space-y-4">
                        {visibleFields.map(field => (
                            <div key={field.id}>
                                {field.type !== 'boolean' && (
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                )}

                                {renderField(field)}

                                {errors[field.name]?.map((error, idx) => (
                                    <p key={idx} className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {error}
                                    </p>
                                ))}
                            </div>
                        ))}
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EntityForm;
