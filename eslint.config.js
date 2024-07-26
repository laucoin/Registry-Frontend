// @ts-check
const eslint = require('@eslint/js')
const tsEslint = require('typescript-eslint')
const angular = require('angular-eslint')

module.exports = tsEslint.config(
    {
        files: [ '**/*.ts' ],
        extends: [
            eslint.configs.recommended,
            ...tsEslint.configs.recommended,
            ...tsEslint.configs.stylistic,
            ...angular.configs.tsRecommended,
        ],
        processor: angular.processInlineTemplates,
        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/explicit-function-return-type': [
                'error',
            ],
            '@typescript-eslint/no-inferrable-types': 0,
            '@typescript-eslint/typedef': [
                'error',
                {
                    'arrayDestructuring': true,
                    'arrowParameter': true,
                    'memberVariableDeclaration': true,
                    'objectDestructuring': true,
                    'parameter': true,
                    'propertyDeclaration': true,
                    'variableDeclaration': true,
                    'variableDeclarationIgnoreFunction': true,
                },
            ],
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {
                    'accessibility': 'explicit',
                    'overrides': {
                        'accessors': 'explicit',
                        'methods': 'explicit',
                        'properties': 'explicit',
                        'parameterProperties': 'explicit',
                    },
                },
            ],
            '@angular-eslint/directive-selector': [
                'error',
                {
                    type: 'attribute',
                    prefix: 'app',
                    style: 'camelCase',
                },
            ],
            '@angular-eslint/component-selector': [
                'error',
                {
                    type: 'element',
                    prefix: 'app',
                    style: 'kebab-case',
                },
            ],
        },
    },
    {
        files: [ '**/*.html' ],
        extends: [
            ...angular.configs.templateRecommended,
            ...angular.configs.templateAccessibility,
        ],
        rules: {},
    },
)
