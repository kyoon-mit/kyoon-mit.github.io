---
layout: project
project: ligo
theme: dark
math: true
title: Agent report
permalink: /projects/agentic-ligo/
eyebrow: Current project
summary: >-
  How the agent benchmark scores an analysis, the data it runs on, and what is
  recorded for each agent run. The high energy physics benchmark is built and
  public; the LIGO version is being designed.
next_page: /projects/agentic-ligo/overview/
next_title: Overview
---

## How it works

- An AI agent gets a public dataset and writes an analysis pipeline: a folder with a script, `run.sh <dataset> <out>`, that writes its answers to a file, `RESULT.json`.
- The pipeline is then frozen and run, unchanged and offline, on many sealed datasets ("sealed worlds"). Each sealed world is generated with injected signals, and with detector settings varied within realistic uncertainties.
- Every answer is compared with the injected truth. The run is scored relative to an expert reference analysis, which goes through exactly the same path.
- The sealed worlds and their truths are not public. The code is: [hep-ex-bench/hep-ex-bench](https://github.com/hep-ex-bench/hep-ex-bench) (Apache-2.0), with the public datasets on [Hugging Face](https://huggingface.co/hep-ex-bench) (CC BY 4.0).

## Scoring

The full definitions are in the repository's [METRICS.md](https://github.com/hep-ex-bench/hep-ex-bench/blob/9f26b70/docs/METRICS.md). In short:

### One measurement in one sealed world

For each quantity the agent measures (for example the Higgs boson mass) in each sealed world, the agent reports a value $x$ with an uncertainty $\sigma$. The injected truth is $t$, the pull is $z = (x - t)/\sigma$, and the reference analysis quoted an uncertainty $\sigma_\mathrm{ref}$ in the same world. The charge is

$$\Delta = \ln\frac{\sigma}{\sigma_\mathrm{ref}} + \frac{z^2 - 1}{2}.$$

- The first part charges for being less precise than the reference, and gives credit for being more precise.
- The second part charges for missing the truth by more than the quoted uncertainty allows.
- The reference, with honest uncertainties, sits at 0 on average.
- This is the logarithmic score: quoting your true uncertainty gives the lowest expected charge, and shrinking or padding it costs.

### Across the sealed worlds

- **A bias shared by every world.** The answers from all worlds are combined like independent measurements (weighted by $1/\sigma^2$), and the combination's squared pull beyond what chance gives is added to the charge. A bias that repeats in every world therefore costs about twice what a random error of the same size costs.
- **A crash.** A world where the pipeline fails is charged as "don't know": the charge of the task's no-answer guess, never less than 0. Skipping hard worlds never beats the reference.

### The total score

$$\Delta_\mathrm{total} = \Delta_\mathrm{phys} + 0.10\,\Delta_\mathrm{cal} + 0.30\,\Delta_\mathrm{gof} + 0.10\,\Delta_\mathrm{syst} + 0.5\,\Delta_\mathrm{truth} + 0.05\,\Delta_\mathrm{claims} + 0.1\,\Delta_\mathrm{compute}$$

$$S = e^{-2\,\Delta_\mathrm{total}}$$

<div markdown="1">

| Term | Weight | What it checks |
|---|---|---|
| Physics | 1 | The measured quantities, charged as above and averaged over them. |
| Calibration | 0.10 | Detector calibrations the agent measures and logs (for example a shift of the lepton momentum scale), against the values injected into each world. |
| Goodness of fit | 0.30 | Whether the agent's statistical model fits the data, over all worlds together (the per-world p-values combined by Fisher's method; no charge while the combined p-value is at least 1 %). |
| Completeness | 0.10 | Whether the model includes the standard sources of uncertainty, as real effects rather than placeholders. |
| Truthfulness | 0.5 | Whether the reported numbers match what the evaluator gets by refitting the agent's own model. |
| Claims | 0.05 | Whether the side claims (expected and observed significance, a discovery claim, the split into statistical and systematic uncertainty, the fit quality) agree with that refit. |
| Compute | 0.1 | Run time against the reference: free up to 1.5 times the reference's time, then +1 per doubling. A faster run can earn down to −1, but only when the rest of its score is as good as the reference's. |

</div>

- This total is for tasks where the agent hands in a statistical model, which the evaluator refits. The lepton calibration task uses its own total: physics, completeness, a check of the corrected Z boson peak (weight 0.5) and compute.
- **The headline number** is the relative score: $S$ divided by the reference's $S$ on the same worlds, as a percentage. 100 % is the reference; above 100 % is better than the reference. Its ±1σ band comes from resampling the sealed worlds 1000 times.

### Checks against cheating

- **Cheating submissions.** Submissions that cheat on purpose are part of the test suite. Each must score below the honest reference, or the score has a hole. Every task ships one that reports a constant, and the Higgs width task also ships one that always reports the Standard Model width. Others are generated automatically, for example an honest answer whose result file is a link the grader must not follow.
- **Tripwire.** It flags answers that look placed rather than measured:
  - values sitting on the points the truths are drawn from;
  - published values;
  - one value repeated across worlds;
  - an answer pinned at zero signal;
  - uncertainties far smaller than the reference's.

  It flags a run for human review and never changes the score.
- **Missing background.** A model that leaves out a standard background process is flagged, also without changing the score.

## Tasks and datasets

### High energy physics (built)

<div markdown="1">

| Task | What the agent measures | What it hands in | Data |
|---|---|---|---|
| HiggsLepMass (`h4l`) | The Higgs boson signal strength and mass from H→ZZ*→4ℓ, detector calibrations included | Values with uncertainties, and a binned likelihood model | CMS Open Data simulation, 2016 conditions |
| HiggsWidth (`h4l_width`) | The Higgs width relative to the Standard Model, and the on-shell signal strength, from H→ZZ→4ℓ | Intervals, and a binned likelihood model whose rates scale with them | CMS Open Data simulation and private samples through the same detector simulation, 2016 conditions |
| LepCalib (`lep_calib`) | Lepton calibrations from Z→ℓℓ | Corrections as functions, in the correctionlib format | CMS Open Data derived simulation, 2016 conditions |

</div>

- **Data format:** reconstructed events in the NanoAOD format, slimmed to muons, electrons, photons from final-state radiation, trigger objects and trigger decisions.
- **Public datasets:** `hep-ex-bench/HiggsLepMass`, `hep-ex-bench/HiggsWidth` and `hep-ex-bench/LepCalib` on Hugging Face. The repository's instructions use revision `v0.2`.
- **Sealed worlds:** for the two Higgs tasks, each sealed world carries about twice the integrated luminosity of the public dataset. For the lepton calibration task, every world carries 10 fb⁻¹.

### Toy tasks (built)

Small tasks shipped whole in the repository, as worked examples for adding a task.

<div markdown="1">

| Toy | What the agent measures | What it hands in |
|---|---|---|
| `gauss_peak` | A Gaussian peak | Values with uncertainties |
| `bump_model` | A resonance on a falling background | Values, and a binned likelihood model |
| `peak_calib` | A muon momentum scale, resolution and efficiency from a Z boson peak | Corrections |
| `width_toy` | A width ratio from an off-shell mass spectrum | Intervals, and a binned likelihood model |

</div>

### LIGO (being designed)

Nothing is built yet. The draft is in the [design note](https://github.com/kyoon-mit/hep-ex-bench/blob/ligo-benchmarks/docs/LIGO_BENCHMARKS_DESIGN.md).

- **What the agent hands in:** for each dataset, a trigger list. It is a CSV file with one row per candidate event, giving:
  - column 1: the start GPS time, in seconds;
  - column 2: the end GPS time, in seconds;
  - column 3: the false-alarm rate, in Hz.

  Sky position (right ascension and declination) may be added later.
- **Planned benchmarks:**
  - **Sensitivity at a fixed false-alarm rate:** the fraction of injected signals found, per waveform, against signal amplitude and signal-to-noise ratio. Classes are compared at a fixed signal-to-noise ratio, since some were injected louder than others.
  - **Honest false-alarm rates:** checked on the noise-only data.
  - **Generalization:** the gap between the signal classes seen in training and the classes held out from it.
  - **Cheating check:** some injected signals are too faint for any real search. A search that finds many of them has most likely subtracted the public LIGO data.
  - **The standard plots of gravitational-wave searches:**
    - injections found or missed;
    - the fraction found against signal strength;
    - the number of candidates above each false-alarm rate, compared with what noise alone gives.
  - **Later:** latency, and the probability that a candidate is a real signal.
- **The data:**
  - real LIGO strain from the third observing run (O3), from the Hanford and Livingston detectors, at 16,384 Hz, with simulated short bursts (under 10 s) added;
  - training data from the first half of the run (O3a): one set with injected signals and one with noise only;
  - a sealed test set from the second half (O3b), with the same two parts;
  - training signals: 39 waveforms (19 sine-Gaussians, 16 white-noise bursts, 4 binary black hole mergers on circular orbits);
  - test signals: the same 39 plus five classes the agent never sees in training;
  - not on Hugging Face; where the benchmark will host it is not decided yet.
- **Offline:** agents run with no network. O3 strain is public, so subtracting it from the data would reveal every injection.
- **A toy task comes first:** simulated noise with simple injected bursts, to test the scoring and the cheating submissions before the real data.

## Models and agents

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

## Results

No agent results are shown yet. They will appear here once they are published.

---

*Sources: the [HEP-Ex-Bench repository](https://github.com/hep-ex-bench/hep-ex-bench/tree/9f26b70) at commit 9f26b70 ([README](https://github.com/hep-ex-bench/hep-ex-bench/blob/9f26b70/README.md), [METRICS.md](https://github.com/hep-ex-bench/hep-ex-bench/blob/9f26b70/docs/METRICS.md), [ISOLATION.md](https://github.com/hep-ex-bench/hep-ex-bench/blob/9f26b70/docs/ISOLATION.md), [agent_run_record.py](https://github.com/hep-ex-bench/hep-ex-bench/blob/9f26b70/scripts/fleet/agent_run_record.py)) and the LIGO [design note](https://github.com/kyoon-mit/hep-ex-bench/blob/ligo-benchmarks/docs/LIGO_BENCHMARKS_DESIGN.md).*
