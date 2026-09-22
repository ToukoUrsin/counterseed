# GIBC V2 — Open Invention submission copy

## Tagline

Turn a conjecture into a counterexample you can touch—and evidence anyone can replay.

## Inspiration

Mathematics becomes interesting when a plausible rule breaks. A student can draw dozens of examples and still miss the one that changes the question. We wanted a laboratory where doubt produces something concrete: a smallest counterexample, an explanation and a reproducible experiment.

## What it does

Counterseed lets you write graph-theory implications using 24 exact properties and a safe logical language. It exhaustively searches labeled simple undirected graphs through six vertices, finds the smallest failure by vertices and edges, and reveals the structure responsible. You can edit the witness, inspect its exact properties, save the experiment, export its evidence and independently replay it.

## How we built it

The static application uses JavaScript modules, SVG and a cancellable Web Worker. A typed expression parser rejects arbitrary code. The production engine implements exact graph algorithms; a separately written reference oracle uses matrices, exhaustive color assignments and permutation paths. A command-line verifier checks the exported search counts, smallest witness and graph properties. No model inference, account, API key, private data or backend is required.

## Challenges

The difficult part was preserving the boundary between finding a counterexample and proving a conjecture. We made the universe explicit, defined what smallest means, kept cancelled searches partial, and treated successful finite searches as bounded evidence. We also made graph editing change real computations immediately, without replacing the original experiment record.

## Accomplishments

The application identifies a five-cycle as the smallest triangle-free nonbipartite graph, exposes a bridge despite minimum degree two, and checks all 33,867 labeled graphs through six vertices for a constructive Euler implication. Core properties agree with independent oracles on that entire universe. The interface makes both a false conjecture and an honest finite success easy to inspect.

## What we learned

A trustworthy exploration tool must make uncertainty and conventions visible. Labels such as connected, Eulerian and smallest are meaningful only with an explicit universe and definitions. Replaying the evidence is more valuable than decorating an unexplained answer.

## What's next

Classroom evaluation, larger bounds using canonical graph generation, richer witness minimization, and optional formal proof-assistant exports. These are future directions, not completed features.

## Built With

JavaScript; Web Workers; SVG; HTML; CSS; browser localStorage; Node.js; Git; GitHub Pages; OpenAI Codex (AI-assisted design, code, tests and documentation); FFmpeg (video production); ElevenLabs stock synthetic narration (demo only). No external dataset, inference API or third-party runtime library.

## Originality and scope

Original September 2026 project, created during GIBC V2's July 11–October 1 period for the Open Invention track. Not a pre-existing commercial product or a cross-submitted campaign project. AI assistance is disclosed. Standard mathematical definitions and teaching examples are credited; no novel theorem is claimed.
