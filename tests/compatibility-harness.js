import {extractFile as previous} from './baseline/extract-v1.js';import {extractFile as current} from '../src/extract.js';import {compareDocuments} from '../src/core.js';
window.ContractDiffCompatibility={previous,current,compareDocuments};
