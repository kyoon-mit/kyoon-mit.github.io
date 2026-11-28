- **Harnesses:** agents run through command-line coding tools with the operator's own login: Claude Code, Codex and opencode. The run record also handles Vibe.
- **Models:** the model and its reasoning effort are set for each session. This page does not list which models have been run.
- **Prompt levels:** each task has up to three prompts, each adding briefing to the one before. For the Higgs mass task:
  - a blind prompt, with only the framing and what to hand in;
  - the baseline, which adds the physics context and the published measurement;
  - a guided prompt, which adds an ordered plan, as a physicist would write it.

  The score is the same for every level, so a difference in score measures what the extra briefing is worth.
- **The agent's session:**
  - It runs in a sandbox (bubblewrap) with its own empty home folder and caches, and with the evaluator's files hidden.
  - It has a time budget, 2 hours by default, and is stopped when the budget runs out.
  - An interrupted session can resume with the time it has left.
- **The evaluation of the frozen pipeline:**
  - It runs in a sandbox with the network blocked and the sealed truths not mounted.
  - A submission may hold at most 5 MB per file and 50 MB in total, with no bundled installed packages; dependencies are declared and installed by the harness.

### What is recorded for each agent session

<div markdown="1">

| Field | Content |
|---|---|
| Harness, model, effort | As requested for the session. |
| Prompt, bundle, suite | The prompt given, the participant bundle, and the sealed suite the pipeline is evaluated on. |
| Budget | The session's whole time budget, in seconds. |
| Segments | For each stretch of work: start and end times, its budget, and its exit code (124 means stopped at the budget). |
| Harness version | The version of the coding tool. |
| As run | What the coding tool itself reports ran: the model, its version and the session id. Claude Code adds its permission mode; Codex adds its reasoning effort, approval and sandbox settings. |
| Refusal | Why a session was refused before it started, for example a login that would expire before the budget ends. |

</div>

- **Wall time** is the sum of the segments' durations, with gaps between them not counted.
- **Tokens and cost** are not recorded by the public harness.
- **For each sealed world**, the evaluation records:
  - CPU time, peak memory and wall time;
  - the kind of any failure: timeout, out of memory, crash, rejected output, or a failed environment build.
