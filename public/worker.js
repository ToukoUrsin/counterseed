import {experiment} from './engine.js';
let cancel=false,busy=false;
self.onmessage=async({data})=>{
 if(data.type==='cancel'){cancel=true;return;}if(data.type!=='run'||busy)return;busy=true;cancel=false;
 try{const result=await experiment(data.config,{progress:result=>self.postMessage({type:'progress',result}),cancelled:()=>cancel,yieldControl:()=>new Promise(resolve=>setTimeout(resolve,0))});self.postMessage({type:'complete',result});}catch(error){self.postMessage({type:'error',message:error.message});}finally{busy=false;}
};
