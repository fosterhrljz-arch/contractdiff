import test from 'node:test';
import assert from 'node:assert/strict';
import {anchorAt,zoomValue,sanitizeLayout,splitLimits} from '../src/workspaceLayout.js';

test('scroll interpolation keeps the preceding paragraph until the next begins',()=>{
 const a=[{id:'payment',top:100,bottom:180},{id:'liability',top:300,bottom:360}];
 assert.deepEqual(anchorAt(a,250),{blockId:'payment',ratio:.75});
 assert.deepEqual(anchorAt(a,300),{blockId:'liability',ratio:0});
});
test('page gaps interpolate continuously instead of clamping to paragraph height',()=>{
 const a=[{id:'end-of-page',top:20,bottom:40},{id:'next-page',top:1020,bottom:1100}];
 assert.equal(anchorAt(a,520).ratio,.5);
});
test('empty and pre-document scroll anchors stay finite',()=>{
 assert.equal(anchorAt([],20),null);
 assert.deepEqual(anchorAt([{id:'first',top:20,bottom:100}],0),{blockId:'first',ratio:-.25});
});
test('custom zoom accepts percentages and rejects empty or invalid edits',()=>{
 assert.equal(zoomValue('175%'),1.75);assert.equal(zoomValue('abc',1.25),1.25);
 assert.equal(zoomValue('',1.25),1.25);assert.equal(zoomValue('999'),3);assert.equal(zoomValue('10'),.5);
});
test('restored layout cannot create collapsed or excessively narrow panes',()=>{
 assert.deepEqual(sanitizeLayout({sidebar:800,split:.01,collapsed:'true'}),{sidebar:400,split:.25,collapsed:false});
 assert.deepEqual(splitLimits(400),[.5,.5]);assert.equal(splitLimits(600)[0],220/600);
});
