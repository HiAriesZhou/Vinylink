import { build } from 'esbuild';
import { mkdir, copyFile, rm } from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
await build({entryPoints:['src/content.ts','src/background.ts'],outdir:'dist',bundle:true,format:'iife',target:'chrome120',loader:{'.css':'text'},minify:true,legalComments:'none'});
await copyFile('manifest.json','dist/manifest.json');
await mkdir('artifacts',{recursive:true});await rm('artifacts/vinylink.zip',{force:true});

console.log('Built dist/');
