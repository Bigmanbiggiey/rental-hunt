import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importX from 'eslint-plugin-import-x';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    settings: {
      'import/resolver': {
        typescript: true,
      },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**', mode: 'full' },
        { type: 'routes', pattern: 'src/routes/**', mode: 'full' },
        { type: 'pages', pattern: 'src/pages/**', mode: 'full' },
        { type: 'widgets', pattern: 'src/widgets/**', mode: 'full' },
        { type: 'features', pattern: 'src/features/**', mode: 'full' },
        { type: 'entities', pattern: 'src/entities/**', mode: 'full' },
        { type: 'shared', pattern: 'src/shared/**', mode: 'full' },
      ],
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import-x': importX,
      boundaries,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      'import-x/no-cycle': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            // Every layer may import from within itself (e.g. a barrel re-exporting
            // a sibling file), plus everything at or below it in the FSD hierarchy.
            // shared/ is the floor — it may only import from itself.
            {
              from: { type: 'shared' },
              allow: [{ to: { type: 'shared' } }],
            },
            {
              from: { type: 'entities' },
              allow: [{ to: { type: 'entities' } }, { to: { type: 'shared' } }],
            },
            {
              from: { type: 'features' },
              allow: [
                { to: { type: 'features' } },
                { to: { type: 'entities' } },
                { to: { type: 'shared' } },
              ],
            },
            {
              from: { type: 'widgets' },
              allow: [
                { to: { type: 'widgets' } },
                { to: { type: 'features' } },
                { to: { type: 'entities' } },
                { to: { type: 'shared' } },
              ],
            },
            {
              from: { type: 'routes' },
              allow: [
                { to: { type: 'routes' } },
                { to: { type: 'pages' } },
                { to: { type: 'widgets' } },
                { to: { type: 'features' } },
                { to: { type: 'entities' } },
                { to: { type: 'shared' } },
              ],
            },
            {
              from: { type: 'pages' },
              allow: [
                { to: { type: 'pages' } },
                { to: { type: 'widgets' } },
                { to: { type: 'features' } },
                { to: { type: 'entities' } },
                { to: { type: 'shared' } },
              ],
            },
            {
              from: { type: 'app' },
              allow: [
                { to: { type: 'app' } },
                { to: { type: 'routes' } },
                { to: { type: 'pages' } },
                { to: { type: 'widgets' } },
                { to: { type: 'features' } },
                { to: { type: 'entities' } },
                { to: { type: 'shared' } },
              ],
            },
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
);
