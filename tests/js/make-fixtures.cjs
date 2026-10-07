/**
 * Writes the saved markup of every test case to tests/fixtures/, rendered by
 * a released build. These files are "content already in the database": the
 * deprecation tests parse them with the current build, the PHP tests run the
 * render filter over them.
 *
 * Usage: node tests/js/make-fixtures.cjs v2.3.0
 */
const fs = require("node:fs");
const path = require("node:path");
const h = require("./harness.cjs");
const cases = require("./cases.cjs");

const rev = process.argv[2];
if (!rev) {
	console.error("Usage: node tests/js/make-fixtures.cjs <git tag>");
	process.exit(1);
}

const dir = path.join(h.ROOT, "tests/fixtures", rev);
fs.mkdirSync(dir, { recursive: true });

const semver = (v) => v.replace(/^v/, "").split(".").map(Number);
const older = (a, b) => {
	const [x, y] = [semver(a), semver(b)];
	return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

const types = h.loadBuild(rev);
const { since, ...kinds } = cases;
for (const [kind, list] of Object.entries(kinds)) {
	const name = `infinite-logo-carousel-block/${kind}`;
	if (!types[name]) {
		continue;
	}
	h.useBlockType(name, types[name]);
	for (const [key, attributes] of Object.entries(list)) {
		const first = since[`${kind}/${key}`];
		if (first && older(rev, first) < 0) {
			continue;
		}
		fs.writeFileSync(
			path.join(dir, `${kind}-${key}.html`),
			h.serializeBlock(name, attributes) + "\n"
		);
	}
}
console.log(`Fixtures written to ${path.relative(h.ROOT, dir)}`);
