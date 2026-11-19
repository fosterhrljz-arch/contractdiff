import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {requireDependency} from '../scripts/dependencies.mjs';

const {unzipSync}=requireDependency('fflate');
const {chromium}=requireDependency('playwright');
const out=path.resolve('../contractdiff-v2.1-qa/unpacked');
const zip=await fs.readFile('../ContractDiff-v2.1-ready-to-use.zip');
const files=unzipSync(zip);
const manifest=JSON.parse(new TextDecoder().decode(files['ContractDiff/package-manifest.json']));
assert.equal(manifest.version,'2.1.0');
for(const [name,bytes] of Object.entries(files)){
 const target=path.resolve(out,name);
 assert(target.startsWith(out+path.sep),'Unsafe archive path');
 if(!name.endsWith('/')){await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes);}
}
for(const [name,hash] of Object.entries(manifest.files)){
 const bytes=await fs.readFile(path.join(out,'ContractDiff',name));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),hash,name);
}
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({offline:true,viewport:{width:1600,height:1000}});
const page=await context.newPage(),errors=[],network=[];
page.on('pageerror',e=>errors.push(e.message));
context.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
try{
 await page.goto(pathToFileURL(path.join(out,'ContractDiff/ContractDiff.html')).href);
 await page.getByRole('button',{name:'Load sample',exact:true}).click();
 await page.locator('.old .change-hit[data-text="30"]').waitFor();
 await page.locator('.new .change-hit[data-text="90"]').waitFor();
 assert.equal(await page.locator('.change-item').count(),2);
 assert.equal(await page.locator('.pdf-shell').count(),6);
 await page.locator('.change-item[data-kind="deleted"]').click();
 await page.locator('.new [data-gap=true]').waitFor();
 await page.getByRole('button',{name:'Open contracts',exact:true}).click();
 await page.getByLabel('Sample contract',{exact:true}).selectOption('en-docx');
 await page.getByRole('button',{name:'Load sample',exact:true}).click();
 await page.locator('.new .formatted-docx[data-docx-ready=true]').waitFor();
 assert.equal(await page.locator('.change-item').count(),2);
 assert.equal(await page.locator('.docx-body table').count(),2);
 await page.getByRole('button',{name:'Reading mode',exact:true}).click();assert.equal(await page.locator('.global-toolbar').isVisible(),false);await page.keyboard.press('Escape');await page.getByRole('separator',{name:'Resize documents'}).focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(500);assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 const result={passed:true,version:manifest.version,verifiedFiles:Object.keys(manifest.files).length,zipSha256:createHash('sha256').update(zip).digest('hex'),checks:['Extracted launcher starts directly offline','Both required changes navigate in complete PDFs','Bundled DOCX renderer displays full tables','Reading mode and keyboard divider resize work in extracted release'],errors,network};
 await fs.writeFile(path.resolve('../contractdiff-v2.1-qa/package-launch.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
