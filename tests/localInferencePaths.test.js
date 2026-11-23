import { test } from 'vitest';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
    LOCAL_AI_DIR_ENV,
    resolveLocalAiPaths,
} from '../electron/lib/localInferencePaths';

test('resolveLocalAiPaths defaults under the Electron user data directory', () => {
    const userDataPath = path.join(process.cwd(), 'fixtures', 'user-data');
    const paths = resolveLocalAiPaths({ userDataPath, env: {} });
    const dataDir = path.resolve(userDataPath, 'local-ai');

    assert.deepEqual(paths, {
        dataDir,
        binDir: path.join(dataDir, 'bin'),
        modelsDir: path.join(dataDir, 'models'),
        tmpDir: path.join(dataDir, 'tmp'),
    });
});

test('resolveLocalAiPaths honors a custom local AI directory', () => {
    const customDir = path.join(process.cwd(), 'fixtures', 'custom-ai-store');
    const paths = resolveLocalAiPaths({
        userDataPath: path.join(process.cwd(), 'fixtures', 'ignored-user-data'),
        env: { [LOCAL_AI_DIR_ENV]: customDir },
    });
    const dataDir = path.resolve(customDir);

    assert.equal(paths.dataDir, dataDir);
    assert.equal(paths.modelsDir, path.join(dataDir, 'models'));
});

test('resolveLocalAiPaths trims accidental whitespace around the override', () => {
    const customDir = path.join(process.cwd(), 'fixtures', 'spaced-ai-store');
    const paths = resolveLocalAiPaths({
        env: { [LOCAL_AI_DIR_ENV]: `  ${customDir}  ` },
    });

    assert.equal(paths.dataDir, path.resolve(customDir));
});

test('resolveLocalAiPaths requires userDataPath when no override is set', () => {
    assert.throws(
        () => resolveLocalAiPaths({ env: {} }),
        /userDataPath is required/
    );
});
