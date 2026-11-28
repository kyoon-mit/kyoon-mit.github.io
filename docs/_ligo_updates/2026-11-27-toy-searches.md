---
title: Three toy searches, and the full run
date: 2026-11-27 23:00:00
summary: >-
  Two scoring choices fixed for testing, three deliberately crude searches
  frozen and run end to end on one day of training data, and the full run
  over the whole dataset started.
---

> **Summary.** The scorer works end to end on the O3 burst benchmark's training split. It reproduces the dataset's own reference injection counts exactly. It scores five fake trigger lists the way the design note expects: every cheat is caught. It also scores a deliberately simple reference search, whose false-alarm rates turn out honest. The reference search itself is weak; it is a plumbing test, not a result.
{: .callout}

**Update, evening.**

- Decided for testing: a matching tolerance of 0.1 s and a main FAR threshold of 1/week.
- Three toy searches, frozen as v0: excess power; a small 1D CNN on 1 s whitened windows; and a noise-only autoencoder. Their weights are saved with checksums, and the run script refuses anything else. The two learned models were trained for about two minutes on CPU and learned essentially nothing, as expected; the aim is the pipeline. [OMITTED: training-set sizes, which are EM's data]
- Pipeline test on one day of training data: all three ran end to end, through coincidence, a time-slide background of about one year, and scoring at 1/week. Every FAR was honest on held-out noise. [OMITTED: per-search p-values and efficiencies, pending kyoon's decision]
- The full run over the whole dataset started on a single GPU (about a day expected).
- Test-set sensitivity needs the test answer key, which is organizer-only, so an organizer will run that scoring. Training-set scoring and the test FAR-honesty check need no test truth.

## 1. Answer table (truth)

Built from the training answer key with the dataset handbook's merge rules: injections crossing a frame boundary are merged, with their SNRs added in quadrature, and an injection is "usable" if it lies inside both detectors' segment lists and has a finite SNR.

<div class="table-scroll" markdown="1">

| Quantity | Check |
|---|---|
| Injections in the training injection set | matches the handbook exactly |
| Usable in both detectors | matches the handbook exactly |
| Usable with network SNR < 2 | matches the handbook exactly |
| Coincident H1-L1 analysable time | matches the handbook exactly |

</div>

[OMITTED: the counts themselves, which are EM's dataset numbers]
{: .omitted}

## 2. Scoring rules used

- Hand-in: a CSV of start, end, far (GPS s, GPS s, Hz). The scorer also reads the LVK 9-column format, with -999 for unknown values.
- Match: the trigger interval overlaps the injection's extent, widened by 0.1 s on each side.
- Triggers that match only unscored injections (unusable or excluded) are dropped: neither found nor false alarms.
- Sensitivity: the fraction of scored injections found with claimed FAR below a threshold (1/hour to 1/10 yr; 1/week is the main one for now).
- FAR honesty: on the noise set, the number of triggers with FAR ≤ F is compared with the Poisson expectation F·T. A search fails if the result is very unlikely at any claimed FAR. [OMITTED: the exact p-value cut, which is provisional]
- Faint-signal check: flagged if the search finds more than a small fraction of injections too quiet for any real search to see. [OMITTED: the exact cut, which is provisional]
- Only injections inside the analysed time are scored, so partial runs are scored fairly.

## 3. Fake trigger lists (scorer test), full training split

<div class="table-scroll" markdown="1">

| List | What it does | FAR honesty | Faint-signal check | Expected |
|---|---|---|---|---|
| nothing | reports no triggers | honest | clean | zero sensitivity, honest |
| every_second_honest | a 1 s trigger every second, honest FAR of 1 Hz | honest | clean | zero sensitivity at useful FAR, honest |
| every_second_liar | a 1 s trigger every second, each claiming a tiny FAR | dishonest | flagged | caught by FAR honesty |
| random_liar | random 1 s triggers, each claiming a tiny FAR | dishonest | clean | caught by FAR honesty |
| oracle | reads the answer key: every injection, tiny FAR | honest | flagged | caught by the faint-signal check |

</div>

[OMITTED: the sensitivity column, pending kyoon's decision]
{: .omitted}

All five behave as designed. The oracle shows why the faint-signal check matters: its FARs look honest, because it reports nothing on noise, and only the faint-signal check exposes it.

[OMITTED: two figures, pending kyoon's decision]
{: .omitted}

## 4. Reference search (plumbing test)

- Single-detector excess power: whiten, then 4 frequency bands × 4 time scales, a robust z-score, and a threshold.
- Coincidence: H1 and L1 trigger extents overlap within 15 ms; the rank is the smaller of the two detectors' scores.
- Background: one noise day, with L1 time-slid against H1 by multiples of 7 s (1,000 slides), giving about one year.
- Scored on one injection day, with FAR honesty checked on a second, unused noise day.
- Compute: 126 single-core Condor jobs, about 2 CPU-hours.

[OMITTED: the sensitivity table, the per-family table and two figures, pending kyoon's decision]
{: .omitted}

FAR honesty passes. Sensitivity is poor: glitches dominate the background. One year of background cannot support thresholds beyond about 1/year; the LVK rule of at least 100 years would need far more slides or noise.

## 5. Caveats

- Training split only. No test data, test truth or organizer-only material was used.
- The tolerance and the two check cuts are provisional and should be fixed before agents are scored.
- The reference search is intentionally crude. It exists to exercise the scorer, not to set a baseline.

## 6. Next

- Freeze the tolerance and FAR threshold for real.
- Commit the scorer to kyoon-mit/agentic-ligo, branch ligo-benchmarks (PR 1).
- Get a real baseline: improve this search, or obtain cWB triggers on these frames.
- Score the full run.
