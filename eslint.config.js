import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import prettier from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(
	{
		ignores: ['coverage/**', 'dist/**', '.angular/**', 'node_modules/**', '*.d.ts'],
	},
	{
		files: ['**/*.ts'],
		plugins: {
			'simple-import-sort': simpleImportSort,
		},
		extends: [
			eslint.configs.recommended,
			...tseslint.configs.recommended,
			...tseslint.configs.strict,
			...angular.configs.tsRecommended,
		],
		processor: angular.processInlineTemplates,
		rules: {
			// Import sorting and grouping
			'simple-import-sort/imports': [
				'error',
				{
					groups: [
						['^@angular'], // 1. Angular packages
						['^@?\\w'], // 2. External dependencies (e.g., rxjs)
						['^@(core|pages|shared)/', '^@package$'], // 3. Local path aliases
						['^\\.'], // 4. Relative imports
					],
				},
			],
			'simple-import-sort/exports': 'error',
			'@typescript-eslint/no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['../*'],
							message:
								'Les imports relatifs vers un dossier parent sont interdits. Utilise un alias (@core, @pages, @shared).',
						},
					],
				},
			],

			// Angular - Component/Directive Selectors
			'@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
			'@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],

			// Angular - Max Inline Template Lines
			'@angular-eslint/component-max-inline-declarations': ['error', { template: 5 }],

			// TypeScript - Clean typing & Boundaries
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-inferrable-types': 'error',
			'@typescript-eslint/explicit-function-return-type': [
				'error',
				{
					allowExpressions: true,
					allowTypedFunctionExpressions: true,
				},
			],
			'@typescript-eslint/explicit-member-accessibility': [
				'error',
				{
					accessibility: 'explicit',
					overrides: { constructors: 'no-public' },
				},
			],

			// Function limits & Quality metrics
			'max-lines-per-function': [
				'error',
				{
					max: 25,
					skipBlankLines: true,
					skipComments: true,
					IIFEs: true,
				},
			],
			'@typescript-eslint/max-params': ['error', { max: 7 }],
			'max-depth': ['error', 2],
			complexity: ['error', { max: 6 }],
			'no-param-reassign': ['error', { props: true }],
			'@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],

			// Modern Angular, Signal Enforcements & AST Restrictions
			'no-restricted-syntax': [
				'warn',
				// Prohibit block bodies in arrow functions passed to the operators of a RxJS pipe
				{
					selector:
						'CallExpression[callee.name="pipe"] > CallExpression > ArrowFunctionExpression[body.type="BlockStatement"], CallExpression[callee.property.name="pipe"] > CallExpression > ArrowFunctionExpression[body.type="BlockStatement"], CallExpression[callee.name="pipe"] > ArrowFunctionExpression[body.type="BlockStatement"], CallExpression[callee.property.name="pipe"] > ArrowFunctionExpression[body.type="BlockStatement"]',
					message:
						'RxJS operators must not use block bodies ({ ... }). Extract the logic into a dedicated well-named method.',
				},
				// Prohibit block bodies in computed: write a simple expression or call a private method
				{
					selector: 'CallExpression[callee.name="computed"] > ArrowFunctionExpression[body.type="BlockStatement"]',
					message:
						'computed must not use a block body ({ ... }). Write a simple expression or call a private method that externalizes the computation.',
				},
				// Enforce Signal queries and inputs/outputs over decorators
				{
					selector: 'Decorator[expression.callee.name="Input"]',
					message: 'Modern Angular: Use input() or input.required() instead of @Input().',
				},
				{
					selector: 'Decorator[expression.callee.name="Output"]',
					message: 'Modern Angular: Use output() instead of @Output().',
				},
				{
					selector: 'Decorator[expression.callee.name="ViewChild"]',
					message: 'Modern Angular: Use viewChild() instead of @ViewChild().',
				},
				{
					selector: 'Decorator[expression.callee.name="ViewChildren"]',
					message: 'Modern Angular: Use viewChildren() instead of @ViewChildren().',
				},
				{
					selector: 'Decorator[expression.callee.name="ContentChild"]',
					message: 'Modern Angular: Use contentChild() instead of @ContentChild().',
				},
				{
					selector: 'Identifier[name="ChangeDetectorRef"]',
					message: 'Modern Angular: Avoid ChangeDetectorRef. Rely on Signals and default change detection.',
				},
				{
					selector: 'MethodDefinition[kind="constructor"] TSParameterProperty',
					message: 'Modern Angular: Use inject() instead of constructor parameter injection.',
				},
				// Warn against redundant default declarations
				{
					selector: 'Decorator[expression.callee.name="Component"] Property[key.name="standalone"][value.value=true]',
					message: 'Default value: "standalone: true" is the default in modern Angular; redundant declaration.',
				},
				{
					selector:
						'Decorator[expression.callee.name="Component"] Property[key.name="changeDetection"] MemberExpression[property.name="OnPush"]',
					message: 'Default value: "OnPush" is standard/default behavior; redundant declaration.',
				},
			],
		},
	},
	{
		// Les stores et features @ngrx/signals reposent sur des types inférés ; les annoter n'apporte rien.
		files: ['**/*.store.ts', 'src/app/shared/helpers/store/*.feature.ts'],
		rules: {
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/no-invalid-void-type': 'off',
		},
	},
	{
		files: ['**/*.spec.ts'],
		rules: {
			'max-lines-per-function': 'off',
			'@typescript-eslint/no-useless-constructor': 'off',
		},
	},
	{
		files: ['**/*.html'],
		extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
		rules: {
			'@angular-eslint/template/prefer-control-flow': 'error',
			'@angular-eslint/template/no-inline-styles': 'error',
		},
	},
	prettier,
);
