// Comprehensive validation utilities for the application

// Common validation patterns
export const validationPatterns = {
  // Phone number validation (10 digits, no leading zeros)
  phone: /^[1-9]\d{9}$/,
  
  // Email validation
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Indian phone number
  indianPhone: /^[6-9]\d{9}$/,
  
  // Positive number (no leading zeros, minimum 1)
  positiveNumber: /^[1-9]\d*$/,
  
  // Decimal with 2 places (0.01 increments)
  decimalTwoPlaces: /^\d+(\.\d{1,2})?$/,
  
  // Quantity validation (positive decimal)
  quantity: /^[1-9]\d*(\.\d{1,2})?$/,
  
  // DRC percentage (0-100 with 2 decimal places)
  drcPercentage: /^(100(\.00)?|[1-9]?\d(\.\d{1,2})?)$/,
  
  // Rate validation (positive number with 2 decimal places)
  rate: /^[1-9]\d*(\.\d{1,2})?$/,
  
  // Invoice number
  invoiceNumber: /^[A-Z0-9-]+$/,
  
  // Sample ID
  sampleId: /^[A-Z0-9-]+$/,
  
  // Name validation (letters, spaces, dots)
  name: /^[a-zA-Z\s.]+$/,
  
  // Address validation
  address: /^[a-zA-Z0-9\s,.-]+$/,
  
  // No leading zeros for numbers
  noLeadingZeros: /^[1-9]\d*$/
};

// Validation functions
export const validators = {
  // Required field validation
  required: (value, fieldName = 'Field') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} is required`;
    }
    return null;
  },

  // Email validation
  email: (value) => {
    if (!value) return null;
    if (!validationPatterns.email.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  // Phone number validation
  phone: (value) => {
    if (!value) return null;
    if (!validationPatterns.indianPhone.test(value)) {
      return 'Please enter a valid 10-digit phone number starting with 6-9';
    }
    return null;
  },

  // Number validation (prevent 000000000000)
  number: (value, fieldName = 'Number') => {
    if (!value) return null;
    
    // Check for all zeros
    if (/^0+$/.test(value.toString())) {
      return `${fieldName} cannot be all zeros`;
    }
    
    // Check for leading zeros (except single 0)
    if (value.toString().length > 1 && value.toString().startsWith('0')) {
      return `${fieldName} cannot start with zero`;
    }
    
    // Check if it's a valid positive number
    if (!validationPatterns.positiveNumber.test(value.toString())) {
      return `${fieldName} must be a positive number`;
    }
    
    return null;
  },

  // Decimal validation (0.01 increments)
  decimal: (value, fieldName = 'Amount', min = 0.01, max = 999999.99) => {
    if (!value) return null;
    
    const numValue = parseFloat(value);
    
    // Check if it's a valid number
    if (isNaN(numValue)) {
      return `${fieldName} must be a valid number`;
    }
    
    // Check for all zeros
    if (numValue === 0) {
      return `${fieldName} cannot be zero`;
    }
    
    // Check minimum value
    if (numValue < min) {
      return `${fieldName} must be at least ${min}`;
    }
    
    // Check maximum value
    if (numValue > max) {
      return `${fieldName} cannot exceed ${max}`;
    }
    
    // Check decimal places (max 2)
    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return `${fieldName} can have maximum 2 decimal places`;
    }
    
    // Check 0.01 increments
    const rounded = Math.round(numValue * 100) / 100;
    if (Math.abs(numValue - rounded) > 0.001) {
      return `${fieldName} must be in increments of 0.01`;
    }
    
    return null;
  },

  // Quantity validation
  quantity: (value, fieldName = 'Quantity') => {
    if (!value) return null;
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return `${fieldName} must be a valid number`;
    }
    
    if (numValue <= 0) {
      return `${fieldName} must be greater than 0`;
    }
    
    if (numValue < 0.01) {
      return `${fieldName} must be at least 0.01`;
    }
    
    // Check for reasonable maximum (10000 liters)
    if (numValue > 10000) {
      return `${fieldName} cannot exceed 10,000 liters`;
    }
    
    return null;
  },

  // DRC percentage validation
  drcPercentage: (value) => {
    if (!value) return null;
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return 'DRC percentage must be a valid number';
    }
    
    if (numValue < 0 || numValue > 100) {
      return 'DRC percentage must be between 0 and 100';
    }
    
    return null;
  },

  // Rate validation
  rate: (value, fieldName = 'Rate') => {
    if (!value) return null;
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return `${fieldName} must be a valid number`;
    }
    
    if (numValue <= 0) {
      return `${fieldName} must be greater than 0`;
    }
    
    if (numValue < 0.01) {
      return `${fieldName} must be at least ₹0.01`;
    }
    
    // Check for reasonable maximum (₹10000 per kg)
    if (numValue > 10000) {
      return `${fieldName} cannot exceed ₹10,000 per kg`;
    }
    
    return null;
  },

  // Date validation
  date: (value, fieldName = 'Date') => {
    if (!value) return null;
    
    const date = new Date(value);
    
    if (isNaN(date.getTime())) {
      return `${fieldName} must be a valid date`;
    }
    
    return null;
  },

  // TO date validation (must be after FROM date)
  toDate: (toValue, fromValue, fieldName = 'To Date') => {
    if (!toValue) return null;
    
    const toDate = new Date(toValue);
    const fromDate = fromValue ? new Date(fromValue) : new Date();
    
    if (isNaN(toDate.getTime())) {
      return `${fieldName} must be a valid date`;
    }
    
    if (toDate <= fromDate) {
      return `${fieldName} must be after the from date`;
    }
    
    // Check if date is not too far in the future (1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    if (toDate > oneYearFromNow) {
      return `${fieldName} cannot be more than 1 year in the future`;
    }
    
    return null;
  },

  // Name validation
  name: (value, fieldName = 'Name') => {
    if (!value) return null;
    
    if (!validationPatterns.name.test(value)) {
      return `${fieldName} can only contain letters, spaces, and dots`;
    }
    
    if (value.trim().length < 2) {
      return `${fieldName} must be at least 2 characters long`;
    }
    
    if (value.trim().length > 50) {
      return `${fieldName} cannot exceed 50 characters`;
    }
    
    return null;
  },

  // Address validation
  address: (value, fieldName = 'Address') => {
    if (!value) return null;
    
    if (!validationPatterns.address.test(value)) {
      return `${fieldName} contains invalid characters`;
    }
    
    if (value.trim().length < 5) {
      return `${fieldName} must be at least 5 characters long`;
    }
    
    if (value.trim().length > 200) {
      return `${fieldName} cannot exceed 200 characters`;
    }
    
    return null;
  },

  // Password validation
  password: (value) => {
    if (!value) return 'Password is required';
    
    if (value.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    
    if (value.length > 50) {
      return 'Password cannot exceed 50 characters';
    }
    
    if (value.includes(' ')) {
      return 'Password cannot contain spaces';
    }
    
    if (!/(?=.*[a-z])/.test(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    
    if (!/(?=.*[A-Z])/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    
    if (!/(?=.*\d)/.test(value)) {
      return 'Password must contain at least one number';
    }
    
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(value)) {
      return 'Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)';
    }
    
    return null;
  },
  
  // Barrel count validation
  barrelCount: (value, fieldName = 'Barrel Count') => {
    if (!value) return null;
    
    const numValue = parseInt(value, 10);
    
    if (isNaN(numValue)) {
      return `${fieldName} must be a valid number`;
    }
    
    if (numValue <= 0) {
      return `${fieldName} must be greater than 0`;
    }
    
    if (numValue > 10000) {
      return `${fieldName} cannot exceed 10,000`;
    }
    
    return null;
  }
};
// Common validation rules for forms
export const commonValidationRules = {
  // User registration
  userRegistration: {
    name: [validators.required, validators.name],
    email: [validators.required, validators.email],
    phoneNumber: [validators.required, validators.phone],
    password: [validators.required, validators.password]
  },
  
  // Login
  login: {
    email: [validators.required, validators.email],
    password: [validators.required]
  },
  
  // Latex request
  latexRequest: {
    quantity: [validators.required, validators.quantity],
    quality: [validators.required],
    location: [validators.required, validators.address],
    contactNumber: [validators.required, validators.phone],
    notes: []
  },
  
  // Rate update
  rateUpdate: {
    companyRate: [validators.required, validators.rate],
    marketRate: [validators.required, validators.rate],
    effectiveDate: [validators.required, validators.date]
  },
  
  // Date range
  dateRange: {
    fromDate: [validators.required, validators.date],
    toDate: [validators.required, validators.date, (value, fieldName, formData) => 
      validators.toDate(value, formData?.fromDate, fieldName)]
  },
  
  // Barrel data
  barrelData: {
    barrelCount: [validators.required, validators.barrelCount],
    drcPercentage: [validators.required, validators.drcPercentage],
    quantity: [validators.required, validators.quantity]
  }
};

// Validate a single field against an array of validation rules
export const validateField = (value, rules = [], fieldName = 'Field', formData = {}) => {
  if (!Array.isArray(rules)) {
    console.warn('validateField: rules must be an array');
    return null;
  }
  
  for (const rule of rules) {
    if (typeof rule === 'function') {
      const error = rule(value, fieldName, formData);
      if (error) return error;
    }
  }
  
  return null;
};

// Validate an entire form against validation rules
export const validateForm = (formData = {}, rules = {}) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(rules).forEach(fieldName => {
    const fieldRules = rules[fieldName];
    const fieldValue = formData[fieldName];
    const error = validateField(fieldValue, fieldRules, fieldName, formData);
    
    if (error) {
      errors[fieldName] = error;
      isValid = false;
    }
  });
  
  return { isValid, errors };
};

// Compatibility wrappers / convenience helpers
// These functions are used by several pages (e.g. RegisterPage) which expect
// small helper functions with specific return shapes.
export const validateName = (value) => {
  const err = validators.name(value, 'Name');
  if (err) return { valid: false, message: err };
  return { valid: true };
};

export const validateEmail = (value) => {
  // Return a string error when invalid, null when valid (matches existing validators.email)
  return validators.email(value);
};

export const validatePhoneNumber = (value) => {
  // validators.phone returns null when valid, or an error string when invalid
  return validators.phone(value);
};

export const validatePassword = (value) => {
  // Return a string error when invalid, null when valid
  return validators.password(value);
};

export const validateUserRegistration = (formData = {}) => {
  // Use the common userRegistration rules and return the errors object
  const result = validateForm(formData, commonValidationRules.userRegistration);
  return result.errors || {};
};

export const cleanPhoneNumber = (phone = '') => {
  // Strip non-digits and normalize to last 10 digits (Indian mobile)
  const digits = (phone || '').toString().replace(/\D/g, '');
  if (!digits) return '';
  // If number contains country code like 91 or +91, take last 10 digits
  if (digits.length > 10) return digits.slice(-10);
  return digits;
};

export default {  validationPatterns,
  validators,
  validateForm,
  validateField,
  commonValidationRules
};
