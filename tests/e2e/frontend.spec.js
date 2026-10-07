/**
 * Front end behaviour in a real browser: saved markup (tests/fixtures) run
 * through the PHP render filter, with the built stylesheet and frontend.js.
 */
const { test, expect } = require( '@playwright/test' );
const { execFileSync } = require( 'node:child_process' );
const path = require( 'node:path' );

const ROOT = path.resolve( __dirname, '../..' );
const ORIGIN = 'https://ilcb.test';
const FIXTURES = 'current';

// Logos of different widths, so a wrong set width shows up as a gap.
function logoSvg( n ) {
	const w = 120 + ( ( n * 37 ) % 140 );
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${ w }" height="60"><rect width="${ w }" height="60" fill="hsl(${ n * 47 },70%,50%)"/></svg>`;
}

function blockHtml( fixture ) {
	return execFileSync(
		'php',
		[
			path.join( ROOT, 'tests/php/render-fixture.php' ),
			`${ FIXTURES }/${ fixture }.html`,
		],
		{ encoding: 'utf8' }
	);
}

/**
 * Open a page with one block.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          fixture Fixture name without extension.
 * @param {Object}                          [opts]  { dir: "ltr"|"rtl", css: true|false }
 */
async function openBlock( page, fixture, opts = {} ) {
	const dir = opts.dir || 'ltr';
	const css = opts.css !== false;
	await page.route( 'https://example.com/**', ( route ) => {
		const n = parseInt(
			route
				.request()
				.url()
				.match( /logo-(\d+)/ )[ 1 ],
			10
		);
		route.fulfill( { contentType: 'image/svg+xml', body: logoSvg( n ) } );
	} );
	await page.route( `${ ORIGIN }/**`, ( route ) => {
		const url = new URL( route.request().url() );
		if ( url.pathname === '/' ) {
			route.fulfill( {
				contentType: 'text/html',
				body: `<!doctype html><html dir="${ dir }" lang="en"><head><meta charset="utf-8">${
					css
						? '<link rel="stylesheet" href="/build/style-index.css">'
						: ''
				}</head><body style="margin:0;padding:40px 0">${ blockHtml(
					fixture
				) }<p style="height:1500px">after</p><script src="/build/frontend.js"></script></body></html>`,
			} );
			return;
		}
		route.fulfill( { path: path.join( ROOT, url.pathname ) } );
	} );
	await page.goto( `${ ORIGIN }/` );
}

/** Track coverage of its wrapper at several animation phases. */
async function gapsAtPhases( page, trackIndex = 0 ) {
	return page.evaluate( ( i ) => {
		const track = document.querySelectorAll( '.dbw-slider-track' )[ i ];
		const wrap = track.parentElement.getBoundingClientRect();
		const anim = track.getAnimations()[ 0 ];
		const duration = anim.effect.getComputedTiming().duration;
		return [ 0, 0.25, 0.5, 0.75, 0.999 ].map( ( phase ) => {
			anim.pause();
			anim.currentTime = duration * phase;
			const r = track.getBoundingClientRect();
			return Math.round(
				Math.max( 0, r.left - wrap.left ) +
					Math.max( 0, wrap.right - r.right )
			);
		} );
	}, trackIndex );
}

/** Keyframe shift vs. the measured width of one logo set. */
async function shiftVsSet( page, trackIndex = 0 ) {
	return page.evaluate( ( i ) => {
		const track = document.querySelectorAll( '.dbw-slider-track' )[ i ];
		const perSet = parseInt( track.dataset.logoCount, 10 );
		const items = track.querySelectorAll( '.dbw-slider-item' );
		let set = 0;
		for ( let k = 0; k < perSet; k++ ) {
			set += items[ k ].getBoundingClientRect().width;
		}
		const frames = track.getAnimations()[ 0 ].effect.getKeyframes();
		const end = new DOMMatrix( frames[ frames.length - 1 ].transform ).m41;
		return { set: Math.round( set ), shift: Math.round( -end ) };
	}, trackIndex );
}

async function waitReady( page ) {
	await page.locator( '.dbw-partner-slider.dbw-ready' ).first().waitFor();
	await page.waitForFunction( () =>
		[ ...document.querySelectorAll( '.dbw-slider-track' ) ].every( ( t ) =>
			( t.style.animation || '' ).includes( 'dbw-scroll-' )
		)
	);
}

for ( const dir of [ 'ltr', 'rtl' ] ) {
	for ( const fixture of [
		'carousel-default',
		'carousel-capsules_odd',
		'carousel-custom_sizes',
		'carousel-rows_varied',
		'marquee-pause_reverse',
	] ) {
		test( `seamless loop: ${ fixture } (${ dir })`, async ( { page } ) => {
			await openBlock( page, fixture, { dir } );
			await waitReady( page );
			const tracks = await page.locator( '.dbw-slider-track' ).count();
			for ( let i = 0; i < tracks; i++ ) {
				expect( await gapsAtPhases( page, i ) ).toEqual( [
					0, 0, 0, 0, 0,
				] );
				const { set, shift } = await shiftVsSet( page, i );
				expect( Math.abs( set - shift ) ).toBeLessThanOrEqual( 1 );
			}
		} );
	}
}

test( 'CSS fallback (before the script) shifts by exactly one set', async ( {
	page,
} ) => {
	await page.route( '**/build/frontend.js', ( route ) =>
		route.fulfill( { body: '' } )
	);
	await openBlock( page, 'carousel-default' );
	const { shift, set } = await page.evaluate( () => {
		const track = document.querySelector( '.dbw-slider-track' );
		const perSet = parseInt( track.dataset.logoCount, 10 );
		const items = track.querySelectorAll( '.dbw-slider-item' );
		let s = 0;
		for ( let k = 0; k < perSet; k++ ) {
			s += items[ k ].getBoundingClientRect().width;
		}
		const anim = track.getAnimations()[ 0 ];
		anim.pause();
		anim.currentTime = anim.effect.getComputedTiming().duration * 0.999999;
		return {
			shift: -new DOMMatrix( getComputedStyle( track ).transform ).m41,
			set: s,
		};
	} );
	expect( Math.abs( shift - set ) ).toBeLessThanOrEqual( 2 );
} );

test( 'without the stylesheet the critical CSS keeps the layout in shape', async ( {
	page,
} ) => {
	await openBlock( page, 'carousel-default', { css: false } );
	const box = await page.locator( '.dbw-partner-slider' ).boundingBox();
	expect( box.height ).toBeLessThan( 200 );
	const display = await page
		.locator( '.dbw-slider-track' )
		.evaluate( ( t ) => getComputedStyle( t ).display );
	expect( display ).toBe( 'flex' );
} );

test( 'keyboard focus pauses, leaving resumes', async ( { page } ) => {
	await openBlock( page, 'carousel-alts_and_links' );
	await waitReady( page );
	const state = () =>
		page
			.locator( '.dbw-slider-track' )
			.evaluate( ( t ) => t.style.animationPlayState || 'running' );
	await page.locator( '.dbw-slider-item a[href]' ).first().focus();
	expect( await state() ).toBe( 'paused' );
	await page
		.locator( 'p' )
		.focus()
		.catch( () => {} );
	await page.evaluate( () => document.activeElement.blur() );
	expect( await state() ).toBe( 'running' );
} );

test( 'pause button: named, toggles aria-pressed, survives hover', async ( {
	page,
} ) => {
	await openBlock( page, 'carousel-pause_button' );
	await waitReady( page );
	const btn = page.locator( '.dbw-pause-btn' );
	await expect( btn ).toHaveAttribute( 'aria-label', 'Pause animation' );
	await btn.click();
	await expect( btn ).toHaveAttribute( 'aria-pressed', 'true' );
	await page.mouse.move( 0, 0 ); // leave the slider: must stay paused
	const state = await page
		.locator( '.dbw-slider-track' )
		.evaluate( ( t ) => t.style.animationPlayState );
	expect( state ).toBe( 'paused' );
	await btn.click();
	await expect( btn ).toHaveAttribute( 'aria-pressed', 'false' );
} );

test( 'off screen the animation pauses', async ( { page } ) => {
	await openBlock( page, 'carousel-default' );
	await waitReady( page );
	await page.evaluate( () => window.scrollTo( 0, 5000 ) );
	await page.waitForFunction(
		() =>
			document.querySelector( '.dbw-slider-track' ).style
				.animationPlayState === 'paused'
	);
	await page.evaluate( () => window.scrollTo( 0, 0 ) );
	await page.waitForFunction(
		() =>
			document.querySelector( '.dbw-slider-track' ).style
				.animationPlayState === 'running'
	);
} );

test( 'spotlight: only the visible logo is focusable', async ( { page } ) => {
	await openBlock( page, 'carousel-spotlight' );
	await page.locator( '.dbw-partner-slider.dbw-ready' ).waitFor();
	const inert = await page
		.locator( '.dbw-spotlight-stage > .dbw-slider-item' )
		.evaluateAll( ( items ) =>
			items.map( ( i ) => i.hasAttribute( 'inert' ) )
		);
	expect( inert.filter( ( x ) => ! x ) ).toHaveLength( 1 );
} );

test( 'spotlight keeps the page direction on RTL', async ( { page } ) => {
	await openBlock( page, 'carousel-spotlight', { dir: 'rtl' } );
	await page.locator( '.dbw-partner-slider.dbw-ready' ).waitFor();
	const dirOf = await page
		.locator( '.dbw-slider-wrapper' )
		.evaluate( ( w ) => getComputedStyle( w ).direction );
	expect( dirOf ).toBe( 'rtl' );
} );

test( 'reduced motion: static, every logo once', async ( { page } ) => {
	await page.emulateMedia( { reducedMotion: 'reduce' } );
	await openBlock( page, 'carousel-default' );
	await page.locator( '.dbw-partner-slider.dbw-ready' ).waitFor();
	const visible = await page.locator( '.dbw-slider-item:visible' ).count();
	expect( visible ).toBe( 5 );
	const anim = await page
		.locator( '.dbw-slider-track' )
		.evaluate( ( t ) => getComputedStyle( t ).animationName );
	expect( anim ).toBe( 'none' );
} );

test( 'static grid: every logo once, no motion', async ( { page } ) => {
	await openBlock( page, 'carousel-grid' );
	await page.locator( '.dbw-partner-slider.dbw-ready' ).waitFor();
	expect( await page.locator( '.dbw-slider-item' ).count() ).toBe( 3 );
	const anim = await page
		.locator( '.dbw-slider-track' )
		.evaluate( ( t ) => getComputedStyle( t ).animationName );
	expect( anim ).toBe( 'none' );
} );

test( 'transparent edge fade masks the logos instead of a colour overlay', async ( {
	page,
} ) => {
	await openBlock( page, 'carousel-fade_reverse_newtab' );
	await waitReady( page );
	const { mask, before } = await page
		.locator( '.dbw-partner-slider' )
		.evaluate( ( s ) => ( {
			mask: getComputedStyle( s.querySelector( '.dbw-slider-wrapper' ) )
				.maskImage,
			before: getComputedStyle( s, '::before' ).display,
		} ) );
	expect( mask ).toContain( 'linear-gradient' );
	expect( before ).toBe( 'none' );
} );

test( 'reverse direction flips the first row', async ( { page } ) => {
	await openBlock( page, 'carousel-fade_reverse_newtab' );
	await waitReady( page );
	const dir = await page
		.locator( '.dbw-slider-track' )
		.evaluate(
			( t ) => t.getAnimations()[ 0 ].effect.getComputedTiming().direction
		);
	expect( dir ).toBe( 'reverse' );
	expect( await gapsAtPhases( page ) ).toEqual( [ 0, 0, 0, 0, 0 ] );
} );
