import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
    { ignores: ['dist', 'node_modules', 'src/types/generated.ts', 'vite.config.js'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-hooks/set-state-in-effect': 'warn',
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            // Ban raw string URLs — enforce generated route helpers
            'no-restricted-syntax': ['error',
                {
                    selector: 'JSXAttribute[name.name="href"][value.type="Literal"]',
                    message: 'Use generated route helpers instead of string paths. Example: href={admin.challenges.index.url()}',
                },
                {
                    selector: 'JSXAttribute[name.name="href"][value.expression.type="TemplateLiteral"]',
                    message: 'Use generated route helpers instead of template literals. Example: href={admin.challenges.index.url()}',
                },
                {
                    selector: 'CallExpression[callee.object.name="router"][callee.property.name="visit"] > Literal:first-child',
                    message: 'Use generated route helpers instead of string paths in router.visit()',
                },
                {
                    selector: 'CallExpression[callee.object.name="router"][callee.property.name=/^(post|put|delete|patch|get)$/] > Literal:first-child',
                    message: 'Use generated route helpers instead of string paths in router methods',
                },
                {
                    selector: 'CallExpression[callee.name="fetch"] > Literal:first-child',
                    message: 'Use generated route helpers instead of string paths in fetch()',
                },
                {
                    selector: 'CallExpression[callee.object.name="axios"][callee.property.name=/^(get|post|put|delete|patch)$/] > Literal:first-child',
                    message: 'Use generated route helpers instead of string paths in axios calls',
                },
            ],
        },
    },
);
