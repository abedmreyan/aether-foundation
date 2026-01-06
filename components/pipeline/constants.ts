/**
 * Pipeline Constants
 * Shared constants for pipeline components
 */

import React from 'react';
import type { FieldType } from '../../types';
import {
    Type,
    Mail,
    Phone,
    Hash,
    DollarSign,
    Calendar,
    List,
    ToggleLeft,
    FileText,
    Globe,
    Link
} from 'lucide-react';

// Field type options
export const FIELD_TYPES: { type: FieldType; label: string; icon: React.ElementType; description: string }[] = [
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
export const STAGE_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#6B7280', '#14B8A6', '#F97316'
];
