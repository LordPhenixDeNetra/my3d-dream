#!/usr/bin/env node
// Compatibility shim: the CLI is `my3d` now.
import { run } from '../src/cli.mjs';

process.stderr.write('warning: bin/3dviz.mjs is deprecated, use bin/my3d.mjs\n');
process.exitCode = await run(process.argv.slice(2));
