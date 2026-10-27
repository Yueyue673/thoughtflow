import http from 'node:http';
import { Readable } from 'node:stream';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi } from './api.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const files={'/':['index.html','text/html; charset=utf-8'],'/index.html':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8']};
const port=Number(process.env.PORT||3000);
const server=http.createServer(async(req,res)=>{
  try {
    const host=req.headers.host||`127.0.0.1:${port}`;
    if(host!==`127.0.0.1:${port}`&&host!==`localhost:${port}`){res.writeHead(403);res.end();return}
    const url=new URL(req.url,`http://${host}`);
    if(url.pathname.startsWith('/api/')){
      const headers=new Headers();for(const [k,v] of Object.entries(req.headers)){if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(', '):v)}
      const request=new Request(url,{method:req.method,headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Readable.toWeb(req),duplex:'half'})});
      const response=await handleApi(request,process.env);
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
    }
    const file=files[url.pathname];if(!file){res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});res.end('Not found');return}
    const data=await readFile(path.join(root,file[0]));res.writeHead(200,{'content-type':file[1],'cache-control':'no-store','x-content-type-options':'nosniff'});res.end(data);
  } catch (_) {res.writeHead(500,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'服务暂时不可用。'}));}
});
server.listen(port,'127.0.0.1',()=>console.log(`清单法: http://127.0.0.1:${port}`));
