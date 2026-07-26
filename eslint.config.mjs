// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

/**
 * Stylistic rules mirror the IDE formatter (IntelliJ scheme) so a reformat in
 * the IDE and `eslint --fix` converge on the same output: tab indentation, no
 * spaces inside array brackets, else/catch on the closing-brace line. The IDE
 * derives its continuation indent per language — 1 tab in TypeScript files,
 * 2 tabs in .vue files (HTML-based settings) — hence the per-file overrides.
 */
export default withNuxt({
    rules: {
        /**
         * House rules carried over from the Angular app (see AGENTS.md).
         */
        '@typescript-eslint/no-explicit-any': 'error',
        'vue/multi-word-component-names': 'off',

        '@stylistic/array-bracket-spacing': ['error', 'never'],
        /**
         * Binary-operator and union-type continuations follow the IDE's
         * continuation indent, which this rule cannot express (it has no
         * per-construct options) — the formatter owns them.
         */
        '@stylistic/indent-binary-ops': 'off',
        /**
         * Smart tabs: tabs for indent, spaces for alignment (IDE comments).
         */
        '@stylistic/no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
        'vue/brace-style': ['error', '1tbs', {allowSingleLine: true}],
        /**
         * No space before a self-closing `/>` (IDE empty-tag style).
         */
        'vue/html-closing-bracket-spacing': ['error', {selfClosingTag: 'never'}],
        'vue/html-indent': ['error', 'tab', {
            /**
             * Wrapped attributes sit at the IDE's double continuation indent;
             * multi-line mustache expressions follow the same continuation
             * indent, which this rule cannot express — leave them to the
             * formatter.
             */
            attribute: 2,
            ignores: [
                'VExpressionContainer',
                /**
                 * The IDE keeps table sections flush with their children
                 * ("Do not indent children of: html, body, thead, tbody,
                 * tfoot" — its HTML default), which this rule cannot express.
                 */
                'VElement[rawName=thead] > *',
                'VElement[rawName=tbody] > *',
                'VElement[rawName=tfoot] > *',
            ],
        }],
    },
}, {
    /**
     * Script blocks in .vue files: the IDE indents wrapped arguments,
     * parameters and member chains at its 2-tab continuation indent.
     */
    files: ['**/*.vue'],
    rules: {
        '@stylistic/indent': ['error', 'tab', {
            ArrayExpression: 1,
            CallExpression: {arguments: 2},
            flatTernaryExpressions: false,
            FunctionDeclaration: {body: 1, parameters: 2, returnType: 1},
            FunctionExpression: {body: 1, parameters: 2, returnType: 1},
            ignoreComments: false,
            /**
             * Ternary branches and concise arrow bodies follow IntelliJ's
             * continuation indent, which @stylistic/indent cannot express.
             */
            ignoredNodes: [
                'TSUnionType',
                'TSIntersectionType',
                'ConditionalExpression',
                'ArrowFunctionExpression > :not(BlockStatement).body',
            ],
            ImportDeclaration: 1,
            MemberExpression: 2,
            ObjectExpression: 1,
            offsetTernaryExpressions: true,
            outerIIFEBody: 1,
            SwitchCase: 1,
            tabLength: 4,
            VariableDeclarator: 1,
        }],
    },
}, {
    /**
     * The IDE formats plain JavaScript with its default scheme: 4-space
     * indentation and no spaces inside object braces.
     */
    files: ['**/*.mjs'],
    rules: {
        '@stylistic/indent': ['error', 4],
        '@stylistic/object-curly-spacing': ['error', 'never'],
    },
})
