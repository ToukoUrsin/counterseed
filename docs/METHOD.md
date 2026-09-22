# The declared universe

Counterseed considers labeled simple undirected graphs on vertices `0 … n−1`, for `1 ≤ n ≤ N ≤ 6`. Loops, multiple edges, directed edges and weighted edges are outside scope.

There are `2^(n(n−1)/2)` graphs at each order. The totals are 1, 2, 8, 64, 1,024 and 32,768. Summed through six vertices: **33,867**. Relabelings are deliberately retained. Counts refer to labeled graphs, not isomorphism classes.

## Encoding and smallest

List potential edges lexicographically: `(0,1), (0,2), …, (0,n−1), (1,2), …`. Bit `i` in the nonnegative integer mask says whether potential edge `i` exists.

Enumeration order is ascending vertex count, ascending edge count, ascending mask. A first witness is smallest by vertex count and, among those graphs, edge count. Every earlier candidate was checked. A cancelled run makes no statement about candidates not visited.

## Expressions

The typed parser accepts property identifiers, `true`, `false`, nonnegative numbers, `infinity`, parentheses, `!`/`NOT`, `&&`/`AND`, `||`/`OR`, and `== != < <= > >=`. NOT binds first, then comparisons, AND, OR. Only Boolean expressions can be a premise or conclusion. Numeric properties require a comparison. Arbitrary JavaScript, functions, property access and assignment are rejected.

Examples:

```text
connected && min_degree >= 2
(triangle_free || vertices <= 3) && !complete
girth == infinity
chromatic_number > clique_number
```

An implication fails only when the premise is true and conclusion false. If no graph satisfies the premise, the bounded result is explicitly vacuous.

## Conventions

- A one-vertex graph is connected, acyclic, a tree, regular, complete and bipartite. Its chromatic, clique and independence numbers are one; its minimum and maximum degrees are zero.
- `eulerian` requires connectedness and an edge-exact closed walk; the one-vertex empty walk is included. A disconnected graph with isolated vertices is not Eulerian under this convention, even if its edge-bearing component has an Euler circuit.
- Hamiltonian paths visit every vertex once. Hamiltonian cycles require at least three vertices.
- Girth is infinite for forests. Diameter is infinite for disconnected graphs and zero for a one-vertex graph.
- A bridge is an edge whose removal increases component count. A cut vertex is defined analogously by vertex removal. Edgeless graphs have no bridges; the one-vertex graph has no cut vertex.

## Implementations and evidence

The production engine computes graph properties exactly, with lazy evaluation during enumeration. Expensive properties such as chromatic number, clique size and Hamiltonicity are practical because `n ≤ 6`.

The reference oracle uses separately written matrix and exhaustive algorithms. It does not import the production Graph class. The CLI verifier shares the parser and fingerprint routine, then replays the graph computations independently. The tests also exercise the parser and enforce fixed expected witnesses.

A downloadable record establishes a reproducible finite computation. It is not a cryptographic attestation, proof assistant output, or claim that general mathematical truth can be decided by a six-vertex search.
