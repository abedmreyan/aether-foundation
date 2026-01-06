/**
 * Validation Service
 * Provides email, phone, and dynamic field validation utilities
 */

import { FieldDefinition, ValidationResult } from '../types';

// ===== EMAIL VALIDATION =====

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const validateEmail = (email: string): ValidationResult => {
    if (!email || email.trim() === '') {
        return { isValid: false, errors: ['Email is required'] };
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedEmail.length > 254) {
        return { isValid: false, errors: ['Email exceeds maximum length of 254 characters'] };
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
        return { isValid: false, errors: ['Invalid email format. Expected: user@domain.com'] };
    }

    // Check for consecutive dots
    if (trimmedEmail.includes('..')) {
        return { isValid: false, errors: ['Email cannot contain consecutive dots'] };
    }

    // Check domain has at least one dot
    const parts = trimmedEmail.split('@');
    if (parts.length !== 2 || !parts[1].includes('.')) {
        return { isValid: false, errors: ['Invalid email domain'] };
    }

    return { isValid: true, errors: [] };
};

// ===== PHONE VALIDATION =====

// Supports international format: +1 234 567 8900 or (123) 456-7890 or 1234567890
const PHONE_REGEX = /^\+?[\d\s\-\(\)\.]{10,20}$/;

export const validatePhone = (phone: string): ValidationResult => {
    if (!phone || phone.trim() === '') {
        return { isValid: false, errors: ['Phone number is required'] };
    }

    const trimmedPhone = phone.trim();

    // Remove all non-numeric characters for digit count
    const digitsOnly = trimmedPhone.replace(/\D/g, '');

    if (digitsOnly.length < 10) {
        return { isValid: false, errors: ['Phone number must have at least 10 digits'] };
    }

    if (digitsOnly.length > 15) {
        return { isValid: false, errors: ['Phone number cannot exceed 15 digits'] };
    }

    if (!PHONE_REGEX.test(trimmedPhone)) {
        return { isValid: false, errors: ['Invalid phone format. Use: +1 234 567 8900 or (123) 456-7890'] };
    }

    return { isValid: true, errors: [] };
};

// ===== PHONE FORMATTING =====

export const formatPhoneForDisplay = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');

    // US format
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    // International with country code
    if (digits.length === 11 && digits.startsWith('1')) {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    // Generic international format
    if (digits.length > 10) {
        return `+${digits.slice(0, digits.length - 10)} ${digits.slice(-10, -7)} ${digits.slice(-7, -4)} ${digits.slice(-4)}`;
    }

    return phone;
};

export const formatPhoneForStorage = (phone: string): string => {
    // Store only digits with optional leading +
    const digits = phone.replace(/\D/g, '');
    return phone.startsWith('+') ? `+${digits}` : digits;
};

// ===== URL VALIDATION =====

const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

export const validateUrl = (url: string): ValidationResult => {
    if (!url || url.trim() === '') {
        return { isValid: false, errors: ['URL is required'] };
    }

    if (!URL_REGEX.test(url.trim())) {
        return { isValid: false, errors: ['Invalid URL format'] };
    }

    return { isValid: true, errors: [] };
};

// ===== GENERIC FIELD VALIDATION =====

export const validateField = (value: any, field: FieldDefinition): ValidationResult => {
    const errors: string[] = [];

    // Required check
    if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field.label} is required`);
        return { isValid: false, errors };
    }

    // Skip further validation if value is empty and not required
    if (value === undefined || value === null || value === '') {
        return { isValid: true, errors: [] };
    }

    // Type-specific validation
    switch (field.type) {
        case 'email':
            const emailResult = validateEmail(String(value));
            if (!emailResult.isValid) errors.push(...emailResult.errors);
            break;

        case 'phone':
            const phoneResult = validatePhone(String(value));
            if (!phoneResult.isValid) errors.push(...phoneResult.errors);
            break;

        case 'url':
            const urlResult = validateUrl(String(value));
            if (!urlResult.isValid) errors.push(...urlResult.errors);
            break;

        case 'number':
        case 'currency':
            if (isNaN(Number(value))) {
                errors.push(`${field.label} must be a valid number`);
            } else {
                const numValue = Number(value);
                if (field.validation?.min !== undefined && numValue < field.validation.min) {
                    errors.push(field.validation.message || `${field.label} must be at least ${field.validation.min}`);
                }
                if (field.validation?.max !== undefined && numValue > field.validation.max) {
                    errors.push(field.validation.message || `${field.label} must be at most ${field.validation.max}`);
                }
            }
            break;

        case 'text':
        case 'textarea':
            const strValue = String(value);
            if (field.validation?.minLength !== undefined && strValue.length < field.validation.minLength) {
                errors.push(field.validation.message || `${field.label} must be at least ${field.validation.minLength} characters`);
            }
            if (field.validation?.maxLength !== undefined && strValue.length > field.validation.maxLength) {
                errors.push(field.validation.message || `${field.label} must be at most ${field.validation.maxLength} characters`);
            }
            if (field.validation?.pattern) {
                const regex = new RegExp(field.validation.pattern);
                if (!regex.test(strValue)) {
                    errors.push(field.validation.message || `${field.label} format is invalid`);
                }
            }
            break;

        case 'select':
            if (field.options && !field.options.some(opt => opt.value === value)) {
                errors.push(`${field.label} must be one of the valid options`);
            }
            break;

        case 'multiselect':
            if (field.options && Array.isArray(value)) {
                const invalidOptions = value.filter(v => !field.options!.some(opt => opt.value === v));
                if (invalidOptions.length > 0) {
                    errors.push(`${field.label} contains invalid options`);
                }
            }
            break;

        case 'date':
        case 'datetime':
            const timestamp = typeof value === 'number' ? value : Date.parse(value);
            if (isNaN(timestamp)) {
                errors.push(`${field.label} must be a valid date`);
            }
            break;

        case 'boolean':
            if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                errors.push(`${field.label} must be true or false`);
            }
            break;
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// ===== FORM VALIDATION =====

export interface FormValidationResult {
    isValid: boolean;
    fieldErrors: Record<string, string[]>;
}

export const validateForm = (
    data: Record<string, any>,
    fields: FieldDefinition[]
): FormValidationResult => {
    const fieldErrors: Record<string, string[]> = {};
    let isValid = true;

    for (const field of fields) {
        const result = validateField(data[field.name], field);
        if (!result.isValid) {
            isValid = false;
            fieldErrors[field.name] = result.errors;
        }
    }

    return { isValid, fieldErrors };
};
