import test from 'node:test'; import assert from 'node:assert/strict'; import {clamp} from './main.mjs'; test('clamp',()=>{assert.equal(clamp(-2),0);assert.equal(clamp(4),4);});
