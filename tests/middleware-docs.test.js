const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const middlewareSource = fs.readFileSync(
    path.join(__dirname, '..', 'middleware.js'),
    'utf8'
);

test('middleware.js documents the three excluded /api/v1 prefixes', () => {
    // The middleware is loaded by Next.js from the project root and must export
    // `middleware` and `config` as a side-effecting module. We avoid importing
    // it here so this test stays a pure doc/source assertion.
    const required = [
        '/api/v1/creative-agent',
        '/api/v1/get_upload_url',
        '/api/v1/upload-binary',
    ];

    for (const prefix of required) {
        assert.ok(
            middlewareSource.includes(prefix),
            `middleware.js should reference the excluded prefix ${prefix} in its documentation`
        );
    }
});
