// Validators for Nicaraguan identification documents and form fields

/**
 * Validates a Nicaraguan Cédula
 * Format: XXX-DDMMYY-XXXXL (14 characters with hyphens)
 * 3 digits (municipality) - 6 digits (birthdate DDMMYY) - 4 digits + 1 letter
 */
export function validateCedula(value) {
    if (!value) return { valid: true, message: '' }; // Optional field
    const cleaned = value.replace(/[-\s]/g, '');
    // 13 digits + 1 letter = 14 characters
    const cedulaRegex = /^\d{3}-?\d{6}-?\d{4}[A-Za-z]$/;
    if (!cedulaRegex.test(value.trim()) && !/^\d{13}[A-Za-z]$/.test(cleaned)) {
        return { valid: false, message: 'Formato de cédula inválido. Ej: 001-010190-0001A' };
    }
    return { valid: true, message: '' };
}

/**
 * Validates a Nicaraguan RUC
 * Format: J + 13 digits (for juridical entities) or same as cédula for natural persons
 */
export function validateRUC(value) {
    if (!value) return { valid: true, message: '' };
    const cleaned = value.replace(/[-\s]/g, '');
    // RUC for legal entity: J + 13 digits
    const rucJuridicoRegex = /^[Jj]\d{13}$/;
    // RUC for natural person: same as cédula (14 chars)
    const rucNaturalRegex = /^\d{13}[A-Za-z]$/;

    if (!rucJuridicoRegex.test(cleaned) && !rucNaturalRegex.test(cleaned)) {
        return { valid: false, message: 'RUC inválido. Jurídico: J + 13 dígitos. Natural: cédula' };
    }
    return { valid: true, message: '' };
}

/**
 * Validates a Nicaraguan identification (cédula or RUC)
 * Accepts both formats automatically
 */
export function validateClientId(value) {
    if (!value) return { valid: true, message: '' };
    const cedulaResult = validateCedula(value);
    const rucResult = validateRUC(value);

    if (cedulaResult.valid || rucResult.valid) {
        return { valid: true, message: '' };
    }
    return { valid: false, message: 'Cédula o RUC inválido. Cédula: 001-010190-0001A, RUC: J0310000000001' };
}

/**
 * Validates a Nicaraguan phone number
 * 8 digits, optionally with country code +505
 */
export function validatePhone(value) {
    if (!value) return { valid: true, message: '' };
    const cleaned = value.replace(/[-\s()]/g, '');
    // Allow: 8 digits, or +505 + 8 digits, or 505 + 8 digits
    const phoneRegex = /^(\+?505)?\d{8}$/;
    if (!phoneRegex.test(cleaned)) {
        return { valid: false, message: 'Teléfono inválido. Debe tener 8 dígitos. Ej: 8888-8888' };
    }
    return { valid: true, message: '' };
}

/**
 * Validates email format
 */
export function validateEmail(value) {
    if (!value) return { valid: true, message: '' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
        return { valid: false, message: 'Email inválido. Ej: nombre@correo.com' };
    }
    return { valid: true, message: '' };
}

/**
 * Validates a price value (positive number, max 2 decimals)
 */
export function validatePrice(value) {
    if (value === '' || value === undefined || value === null) {
        return { valid: false, message: 'El precio es requerido' };
    }
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
        return { valid: false, message: 'El precio debe ser un número positivo' };
    }
    if (num > 999999.99) {
        return { valid: false, message: 'El precio es demasiado alto' };
    }
    return { valid: true, message: '' };
}

/**
 * Validates a stock/quantity value (positive integer)
 */
export function validateStock(value) {
    if (value === '' || value === undefined || value === null) {
        return { valid: true, message: '' }; // Optional, defaults to 0
    }
    const num = parseInt(value);
    if (isNaN(num) || num < 0) {
        return { valid: false, message: 'La cantidad debe ser un número entero positivo' };
    }
    if (!Number.isInteger(Number(value)) && value.toString().includes('.')) {
        return { valid: false, message: 'La cantidad debe ser un número entero' };
    }
    return { valid: true, message: '' };
}

/**
 * Validates a required field
 */
export function validateRequired(value, fieldName = 'Este campo') {
    if (!value || (typeof value === 'string' && !value.trim())) {
        return { valid: false, message: `${fieldName} es requerido` };
    }
    return { valid: true, message: '' };
}

/**
 * Runs multiple validations and returns all errors
 * @param {Object} validations - { fieldName: { value, validators: [fn] } }
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateForm(validations) {
    const errors = {};
    let isValid = true;

    for (const [field, config] of Object.entries(validations)) {
        for (const validator of config.validators) {
            const result = validator(config.value);
            if (!result.valid) {
                errors[field] = result.message;
                isValid = false;
                break; // Stop at first error for this field
            }
        }
    }

    return { isValid, errors };
}
