// Independent reference implementation. Deliberately uses matrices, exhaustive
// color assignments and permutations instead of the production graph algorithms.
export function oracle(n,mask){
 const A=Array.from({length:n},()=>Array(n).fill(false));let bit=0,m=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++,bit++)if(mask&(1<<bit)){A[i][j]=A[j][i]=true;m++;}
 const degrees=A.map(row=>row.filter(Boolean).length),cache=new Map();
 const componentCount=(matrix,skip=-1)=>{const remaining=new Set(Array.from({length:n},(_,i)=>i).filter(i=>i!==skip));let count=0;while(remaining.size){count++;const reached=new Set([remaining.values().next().value]);let changed=true;while(changed){changed=false;for(const i of [...reached])for(const j of remaining)if(matrix[i][j]&&!reached.has(j)){reached.add(j);changed=true;}}for(const i of reached)remaining.delete(i);}return count;};
 const colorable=k=>{const combinations=k**(n-1);for(let encoding=0;encoding<combinations;encoding++){let code=encoding;const colors=[0];for(let i=1;i<n;i++){colors.push(code%k);code=Math.floor(code/k);}let ok=true;for(let i=0;i<n&&ok;i++)for(let j=i+1;j<n;j++)if(A[i][j]&&colors[i]===colors[j]){ok=false;break;}if(ok)return true;}return false;};
 const permutationPath=cycle=>{if(cycle&&n<3)return false;const arrange=(prefix,remaining)=>{if(!remaining.length)return !cycle||A[prefix.at(-1)][prefix[0]];for(const v of remaining){if(prefix.length&&!A[prefix.at(-1)][v])continue;if(arrange([...prefix,v],remaining.filter(x=>x!==v)))return true;}return false;};return arrange([],Array.from({length:n},(_,i)=>i));};
 const subsetMax=(wantEdge)=>{let best=1;for(let subset=1;subset<2**n;subset++){const vertices=[];for(let i=0;i<n;i++)if(subset&(1<<i))vertices.push(i);if(vertices.length<=best)continue;let ok=true;for(let i=0;i<vertices.length&&ok;i++)for(let j=i+1;j<vertices.length;j++)if(A[vertices[i]][vertices[j]]!==wantEdge){ok=false;break;}if(ok)best=vertices.length;}return best;};
 function compute(name){switch(name){
  case'vertices':return n;case'edges':return m;case'components':return componentCount(A);case'connected':return get('components')===1;case'min_degree':return Math.min(...degrees);case'max_degree':return Math.max(...degrees);case'even_degrees':return !degrees.some(x=>x%2);case'no_isolates':return !degrees.includes(0);case'regular':return degrees.every(x=>x===degrees[0]);case'complete':return degrees.every(x=>x===n-1);
  case'triangle_free':for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)for(let k=j+1;k<n;k++)if(A[i][j]&&A[i][k]&&A[j][k])return false;return true;
  case'bipartite':return colorable(2);
  case'acyclic':{const parent=Array.from({length:n},(_,i)=>i);const root=x=>parent[x]===x?x:root(parent[x]);for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(A[i][j]){if(root(i)===root(j))return false;parent[root(i)]=root(j);}return true;}
  case'tree':return get('connected')&&get('acyclic');case'eulerian':return get('connected')&&get('even_degrees');case'hamiltonian':return permutationPath(true);case'traceable':return permutationPath(false);
  case'bridgeless':for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(A[i][j]){const B=A.map(r=>[...r]);B[i][j]=B[j][i]=false;if(componentCount(B)>get('components'))return false;}return true;
  case'no_cut_vertices':return Array.from({length:n},(_,i)=>i).every(i=>componentCount(A,i)<=get('components'));
  case'chromatic_number':for(let k=1;k<=n;k++)if(colorable(k))return k;break;
  case'clique_number':return subsetMax(true);case'independence_number':return subsetMax(false);
  case'diameter':{if(!get('connected'))return Infinity;let longest=0;for(let start=0;start<n;start++){const dist=Array(n).fill(-1);dist[start]=0;for(let step=1;step<n;step++)for(let v=0;v<n;v++)if(dist[v]===step-1)for(let w=0;w<n;w++)if(A[v][w]&&dist[w]<0)dist[w]=step;longest=Math.max(longest,...dist);}return longest;}
  case'girth':{let shortest=Infinity;const visit=(start,path)=>{const v=path.at(-1);for(let w=0;w<n;w++)if(A[v][w]){if(w===start&&path.length>=3)shortest=Math.min(shortest,path.length);else if(!path.includes(w)&&path.length<shortest)visit(start,[...path,w]);}};for(let s=0;s<n;s++)visit(s,[s]);return shortest;}
  default:throw new Error(`Oracle does not know ${name}`);
 }}
 function get(name){if(!cache.has(name))cache.set(name,compute(name));return cache.get(name);}return get;
}
