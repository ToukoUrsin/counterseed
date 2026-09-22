# Demo capture and narration

The six narration segments in `media/scene-01.txt` through `scene-06.txt` total 411 words, roughly 2 minutes 45 seconds at the generated stock voice's measured pace. Use the actual generated audio duration to set each segment, rather than a hardcoded estimate. Narration is openly synthetic; no personal voice was cloned.

All footage must show the working application. The graph, calculations, search and certificate are real. Hold an actual screen while explaining it; do not replace application operation with fabricated interactions or generated result screens.

## Six scenes

1. **Introduction.** Top of laboratory, default triangle-free to bipartite. Establish the editable hypothesis and scope. Scroll just enough to bring the Test button into view, if necessary.
2. **Counterexample.** Click Test. Inspect the completed result, five-cycle and odd-cycle explanation. Scroll to evidence: 507 graphs checked, 368 satisfy the premise, one minimal counterexample. This is a first-witness search, not a complete 33,867-graph census.
3. **Intervention.** Remove one visible cycle edge. Show bipartite becoming true, chromatic number dropping to two and the live-property grid changing. Restore the witness; optionally drag a vertex or toggle an adjacency control.
4. **New hypothesis.** Select “Two neighbors are enough?” and run it. The premise is `connected && min_degree >= 2`, conclusion `bridgeless`. Show the six-vertex witness and highlighted bridge. Remove the bridge and show components increasing. Restore it. The property library can be opened briefly to show that users can construct arbitrary supported expressions.
5. **Bounded success.** Select “A walk that uses every edge” and run its complete census. Show 33,867 graphs, 763 eligible, zero violations and “Bounded only.” Do not describe this computation as an unbounded proof. A selected sandbox graph may be outside the premise; the finite census result is still the evidence being shown.
6. **Reproducibility.** Open Field notes, reopen an experiment, inspect the replay certificate and show export. Close on The method, including the independent verifier command and the limits. Optional actual terminal cut: `node verify.mjs examples/triangle-trap.json` followed by `npm test`.

## Screenshots

- The minimum C5 counterexample with its premise/conclusion and structural explanation.
- The six-vertex bridge witness or live graph-editing state.
- The complete Euler census and bounded-evidence language, or Field notes with multiple actual experiments.

Screenshots belong in `media/`; raw screencast frames and rendered MP4/MP3 files are ignored by Git. Add the final public video URL to the README after upload. The event requires 2–5 minutes and at least three screenshots.
