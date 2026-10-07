// Browser tests render the saved markup of the working tree build.
const { execFileSync } = require( 'node:child_process' );
const path = require( 'node:path' );

module.exports = () => {
	execFileSync(
		'node',
		[ path.join( __dirname, '../js/make-fixtures.cjs' ), 'current' ],
		{
			stdio: 'inherit',
		}
	);
};
