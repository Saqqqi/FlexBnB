import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const isProd = process.env.NODE_ENV === 'production';

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  {
    rules: {
      /**
       * no-console — error in production builds, warn in development.
       *
       * console.log of tokens, auth headers, or user objects is a security
       * violation (visible in DevTools and browser extensions).
       *
       * Allowed in production: none.
       * Allowed in development: console.warn and console.error only.
       *
       * To intentionally log in development, use:
       *   if (process.env.NODE_ENV !== 'production') console.error(...)
       */
      'no-console': isProd
        ? 'error'
        : ['warn', { allow: ['warn', 'error'] }],

      /**
       * no-debugger — always an error. A committed debugger statement pauses
       * execution in DevTools for every user who has it open.
       */
      'no-debugger': 'error',
    },
  },
];

export default eslintConfig;
