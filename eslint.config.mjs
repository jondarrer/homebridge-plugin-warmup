import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.node,
      },

      ecmaVersion: 13,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
    },

    rules: {},
  },
  {
    files: ['**/*.test.ts'],

    rules: {
      'max-lines': 'off',
      'no-useless-escape': 'off',
    },
  },
];
