/**
 * ESLint: the @wordpress/scripts defaults plus this project's specifics.
 */
const defaults = require( '@wordpress/scripts/config/eslint.config.cjs' );

module.exports = [
	...defaults,
	{
		ignores: [
			'infinite-logo-carousel-block/**',
			'tests/php/.wp/**',
			'test-results/**',
		],
	},
	{
		settings: {
			// Provided by WordPress at runtime (script dependencies), not npm.
			'import/core-modules': [
				'@wordpress/block-editor',
				'@wordpress/components',
				'@wordpress/data',
			],
		},
		rules: {
			// Short helpers document their intent in prose; a @param per
			// argument adds noise without information.
			'jsdoc/require-param': 'off',
		},
	},
	{
		// The front-end engine runs in the browser.
		files: [ 'src/frontend.js', 'tests/e2e/**' ],
		languageOptions: { globals: require( 'globals' ).browser },
	},
	{
		// Tooling and tests run in Node and may use dev dependencies.
		files: [ 'tests/**', 'bin/**', '*.config.js', 'eslint.config.cjs' ],
		rules: {
			'import/no-extraneous-dependencies': 'off',
			'@wordpress/no-global-active-element': 'off',
			'no-console': 'off',
		},
	},
];
