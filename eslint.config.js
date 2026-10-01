// @ts-check
const eslint = require('@eslint/js');
const tsEslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = tsEslint.config(
	{
		files: ['**/*.ts'],
		extends: [
			eslint.configs.recommended,
			...tsEslint.configs.recommended,
			...tsEslint.configs.stylistic,
			...angular.configs.tsRecommended,
			eslintConfigPrettier,
		],
		processor: angular.processInlineTemplates,
		rules: {
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/explicit-function-return-type': ['error'],
			'@typescript-eslint/no-inferrable-types': 0,
			'@typescript-eslint/typedef': [
				'error',
				{
					arrayDestructuring: true,
					arrowParameter: true,
					memberVariableDeclaration: true,
					objectDestructuring: true,
					parameter: true,
					propertyDeclaration: true,
					variableDeclaration: true,
					variableDeclarationIgnoreFunction: true,
				},
			],
			'@typescript-eslint/explicit-member-accessibility': [
				'error',
				{
					accessibility: 'explicit',
					overrides: {
						accessors: 'explicit',
						methods: 'explicit',
						properties: 'explicit',
						parameterProperties: 'explicit',
					},
				},
			],
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'memberLike',
					modifiers: ['private'],
					format: ['camelCase'],
					leadingUnderscore: 'require',
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
		files: ['**/*.store.ts'],
		rules: {
			'@typescript-eslint/typedef': [
				'error',
				{
					arrayDestructuring: true,
					arrowParameter: false,
					memberVariableDeclaration: true,
					objectDestructuring: true,
					parameter: true,
					propertyDeclaration: true,
					variableDeclaration: false,
					variableDeclarationIgnoreFunction: true,
				},
			],
		},
	},
	{
		files: ['**/*.component.ts', '**/*.page.ts', '**/*.guard.ts', '**/*.interceptor.ts'],
		ignores: ['**/*.spec.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['**/*.store', '**/*.api'],
							message:
								'Inject the facade (*.facade.ts) instead — components, pages, guards, and the interceptor must never import a store or api directly.',
						},
					],
				},
			],
		},
	},
	{
		files: ['src/app/core/**/*.ts', 'src/app/pages/**/*.ts', 'src/app/shared/**/*.ts'],
		ignores: ['src/app/core/config/app-version.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['./**', '../**'],
							message:
								'Use the @core/@pages/@shared path alias instead of a relative import — no relative imports are allowed for content inside core/, pages/, or shared/.',
						},
					],
				},
			],
		},
	},
	{
		files: ['**/*.html'],
		extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
		rules: {},
	},
);
