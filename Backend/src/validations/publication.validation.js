import { body, query, param } from 'express-validator';

export const validatePublication = [
  body('title')
    .notEmpty()
    .withMessage('Publication title is required')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Title must be between 5 and 255 characters long'),

  body('abstract')
    .notEmpty()
    .withMessage('Publication abstract is required')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Abstract must be at least 20 characters long'),

  body('doi')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^10.\d{4,9}\/[-._;()/:A-Z0-9]+$/i)
    .withMessage('Please provide a valid DOI (e.g. 10.1016/j.jbi.2026.104230)'),

  body('publicationYear')
    .notEmpty()
    .withMessage('Publication year is required')
    .isInt({ min: 1800, max: new Date().getFullYear() + 1 })
    .withMessage('Please provide a valid publication year'),

  body('publicationType')
    .optional()
    .isIn(['journal', 'conference', 'book', 'book-chapter', 'patent', 'thesis', 'preprint', 'other'])
    .withMessage('Invalid publication type'),

  body('citationCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Citation count cannot be negative'),

  body('pdfUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('Please provide a valid URL to the PDF file'),

  body('visibility')
    .optional()
    .isIn(['public', 'private', 'restricted'])
    .withMessage('Invalid visibility level'),

  body('authors')
    .isArray({ min: 1 })
    .withMessage('At least one author must be specified'),

  body('authors.*.authorName')
    .notEmpty()
    .withMessage('Author name is required')
    .trim(),

  body('authors.*.authorOrder')
    .notEmpty()
    .withMessage('Author order is required')
    .isInt({ min: 1 })
    .withMessage('Author order must be an integer starting at 1'),

  body('authors.*.correspondingAuthor')
    .optional()
    .isBoolean()
    .withMessage('correspondingAuthor must be a boolean'),

  body('authors.*.email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email for the author'),
];

export const createPublicationValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 300 }).withMessage('Title cannot exceed 300 characters'),

  body('abstract')
    .trim()
    .notEmpty().withMessage('Abstract is required')
    .isLength({ max: 5000 }).withMessage('Abstract cannot exceed 5000 characters'),

  body('authors')
    .isArray({ min: 1 }).withMessage('At least one author is required'),

  body('authors.*.displayName')
    .trim()
    .notEmpty().withMessage('Each author must have a displayName'),

  body('authors.*.institution')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Institution name too long'),

  body('journal')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Journal name too long'),

  body('publicationDate')
    .optional()
    .isISO8601().withMessage('publicationDate must be a valid date (ISO 8601)'),

  body('tags')
    .optional()
    .isArray().withMessage('tags must be an array'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Each tag cannot exceed 50 characters'),

  body('citationCount')
    .optional()
    .isInt({ min: 0 }).withMessage('citationCount must be a non-negative integer'),

  body('fileUrl')
    .optional()
    .trim()
    .isURL().withMessage('fileUrl must be a valid URL'),
];

export const updatePublicationValidator = [
  param('id')
    .isMongoId().withMessage('Invalid publication ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Title cannot exceed 300 characters'),

  body('abstract')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Abstract cannot exceed 5000 characters'),

  body('authors')
    .optional()
    .isArray({ min: 1 }).withMessage('authors must have at least one entry'),

  body('authors.*.displayName')
    .optional()
    .trim()
    .notEmpty().withMessage('Each author must have a displayName'),

  body('authors.*.institution')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Institution name too long'),

  body('journal')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Journal name too long'),

  body('publicationDate')
    .optional()
    .isISO8601().withMessage('publicationDate must be a valid date (ISO 8601)'),

  body('tags')
    .optional()
    .isArray().withMessage('tags must be an array'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Each tag cannot exceed 50 characters'),

  body('citationCount')
    .optional()
    .isInt({ min: 0 }).withMessage('citationCount must be a non-negative integer'),

  body('fileUrl')
    .optional()
    .trim()
    .isURL().withMessage('fileUrl must be a valid URL'),
];

export const getPublicationsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isIn(['publicationDate', 'citationCount', 'title', 'createdAt'])
    .withMessage('sortBy must be one of: publicationDate, citationCount, title, createdAt'),

  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('order must be asc or desc'),

  query('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage('year must be a valid 4-digit year'),

  query('tag')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('tag filter too long'),

  query('journal')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('journal filter too long'),
];

export const mongoIdValidator = [
  param('id')
    .isMongoId().withMessage('Invalid publication ID'),
];
