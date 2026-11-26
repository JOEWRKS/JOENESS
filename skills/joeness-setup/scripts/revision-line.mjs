#!/usr/bin/env node
// Prints the ROADMAP "Product revision / approval:" line from the JSON that JOEFLOW's approval_status.py
// printed (2.0.2). Text only: it reads stdin or one file and never edits ROADMAP; the agent pastes the line
// and still owns the edit. It copies the reported values and judges nothing about approval.
import {readFileSync,realpathSync} from 'node:fs';
import {resolve,basename} from 'node:path';
import {fileURLToPath} from 'node:url';

const USAGE='usage: node revision-line.mjs [--input <approval_status.json>] [--date YYYY-MM-DD]  (JSON on stdin when --input is absent)';
const int=x=>Number.isInteger(x);
const value=(x,key)=>{
  if(x===null||x===undefined)return 'none';
  if(int(x)||(typeof x==='string'&&/^[A-Za-z0-9_.-]+$/.test(x)))return String(x);
  throw Error(key+' must be an integer, a plain word or null');
};
// approval_status.py lists pending revisions as consecutive integers (last approved + 1 .. current).
const span=list=>{
  const ok=list.every((r,i)=>i===0||r===list[i-1]+1);
  return ok&&list.length>1?list[0]+'-'+list.at(-1):list.join('/');
};
export function localDate(d=new Date()){
  const p=n=>String(n).padStart(2,'0');
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
}
export function revisionLine(report,date){
  if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T00:00:00Z')))
    throw Error('date must be YYYY-MM-DD');
  if(report===null||typeof report!=='object'||Array.isArray(report))throw Error('input is not an approval_status.py JSON object');
  if(Object.hasOwn(report,'error'))throw Error('approval_status.py reported an error: '+String(report.error));
  for(const k of ['definition_revision','approval_status','approved_revision','definition_status','pending_revisions'])
    if(!Object.hasOwn(report,k))throw Error('missing field '+k+' (is this approval_status.py output?)');
  const pending=report.pending_revisions;
  if(!Array.isArray(pending)||!pending.every(int))throw Error('pending_revisions must be a list of integers');
  const source='(`approval_status.py`, '+(pending.length?'pending_revisions '+span(pending)+', ':'')+'read '+date+').';
  if(report.definition_revision===null)return 'Product revision / approval: none '+source;
  if(!int(report.definition_revision))throw Error('definition_revision must be an integer or null');
  return 'Product revision / approval: definition_revision '+report.definition_revision+
    ', approval_status '+value(report.approval_status,'approval_status')+
    ', approved_revision '+value(report.approved_revision,'approved_revision')+
    ', definition_status '+value(report.definition_status,'definition_status')+' '+source;
}

// Entry guard (same as the 2.0.1 review helpers): real-path compare so a junction or symlink install path
// runs main; a direct run under this file's name that still fails the comparison exits 2, never a silent 0.
function isEntry(url){const a=process.argv[1];if(!a)return false;const self=fileURLToPath(url),win=process.platform==='win32',key=p=>{let r=resolve(p);try{r=realpathSync.native(r);}catch{}return win?r.toLowerCase():r;},name=p=>win?basename(p).toLowerCase():basename(p);if(key(a)===key(self))return true;if(name(a)===name(self)){process.stderr.write('joeness: entry guard mismatch for '+basename(self)+'; refusing to exit 0 without running. Run the script by its real path.\n');process.exit(2);}return false;}
if(isEntry(import.meta.url)){
  try{
    const opts=Object.create(null),allowed=new Set(['--input','--date']);
    for(let i=2;i<process.argv.length;i+=2){const k=process.argv[i],v=process.argv[i+1];if(!allowed.has(k)||Object.hasOwn(opts,k)||!v||v.startsWith('--'))throw Error('Unknown/duplicate option or missing value');opts[k]=v;}
    const raw=readFileSync(opts['--input']??0,'utf8').replace(/^﻿/,'');
    let report;try{report=JSON.parse(raw);}catch{throw Error('input is not JSON');}
    process.stdout.write(revisionLine(report,opts['--date']??localDate())+'\n');
  }catch(e){process.stderr.write('joeness revision-line: '+e.message+'\n'+USAGE+'\n');process.exitCode=2;}
}
