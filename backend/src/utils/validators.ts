import { body, param, query } from 'express-validator';
import { UserRole } from '@/types';

/**
 * Telegram authentication validation
 */
export const validateTelegramAuth = [
  body('id')
    .isString()
    .notEmpty()
    .withMessage('Telegram ID is required'),
    
  body('first_name')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
    
  body('last_name')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Last name must be less than 100 characters'),
    
  body('username')
    .optional()
    .isString()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, and underscores'),
    
  body('photo_url')
    .optional()
    .isURL()
    .withMessage('Photo URL must be a valid URL'),
    
  body('auth_date')
    .isString()
    .isNumeric()
    .withMessage('Auth date must be a valid timestamp'),
    
  body('hash')
    .isString()
    .isLength({ min: 64, max: 64 })
    .withMessage('Hash must be exactly 64 characters'),
];

/**
 * User profile update validation
 */
export const validateProfileUpdate = [
  body('first_name')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
    
  body('last_name')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Last name must be less than 100 characters'),
    
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be a valid email address'),
    
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Phone must be a valid phone number'),
    
  body('photo_url')
    .optional()
    .isURL()
    .withMessage('Photo URL must be a valid URL'),
];

/**
 * User ID parameter validation
 */
export const validateUserId = [
  param('id')
    .isUUID(4)
    .withMessage('User ID must be a valid UUID'),
];

/**
 * Role change validation
 */
export const validateRoleChange = [
  ...validateUserId,
  body('role')
    .isIn(Object.values(UserRole))
    .withMessage(`Role must be one of: ${Object.values(UserRole).join(', ')}`),
];

/**
 * Pagination validation
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('search')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
];

/**
 * Refresh token validation
 */
export const validateRefreshToken = [
  body('refreshToken')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('Refresh token must be a non-empty string'),
];

/**
 * Generic string validation
 */
export const validateString = (field: string, min: number = 1, max: number = 255) => [
  body(field)
    .isString()
    .isLength({ min, max })
    .withMessage(`${field} must be between ${min} and ${max} characters`),
];

/**
 * Generic optional string validation
 */
export const validateOptionalString = (field: string, max: number = 255) => [
  body(field)
    .optional()
    .isString()
    .isLength({ max })
    .withMessage(`${field} must be less than ${max} characters`),
];

/**
 * Email validation
 */
export const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be a valid email address'),
];

/**
 * Optional email validation
 */
export const validateOptionalEmail = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be a valid email address'),
];

/**
 * Phone validation
 */
export const validatePhone = [
  body('phone')
    .isMobilePhone('any')
    .withMessage('Phone must be a valid phone number'),
];

/**
 * Optional phone validation
 */
export const validateOptionalPhone = [
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Phone must be a valid phone number'),
];

/**
 * URL validation
 */
export const validateUrl = (field: string) => [
  body(field)
    .isURL()
    .withMessage(`${field} must be a valid URL`),
];

/**
 * Optional URL validation
 */
export const validateOptionalUrl = (field: string) => [
  body(field)
    .optional()
    .isURL()
    .withMessage(`${field} must be a valid URL`),
];

/**
 * Boolean validation
 */
export const validateBoolean = (field: string) => [
  body(field)
    .isBoolean()
    .withMessage(`${field} must be a boolean value`),
];

/**
 * Optional boolean validation
 */
export const validateOptionalBoolean = (field: string) => [
  body(field)
    .optional()
    .isBoolean()
    .withMessage(`${field} must be a boolean value`),
];

/**
 * Integer validation
 */
export const validateInteger = (field: string, min?: number, max?: number) => {
  const options: any = {};
  if (min !== undefined) options.min = min;
  if (max !== undefined) options.max = max;

  return [
    body(field)
      .isInt(options)
      .withMessage(`${field} must be an integer${min !== undefined ? ` >= ${min}` : ''}${max !== undefined ? ` <= ${max}` : ''}`),
  ];
};

/**
 * Optional integer validation
 */
export const validateOptionalInteger = (field: string, min?: number, max?: number) => {
  const options: any = {};
  if (min !== undefined) options.min = min;
  if (max !== undefined) options.max = max;

  return [
    body(field)
      .optional()
      .isInt(options)
      .withMessage(`${field} must be an integer${min !== undefined ? ` >= ${min}` : ''}${max !== undefined ? ` <= ${max}` : ''}`),
  ];
};

/**
 * Phone authentication validation (send code)
 */
export const validatePhoneAuth = [
  body('phone')
    .isString()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters'),
];

/**
 * Phone code verification validation
 */
export const validatePhoneCode = [
  body('phone')
    .isString()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters'),

  body('code')
    .isString()
    .notEmpty()
    .withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be exactly 6 digits')
    .matches(/^\d{6}$/)
    .withMessage('Verification code must contain only digits'),
];

export default {
  validateTelegramAuth,
  validateProfileUpdate,
  validateUserId,
  validateRoleChange,
  validatePagination,
  validateRefreshToken,
  validatePhoneAuth,
  validatePhoneCode,
  validateString,
  validateOptionalString,
  validateEmail,
  validateOptionalEmail,
  validatePhone,
  validateOptionalPhone,
  validateUrl,
  validateOptionalUrl,
  validateBoolean,
  validateOptionalBoolean,
  validateInteger,
  validateOptionalInteger,
};
