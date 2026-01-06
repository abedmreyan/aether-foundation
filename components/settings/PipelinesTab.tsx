/**
 * Pipelines Tab Component
 * Pipeline configuration management
 * 
 * @ai-context This component handles:
 * - Listing all pipelines
 * - Selecting a pipeline for editing
 * - Integrating with PipelineBuilder for stage/field configuration
 */

import React, { useState } from 'react';
import { GitBranch } from 'lucide-react';
import type { PipelineConfig } from '../../types';
import { PipelineBuilder } from '../PipelineBuilder';

interface PipelinesTabProps {
    pipelineConfigs: PipelineConfig[];
}

export const PipelinesTab: React.FC<PipelinesTabProps> = ({ pipelineConfigs }) => {
    const [selectedPipeline, setSelectedPipeline] = useState<PipelineConfig | null>(null);
    const [pipelines, setPipelines] = useState<PipelineConfig[]>(pipelineConfigs);

    const handleUpdatePipeline = (updatedPipeline: PipelineConfig) => {
        setPipelines(pipelines.map(p => p.id === updatedPipeline.id ? updatedPipeline : p));
    };

    if (selectedPipeline) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                    <button
                        onClick={() => setSelectedPipeline(null)}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
                    >
                        ← Back to Pipelines
                    </button>
                </div>
                <div className="p-6">
                    <PipelineBuilder
                        pipeline={selectedPipeline}
                        onUpdate={handleUpdatePipeline}
                        onClose={() => setSelectedPipeline(null)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-deepBlue flex items-center gap-2">
                    <GitBranch className="w-5 h-5" />
                    Pipeline Configuration
                </h3>
                <p className="text-sm text-gray-500 mt-1">Customize stages, fields, and automations for each pipeline.</p>
            </div>
            <div className="p-6">
                <div className="grid gap-4">
                    {pipelines.map(pipeline => (
                        <button
                            key={pipeline.id}
                            onClick={() => setSelectedPipeline(pipeline)}
                            className="p-4 border border-gray-200 rounded-xl text-left hover:border-teal hover:shadow-sm transition-all flex items-center justify-between group"
                        >
                            <div>
                                <p className="font-bold text-gray-800">{pipeline.name}</p>
                                <p className="text-sm text-gray-500">{pipeline.description || `${pipeline.stages.length} stages, ${pipeline.fields.length} fields`}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-1">
                                    {pipeline.stages.slice(0, 5).map(stage => (
                                        <div
                                            key={stage.id}
                                            className="w-4 h-4 rounded-full border-2 border-white"
                                            style={{ backgroundColor: stage.color }}
                                            title={stage.name}
                                        />
                                    ))}
                                    {pipeline.stages.length > 5 && (
                                        <div className="w-4 h-4 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-600">
                                            +{pipeline.stages.length - 5}
                                        </div>
                                    )}
                                </div>
                                <span className="text-teal opacity-0 group-hover:opacity-100 transition-opacity">
                                    Configure →
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
