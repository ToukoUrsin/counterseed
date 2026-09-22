import http from 'node:http';
import {readFileSync} from 'node:fs';
import {dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'public');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const allowed=new Set(['/','/index.html','/app.js','/engine.js','/worker.js','/style.css','/favicon.svg']);
const server=http.createServer((req,res)=>{const path=new URL(req.url,'http://localhost').pathname;if(req.method!=='GET'||!allowed.has(path)){res.writeHead(404);res.end('Not found');return;}try{const file=path==='/'?'index.html':path.slice(1);res.writeHead(200,{'Content-Type':types[extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"});res.end(readFileSync(join(root,file)));}catch{res.writeHead(500);res.end('Could not load file.');}});
server.listen(Number(process.env.PORT||4322),process.env.HOST||'127.0.0.1',()=>console.log(`Counterseed running at http://127.0.0.1:${process.env.PORT||4322}`));
