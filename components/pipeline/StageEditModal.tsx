/**
 * Stage Edit Modal
 * Modal component for editing pipeline stages
 */

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';
import type { StageDefinition } from '../../types';
import { STAGE_COLORS } from './constants';

interface StageEditModalProps {
    stage: StageDefinition;
    onSave: (stage: StageDefinition) => void;
    onClose: () => void;
}

export const StageEditModal: React.FC<StageEditModalProps> = ({ stage, onSave, onClose }) => {
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
