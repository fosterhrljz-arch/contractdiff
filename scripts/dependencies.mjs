import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';
// Maintainer convenience in the shared workspace; distributed builds use npm install.
export const moduleDir=fs.existsSync('node_modules/esbuild')?path.resolve('node_modules'):path.resolve('../invoiceguard/node_modules');
export const requireDependency=createRequire(path.join(moduleDir,'contractdiff-loader.cjs'));
