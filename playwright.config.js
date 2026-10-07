// Browser tests for the front end (tests/e2e). No WordPress needed.
module.exports = {
	testDir: "tests/e2e",
	timeout: 30000,
	fullyParallel: true,
	reporter: "list",
	use: { browserName: "chromium", viewport: { width: 1440, height: 900 } },
	projects: [
		{ name: "desktop" },
		{ name: "mobile", use: { viewport: { width: 375, height: 800 } } },
	],
};
