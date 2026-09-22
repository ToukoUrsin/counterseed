export const VERSION='1.0.0';
export const CATALOG={
 connected:{type:'boolean',label:'Connected',description:'Every pair of vertices has a path between them.'},
 bipartite:{type:'boolean',label:'Bipartite',description:'The vertices can be colored with two colors with no monochromatic edge.'},
 triangle_free:{type:'boolean',label:'Triangle-free',description:'No three vertices are pairwise adjacent.'},
 acyclic:{type:'boolean',label:'Acyclic',description:'No cycles; the graph is a forest.'},
 tree:{type:'boolean',label:'Tree',description:'Connected and acyclic. A one-vertex graph is a tree.'},
 regular:{type:'boolean',label:'Regular',description:'All vertices have the same degree.'},
 complete:{type:'boolean',label:'Complete',description:'Every pair of distinct vertices is adjacent.'},
 even_degrees:{type:'boolean',label:'All degrees even',description:'Every vertex has even degree, including zero.'},
 no_isolates:{type:'boolean',label:'No isolated vertices',description:'Every vertex has at least one neighbor.'},
 eulerian:{type:'boolean',label:'Eulerian',description:'Connected, with a closed walk using every edge exactly once. K1 is included.'},
 hamiltonian:{type:'boolean',label:'Hamiltonian cycle',description:'A cycle visits every vertex exactly once. Requires at least three vertices.'},
 traceable:{type:'boolean',label:'Hamiltonian path',description:'A path visits every vertex exactly once.'},
 bridgeless:{type:'boolean',label:'No bridges',description:'Deleting any edge does not increase the number of components.'},
 no_cut_vertices:{type:'boolean',label:'No cut vertices',description:'Deleting any vertex does not increase the number of components.'},
 vertices:{type:'number',label:'Vertex count',description:'The number of vertices (1–6).'},
 edges:{type:'number',label:'Edge count',description:'The number of unordered edges.'},
 components:{type:'number',label:'Components',description:'The number of connected components.'},
 min_degree:{type:'number',label:'Minimum degree',description:'The smallest vertex degree.'},
 max_degree:{type:'number',label:'Maximum degree',description:'The largest vertex degree.'},
 chromatic_number:{type:'number',label:'Chromatic number',description:'The minimum number of vertex colors needed; computed exactly.'},
 clique_number:{type:'number',label:'Clique number',description:'The size of a largest complete vertex subset.'},
 independence_number:{type:'number',label:'Independence number',description:'The size of a largest edge-free vertex subset.'},
 girth:{type:'number',label:'Girth',description:'The length of a shortest cycle; infinity for forests.'},
 diameter:{type:'number',label:'Diameter',description:'The largest shortest-path distance; infinity if disconnected.'}
};

export const PRESETS=[
 {id:'odd-cycle',title:'The triangle trap',subtitle:'No triangles. So, only two colors?',antecedent:'triangle_free',consequent:'bipartite',max:6},
 {id:'euler',title:'A walk that uses every edge',subtitle:'A classical implication, checked finitely.',antecedent:'connected && even_degrees',consequent:'eulerian',max:6},
 {id:'islands',title:'Nobody is alone',subtitle:'Does having a neighbor connect everyone?',antecedent:'no_isolates',consequent:'connected',max:6},
 {id:'hamilton',title:'Visit every vertex once',subtitle:'How much does connectivity promise?',antecedent:'connected',consequent:'traceable',max:6},
 {id:'bridge',title:'Two neighbors are enough?',subtitle:'Can minimum degree prevent a fragile link?',antecedent:'connected && min_degree >= 2',consequent:'bridgeless',max:6},
 {id:'color',title:'A small clique, few colors',subtitle:'Compare local density with global coloring.',antecedent:'clique_number <= 2',consequent:'chromatic_number <= 2',max:6},
 {id:'custom',title:'Write your own conjecture',subtitle:'Combine any of the 24 exact graph properties.',antecedent:'connected && regular',consequent:'hamiltonian',max:6}
];

export function tokenize(source){
 if(typeof source!=='string'||source.length>1000)throw new Error('Keep each expression under 1,000 characters.');
 const result=[];let at=0;
 while(at<source.length){if(/\s/.test(source[at])){at++;continue;}const match=/^(>=|<=|==|!=|&&|\|\||[()!<>]|[a-zA-Z_][a-zA-Z_0-9]*|\d+(?:\.\d+)?)/.exec(source.slice(at));if(!match)throw new Error(`Unexpected character at position ${at+1}. Use properties and logical operators only.`);result.push({value:match[0].toLowerCase(),at});at+=match[0].length;if(result.length>120)throw new Error('Use at most 120 tokens per expression.');}
 return result;
}
export function compile(source){
 const tokens=tokenize(source);let pos=0,depth=0;
 const peek=()=>tokens[pos]?.value;
 function primary(){if(depth++>20)throw new Error('Expression nesting is too deep.');let node;const token=tokens[pos++];if(!token)throw new Error('The expression is incomplete.');const t=token.value;
  if(t==='('){node=or();if(peek()!==')')throw new Error('Close the opening parenthesis.');pos++;}
  else if(t==='!'||t==='not'){const arg=primary();if(arg.type!=='boolean')throw new Error('NOT needs a Boolean property or comparison.');node={op:'not',arg,type:'boolean'};}
  else if(t==='true'||t==='false')node={op:'literal',value:t==='true',type:'boolean'};
  else if(t==='infinity')node={op:'literal',value:'infinity',type:'number'};
  else if(/^\d/.test(t))node={op:'literal',value:Number(t),type:'number'};
  else if(CATALOG[t])node={op:'property',name:t,type:CATALOG[t].type};
  else throw new Error(`Unknown property “${t}”. Choose one from the property library.`);
  depth--;return node;
 }
 function compare(){let left=primary();if(['>=','<=','>','<','==','!='].includes(peek())){const op=tokens[pos++].value,right=primary();if(left.type!==right.type)throw new Error('Compare values of the same type.');if(!['==','!='].includes(op)&&left.type!=='number')throw new Error('Ordering comparisons require numbers.');left={op,left,right,type:'boolean'};}return left;}
 function and(){let left=compare();while(['&&','and'].includes(peek())){pos++;const right=compare();if(left.type!=='boolean'||right.type!=='boolean')throw new Error('AND needs Boolean properties or comparisons.');left={op:'and',left,right,type:'boolean'};}return left;}
 function or(){let left=and();while(['||','or'].includes(peek())){pos++;const right=and();if(left.type!=='boolean'||right.type!=='boolean')throw new Error('OR needs Boolean properties or comparisons.');left={op:'or',left,right,type:'boolean'};}return left;}
 const ast=or();if(pos!==tokens.length)throw new Error(`Unexpected “${peek()}”. Add AND, OR, or a comparison.`);if(ast.type!=='boolean')throw new Error('A numeric property needs a comparison, such as edges >= 3.');return ast;
}
export function evaluate(ast,get){switch(ast.op){case'literal':return ast.value==='infinity'?Infinity:ast.value;case'property':return get(ast.name);case'not':return !evaluate(ast.arg,get);case'and':return evaluate(ast.left,get)&&evaluate(ast.right,get);case'or':return evaluate(ast.left,get)||evaluate(ast.right,get);default:{const a=evaluate(ast.left,get),b=evaluate(ast.right,get);return ast.op==='>='?a>=b:ast.op==='<='?a<=b:ast.op==='>'?a>b:ast.op==='<'?a<b:ast.op==='=='?a===b:a!==b;}}}
export function trace(ast,get){const value=evaluate(ast,get);return {op:ast.op,value:value===Infinity?'infinity':value,...(ast.name?{name:ast.name,label:CATALOG[ast.name].label}:{}),...(ast.left?{left:trace(ast.left,get),right:trace(ast.right,get)}:{}),...(ast.arg?{arg:trace(ast.arg,get)}:{})};}
export function popcount(x){let n=0;for(;x;x&=x-1)n++;return n;}
export function pairs(n){const result=[];for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)result.push([a,b]);return result;}
export function fromMask(n,mask){if(!Number.isInteger(n)||n<1||n>6||!Number.isInteger(mask)||mask<0||mask>=2**(n*(n-1)/2))throw new Error('Invalid simple graph encoding.');return pairs(n).filter((_,i)=>mask&(1<<i));}
export function toMask(n,edges){let mask=0;const all=pairs(n);for(const [a,b] of edges){const i=all.findIndex(([x,y])=>x===Math.min(a,b)&&y===Math.max(a,b));if(i<0)throw new Error('Invalid edge.');mask|=1<<i;}return mask;}
export function totalGraphs(max){let count=0;for(let n=1;n<=max;n++)count+=2**(n*(n-1)/2);return count;}
export function masksBySize(n){return Array.from({length:2**(n*(n-1)/2)},(_,i)=>i).sort((a,b)=>popcount(a)-popcount(b)||a-b);}

export class Graph {
 constructor(n,mask){this.n=n;this.mask=mask;this.edges=fromMask(n,mask);this.adj=Array.from({length:n},()=>[]);this.bits=Array(n).fill(0);for(const [a,b]of this.edges){this.adj[a].push(b);this.adj[b].push(a);this.bits[a]|=1<<b;this.bits[b]|=1<<a;}this.degrees=this.adj.map(a=>a.length);this.cache=new Map();}
 get(name){if(this.cache.has(name))return this.cache.get(name);const value=this.compute(name);this.cache.set(name,value);return value;}
 components(skipVertex=-1,skipEdge=null){const seen=new Set(),groups=[];for(let start=0;start<this.n;start++){if(start===skipVertex||seen.has(start))continue;const group=[],stack=[start];seen.add(start);while(stack.length){const v=stack.pop();group.push(v);for(const w of this.adj[v]){if(w===skipVertex||seen.has(w)||skipEdge&&(v===skipEdge[0]&&w===skipEdge[1]||v===skipEdge[1]&&w===skipEdge[0]))continue;seen.add(w);stack.push(w);}}groups.push(group);}return groups;}
 coloring(){if(this._coloring)return this._coloring;const colors=Array(this.n).fill(-1),parent=Array(this.n).fill(-1);let oddCycle=null;for(let s=0;s<this.n&&!oddCycle;s++){if(colors[s]>=0)continue;colors[s]=0;const queue=[s];for(let head=0;head<queue.length&&!oddCycle;head++){const v=queue[head];for(const w of this.adj[v]){if(colors[w]<0){colors[w]=1-colors[v];parent[w]=v;queue.push(w);}else if(colors[w]===colors[v]){const a=[],b=[];for(let x=v;x!==-1;x=parent[x])a.push(x);for(let x=w;x!==-1;x=parent[x])b.push(x);const common=a.find(x=>b.includes(x));oddCycle=[...a.slice(0,a.indexOf(common)+1),...b.slice(0,b.indexOf(common)).reverse()];break;}}}}return this._coloring={bipartite:!oddCycle,colors,oddCycle};}
 chromatic(){if(this._chromatic)return this._chromatic;const order=Array.from({length:this.n},(_,i)=>i).sort((a,b)=>this.degrees[b]-this.degrees[a]||a-b);for(let k=1;k<=this.n;k++){const colors=Array(this.n).fill(-1);const visit=i=>{if(i===this.n)return true;const v=order[i];for(let c=0;c<k;c++){if(this.adj[v].some(w=>colors[w]===c))continue;colors[v]=c;if(visit(i+1))return true;colors[v]=-1;}return false;};if(visit(0))return this._chromatic={number:k,colors};}}
 hamilton(cycle=false){if(cycle&&this.n<3)return null;const search=(path,used)=>{if(path.length===this.n)return !cycle||this.adj[path.at(-1)].includes(path[0])?path:null;for(const v of this.adj[path.at(-1)])if(!(used&(1<<v))){const result=search([...path,v],used|(1<<v));if(result)return result;}return null;};for(let start=0;start<(cycle?1:this.n);start++){const r=search([start],1<<start);if(r)return r;}return null;}
 euler(){if(this.get('components')!==1)return null;const adj=this.adj.map(a=>[...a]),stack=[0],path=[];while(stack.length){const v=stack.at(-1);if(adj[v].length){const w=adj[v].shift();adj[w].splice(adj[w].indexOf(v),1);stack.push(w);}else path.push(stack.pop());}path.reverse();if(path.length!==this.edges.length+1||path[0]!==path.at(-1))return null;const used=new Set();for(let i=1;i<path.length;i++){const key=[path[i-1],path[i]].sort((a,b)=>a-b).join('-');if(used.has(key)||!this.adj[path[i-1]].includes(path[i]))return null;used.add(key);}return path;}
 shortest(){if(this._dist)return this._dist;const dist=Array.from({length:this.n},(_,i)=>Array.from({length:this.n},(_,j)=>i===j?0:Infinity));for(const[a,b]of this.edges)dist[a][b]=dist[b][a]=1;for(let k=0;k<this.n;k++)for(let i=0;i<this.n;i++)for(let j=0;j<this.n;j++)dist[i][j]=Math.min(dist[i][j],dist[i][k]+dist[k][j]);return this._dist=dist;}
 compute(name){switch(name){
  case'vertices':return this.n;case'edges':return this.edges.length;case'components':return this.components().length;case'connected':return this.get('components')===1;case'min_degree':return Math.min(...this.degrees);case'max_degree':return Math.max(...this.degrees);case'even_degrees':return this.degrees.every(d=>d%2===0);case'no_isolates':return this.get('min_degree')>0;case'regular':return this.get('min_degree')===this.get('max_degree');case'complete':return this.edges.length===this.n*(this.n-1)/2;
  case'triangle_free':for(let a=0;a<this.n;a++)for(const b of this.adj[a])if(b>a&&(this.bits[a]&this.bits[b]))return false;return true;
  case'acyclic':return this.edges.length===this.n-this.get('components');case'tree':return this.get('connected')&&this.get('acyclic');case'bipartite':return this.coloring().bipartite;case'chromatic_number':return this.chromatic().number;case'hamiltonian':return !!this.hamilton(true);case'traceable':return !!this.hamilton(false);case'eulerian':return !!this.euler();
  case'bridgeless':return this.edges.every(edge=>this.components(-1,edge).length===this.get('components'));
  case'no_cut_vertices':return Array.from({length:this.n},(_,v)=>v).every(v=>this.components(v).length<=this.get('components'));
  case'clique_number':case'independence_number':{let best=1;for(let s=1;s<(1<<this.n);s++){const size=popcount(s);if(size<=best)continue;let ok=true;for(let v=0;v<this.n&&ok;v++)if(s&(1<<v)){const neighbors=popcount(this.bits[v]&s);if(neighbors!==(name==='clique_number'?size-1:0))ok=false;}if(ok)best=size;}return best;}
  case'diameter':return Math.max(...this.shortest().flat());
  case'girth':{let best=Infinity;for(const[a,b]of this.edges){const dist=Array(this.n).fill(Infinity),queue=[a];dist[a]=0;for(let i=0;i<queue.length;i++)for(const w of this.adj[queue[i]]){const v=queue[i];if(v===a&&w===b||v===b&&w===a||dist[w]!==Infinity)continue;dist[w]=dist[v]+1;queue.push(w);}best=Math.min(best,dist[b]+1);}return best;}
  default:throw new Error(`Unknown property: ${name}`);
 }}
 all(){return Object.fromEntries(Object.keys(CATALOG).map(key=>{const v=this.get(key);return [key,v===Infinity?'infinity':v];}));}
 details(){return {components:this.components(),degrees:this.degrees,oddCycle:this.coloring().oddCycle,coloring:this.chromatic(),bridges:this.edges.filter(e=>this.components(-1,e).length>this.get('components')),cutVertices:Array.from({length:this.n},(_,i)=>i).filter(v=>this.components(v).length>this.get('components')),eulerWalk:this.euler(),hamiltonianCycle:this.hamilton(true),hamiltonianPath:this.hamilton(false)};}
}
export function explanation(graph,antecedent,consequent){const details=graph.details(),reason=[];if(!graph.get('bipartite')&&(consequent.includes('bipartite')||consequent.includes('chromatic_number'))){reason.push({kind:'odd-cycle',title:`An odd cycle of length ${details.oddCycle.length}`,body:'Alternate two colors around the highlighted cycle. The last edge joins vertices of the same color. No two-coloring can work.',vertices:details.oddCycle});}if(!graph.get('connected')&&consequent.includes('connected'))reason.push({kind:'components',title:`${details.components.length} separate components`,body:'Each vertex can have a neighbor while the graph still splits into disconnected islands.',groups:details.components});if(!graph.get('traceable')&&consequent.includes('traceable'))reason.push({kind:'path',title:'Every proposed route leaves someone out',body:`All vertex-simple paths were checked. None visits all ${graph.n} vertices. Degree sequence: ${details.degrees.join(', ')}.`});if(details.bridges.length&&consequent.includes('bridgeless'))reason.push({kind:'bridge',title:`${details.bridges.length} fragile connection${details.bridges.length>1?'s':''}`,body:'Removing a highlighted bridge increases the number of connected components, even though local degrees may look sufficient.',edges:details.bridges});if(!reason.length)reason.push({kind:'logic',title:'The premise holds. The conclusion does not.',body:'Inspect the exact property values below, edit an edge, and evaluate both sides again. This finite witness disproves the universal implication.'});return reason;}
export function makeWitness(graph,a,b,sourceA,sourceB){return {n:graph.n,mask:graph.mask,edges:graph.edges,properties:graph.all(),details:graph.details(),antecedent:trace(a,k=>graph.get(k)),consequent:trace(b,k=>graph.get(k)),explanation:explanation(graph,sourceA,sourceB)};}
export function updateHash(hash,n,mask,premise,conclusion){for(const value of[n,mask&255,mask>>>8,premise?1:0,conclusion?1:0]){hash^=value;hash=Math.imul(hash,16777619)>>>0;}return hash;}
export async function experiment(config,{progress=()=>{},cancelled=()=>false,yieldControl=()=>Promise.resolve()}={}){
 const max=Number(config.maxVertices);if(!Number.isInteger(max)||max<1||max>6)throw new Error('Choose a maximum between 1 and 6 vertices.');if(!['first','census'].includes(config.mode))throw new Error('Choose first or census mode.');
 const a=compile(config.antecedent),b=compile(config.consequent);const result={format:'counterseed-experiment-v1',engineVersion:VERSION,startedAt:new Date().toISOString(),conjecture:{antecedent:config.antecedent,consequent:config.consequent},universe:{minVertices:1,maxVertices:max,simple:true,undirected:true,labeled:true,loops:false},enumeration:'vertices ascending, then edges ascending, then bitmask ascending',mode:config.mode,status:'running',complete:false,counts:{checked:0,eligible:0,violations:0,total:totalGraphs(max)},perOrder:[],witness:null,visitedHash:'811c9dc5',hashAlgorithm:'FNV-1a-32 over n, mask low byte, mask high byte, premise, conclusion; noncryptographic'};let hash=2166136261,stop=false;
 for(let n=1;n<=max&&!stop;n++){const row={n,checked:0,eligible:0,violations:0,total:2**(n*(n-1)/2),complete:false};result.perOrder.push(row);const masks=masksBySize(n);
  for(const mask of masks){if(cancelled()){result.status='cancelled';stop=true;break;}const graph=new Graph(n,mask),premise=evaluate(a,k=>graph.get(k)),conclusion=evaluate(b,k=>graph.get(k));row.checked++;result.counts.checked++;if(premise){row.eligible++;result.counts.eligible++;}hash=updateHash(hash,n,mask,premise,conclusion);if(premise&&!conclusion){row.violations++;result.counts.violations++;if(!result.witness)result.witness=makeWitness(graph,a,b,config.antecedent,config.consequent);if(config.mode==='first'){result.status='counterexample';stop=true;break;}}
   if(result.counts.checked%256===0){result.visitedHash=hash.toString(16).padStart(8,'0');progress(structuredClone(result));await yieldControl();}
  }row.complete=row.checked===row.total;
 }
 result.complete=result.counts.checked===result.counts.total;result.visitedHash=hash.toString(16).padStart(8,'0');if(result.status==='running')result.status=result.witness?'counterexample':'bounded';result.finishedAt=new Date().toISOString();result.claim=result.status==='cancelled'?'Interrupted search. No assertion about the unsearched universe.':result.witness?'A finite counterexample disproves this universal implication. Minimal by vertex count, then edge count, within the declared universe.':result.counts.eligible===0?'No graph in the declared finite universe satisfies the premise. The implication holds there vacuously; no evidence for a larger universe.':'No counterexample exists in the fully enumerated declared universe. This is bounded evidence, not a proof for all finite graphs.';return result;
}
