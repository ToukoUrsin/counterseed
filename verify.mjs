import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {compile,evaluate,updateHash,trace,CATALOG} from './public/engine.js';
import {oracle} from './oracle.mjs';

export function verify(certificate){
 if(certificate?.format!=='counterseed-experiment-v1'||certificate.engineVersion!=='1.0.0')throw new Error('Unknown evidence format or engine version.');
 if(certificate.enumeration!=='vertices ascending, then edges ascending, then bitmask ascending')throw new Error('Unsupported enumeration order.');
 if(certificate.hashAlgorithm!=='FNV-1a-32 over n, mask low byte, mask high byte, premise, conclusion; noncryptographic')throw new Error('Incorrect fingerprint algorithm declaration.');
 const nmax=certificate.universe?.maxVertices;
 if(!Number.isInteger(nmax)||nmax<1||nmax>6||certificate.universe.minVertices!==1||certificate.universe.simple!==true||certificate.universe.undirected!==true||certificate.universe.labeled!==true||certificate.universe.loops!==false)throw new Error('Unsupported or modified graph universe.');
 if(!['first','census'].includes(certificate.mode))throw new Error('Unsupported experiment mode.');
 if(certificate.status==='cancelled')throw new Error('Cancelled searches are not complete replay certificates.');
 const a=compile(certificate.conjecture.antecedent),b=compile(certificate.conjecture.consequent);
 let checked=0,eligible=0,violations=0,hash=2166136261,first=null,done=false,total=0;
 for(let n=1;n<=nmax;n++)total+=2**(n*(n-1)/2);
 const perOrder=[];
 for(let n=1;n<=nmax&&!done;n++){
  const maximum=2**(n*(n-1)/2),buckets=Array.from({length:n*(n-1)/2+1},()=>[]);
  for(let mask=0;mask<maximum;mask++)buckets[mask.toString(2).replaceAll('0','').length].push(mask);
  const row={n,checked:0,eligible:0,violations:0,total:maximum,complete:false};perOrder.push(row);
  for(const bucket of buckets){for(const mask of bucket){const get=oracle(n,mask),p=evaluate(a,get),q=evaluate(b,get);checked++;row.checked++;if(p){eligible++;row.eligible++;}hash=updateHash(hash,n,mask,p,q);if(p&&!q){violations++;row.violations++;first??={n,mask};if(certificate.mode==='first'){done=true;break;}}}if(done)break;}row.complete=row.checked===maximum;
 }
 for(const[key,value]of Object.entries({checked,eligible,violations,total}))if(certificate.counts[key]!==value)throw new Error(`${key} mismatch: declared ${certificate.counts[key]}, replayed ${value}.`);
 if(JSON.stringify(certificate.perOrder)!==JSON.stringify(perOrder))throw new Error('Per-order coverage does not match.');
 if(certificate.visitedHash!==hash.toString(16).padStart(8,'0'))throw new Error('Enumeration fingerprint mismatch.');
 if(certificate.complete!==(checked===total))throw new Error('Completion claim is incorrect.');
 const expected=first?'counterexample':'bounded';if(certificate.status!==expected)throw new Error('Incorrect result classification.');
 if(first){if(certificate.witness?.n!==first.n||certificate.witness?.mask!==first.mask)throw new Error('Witness is not the first minimal counterexample.');const get=oracle(first.n,first.mask);for(const[key,value]of Object.entries(certificate.witness.properties)){if((get(key)===Infinity?'infinity':get(key))!==value)throw new Error(`Witness property ${key} is incorrect.`);}let bit=0;const edges=[];for(let i=0;i<first.n;i++)for(let j=i+1;j<first.n;j++,bit++)if(first.mask&(1<<bit))edges.push([i,j]);if(JSON.stringify(edges)!==JSON.stringify(certificate.witness.edges))throw new Error('Witness edges do not match the encoded graph.');}
 else if(certificate.witness!==null)throw new Error('Unexpected witness.');
 const expectedClaim=first?'A finite counterexample disproves this universal implication. Minimal by vertex count, then edge count, within the declared universe.':eligible===0?'No graph in the declared finite universe satisfies the premise. The implication holds there vacuously; no evidence for a larger universe.':'No counterexample exists in the fully enumerated declared universe. This is bounded evidence, not a proof for all finite graphs.';
 if(certificate.claim!==expectedClaim)throw new Error('Result claim was modified.');
 if(first){
  const w=certificate.witness,get=oracle(first.n,first.mask),edgeSet=new Set(w.edges.map(e=>e.join('-'))),isEdge=(a,b)=>edgeSet.has([a,b].sort((x,y)=>x-y).join('-')),validVertex=v=>Number.isInteger(v)&&v>=0&&v<first.n;
  if(JSON.stringify(Object.keys(w.properties).sort())!==JSON.stringify(Object.keys(CATALOG).sort()))throw new Error('Incomplete witness property set.');
  if(JSON.stringify(w.antecedent)!==JSON.stringify(trace(a,get))||JSON.stringify(w.consequent)!==JSON.stringify(trace(b,get)))throw new Error('Expression trace does not match.');
  const d=w.details;if(!d)throw new Error('Missing structural details.');
  const degrees=Array(first.n).fill(0);for(const[a,b]of w.edges){degrees[a]++;degrees[b]++;}if(JSON.stringify(degrees)!==JSON.stringify(d.degrees))throw new Error('Degree sequence mismatch.');
  if(!d.coloring||d.coloring.number!==get('chromatic_number')||d.coloring.colors.length!==first.n||d.coloring.colors.some(c=>!Number.isInteger(c)||c<0||c>=d.coloring.number)||w.edges.some(([a,b])=>d.coloring.colors[a]===d.coloring.colors[b]))throw new Error('Invalid coloring certificate.');
  if(get('bipartite')){if(d.oddCycle!==null)throw new Error('Unexpected odd cycle.');}else if(!Array.isArray(d.oddCycle)||d.oddCycle.length<3||d.oddCycle.length%2!==1||new Set(d.oddCycle).size!==d.oddCycle.length||d.oddCycle.some(v=>!validVertex(v))||d.oddCycle.some((v,i)=>!isEdge(v,d.oddCycle[(i+1)%d.oddCycle.length])))throw new Error('Invalid odd cycle certificate.');
  const checkHamilton=(path,cycle)=>Array.isArray(path)&&path.length===first.n&&new Set(path).size===first.n&&path.every(validVertex)&&path.every((v,i)=>i===0||isEdge(path[i-1],v))&&(!cycle||first.n>=3&&isEdge(path.at(-1),path[0]));
  if(get('hamiltonian')?!checkHamilton(d.hamiltonianCycle,true):d.hamiltonianCycle!==null)throw new Error('Invalid Hamiltonian cycle certificate.');
  if(get('traceable')?!checkHamilton(d.hamiltonianPath,false):d.hamiltonianPath!==null)throw new Error('Invalid Hamiltonian path certificate.');
  if(get('eulerian')){const path=d.eulerWalk;if(!Array.isArray(path)||path.length!==w.edges.length+1||path[0]!==path.at(-1)||!path.every(validVertex)||path.some((v,i)=>i>0&&!isEdge(path[i-1],v))||new Set(path.slice(1).map((v,i)=>[path[i],v].sort((a,b)=>a-b).join('-'))).size!==w.edges.length)throw new Error('Invalid Euler walk certificate.');}else if(d.eulerWalk!==null)throw new Error('Unexpected Euler walk.');
  const groups=d.components;if(!Array.isArray(groups)||groups.length!==get('components')||groups.flat().length!==first.n||new Set(groups.flat()).size!==first.n||!groups.flat().every(validVertex)||w.edges.some(([a,b])=>!groups.some(g=>g.includes(a)&&g.includes(b))))throw new Error('Invalid component partition.');
  const bridges=[];let edgeBit=0;for(let i=0;i<first.n;i++)for(let j=i+1;j<first.n;j++,edgeBit++)if(first.mask&(1<<edgeBit))if(oracle(first.n,first.mask^(1<<edgeBit))('components')>get('components'))bridges.push([i,j]);if(JSON.stringify(bridges)!==JSON.stringify(d.bridges))throw new Error('Bridge certificate mismatch.');
  const cuts=[];for(let removed=0;removed<first.n;removed++){const keep=Array.from({length:first.n},(_,i)=>i).filter(i=>i!==removed);let mask=0,bit=0;for(let i=0;i<keep.length;i++)for(let j=i+1;j<keep.length;j++,bit++)if(isEdge(keep[i],keep[j]))mask|=1<<bit;if(oracle(first.n-1,mask)('components')>get('components'))cuts.push(removed);}if(JSON.stringify(cuts)!==JSON.stringify(d.cutVertices))throw new Error('Cut-vertex certificate mismatch.');
 }
 return {verified:true,checked,eligible,violations,smallestWitness:first,boundedOnly:!first,verifiedScope:'Universe, enumeration counts, smallest witness, properties, logic traces and structural certificates. Human explanation prose and timestamps are not attestations.',message:first?'Independent graph oracles reproduced the smallest counterexample.':'Independent graph oracles reproduced the complete finite census. This is not an unbounded theorem.'};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 if(!process.argv[2]){console.error('Usage: node verify.mjs path/to/counterseed-evidence.json');process.exitCode=1;}
 else try{const result=verify(JSON.parse(readFileSync(process.argv[2],'utf8')));console.log(JSON.stringify(result,null,2));}catch(error){console.error(`VERIFICATION FAILED: ${error.message}`);process.exitCode=1;}
}
