/**
 * Branding Tab Component
 * Company logo and color customization
 * 
 * @ai-context This component handles:
 * - Logo upload (base64)
 * - Primary and accent color selection
 * - Live preview of branding changes
 */

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { platformDb } from '../../services/platformDatabase';
import { Palette, Upload, Eye, Save } from 'lucide-react';
import type { Company } from '../../types';
import type { BrandingFormState } from './types';

interface BrandingTabProps {
    company: Company | null;
    isSaving: boolean;
    setIsSaving: (saving: boolean) => void;
    onMessage: (message: { type: 'success' | 'error'; text: string }) => void;
}

export const BrandingTab: React.FC<BrandingTabProps> = ({
    company,
    isSaving,
    setIsSaving,
    onMessage
}) => {
    const [form, setForm] = useState<BrandingFormState>({
        name: company?.name || '',
        logo: company?.settings?.branding?.logo || '',
        primaryColor: company?.settings?.branding?.primaryColor || '#05B3B4',
        accentColor: company?.settings?.branding?.accentColor || '#FF7A11'
    });

    const handleSave = async () => {
        if (!company) return;
        setIsSaving(true);
        try {
            await platformDb.updateCompanySettings(company.id, {
                branding: {
                    logo: form.logo,
                    primaryColor: form.primaryColor,
                    accentColor: form.accentColor
                }
            });
            onMessage({ type: 'success', text: 'Branding settings saved!' });
        } catch (e) {
            onMessage({ type: 'error', text: 'Failed to save branding settings' });
        }
        setIsSaving(false);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setForm(prev => ({ ...prev, logo: event.target?.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-deepBlue flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Company Branding
                </h3>
                <p className="text-sm text-gray-500 mt-1">Customize your company's visual identity.</p>
            </div>
            <div className="p-6 space-y-6">
                {/* Logo Upload */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Company Logo</label>
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                            {form.logo ? (
                                <img src={form.logo} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <Upload className="w-8 h-8 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <input
                                type="file"
                                id="logo-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleLogoUpload}
                            />
                            <label htmlFor="logo-upload">
                                <Button variant="outline" size="sm" as="span" className="cursor-pointer">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Logo
                                </Button>
                            </label>
                            <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 2MB. Recommended: 512x512px</p>
                        </div>
                    </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Primary Color</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={form.primaryColor}
                                onChange={(e) => setForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={form.primaryColor}
                                onChange={(e) => setForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Accent Color</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={form.accentColor}
                                onChange={(e) => setForm(prev => ({ ...prev, accentColor: e.target.value }))}
                                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={form.accentColor}
                                onChange={(e) => setForm(prev => ({ ...prev, accentColor: e.target.value }))}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        <Eye className="w-4 h-4 inline mr-1" />
                        Live Preview
                    </label>
                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-4 mb-4">
                            {form.logo ? (
                                <img src={form.logo} alt="Preview" className="w-12 h-12 rounded-lg object-contain" />
                            ) : (
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white text-lg"
                                    style={{ backgroundColor: form.primaryColor }}>
                                    {company?.name?.substring(0, 2).toUpperCase() || 'CO'}
                                </div>
                            )}
                            <span className="font-bold text-lg" style={{ color: form.primaryColor }}>
                                {company?.name || 'Your Company'}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <div className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                                style={{ backgroundColor: form.primaryColor }}>
                                Primary Button
                            </div>
                            <div className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                                style={{ backgroundColor: form.accentColor }}>
                                Accent Button
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Branding'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
