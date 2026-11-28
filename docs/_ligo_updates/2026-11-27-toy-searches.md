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
- Pipeline test on one day of training data: all three ran end to end, through coincidence, a time-slide background of about one year, and scoring at 1/week. Every FAR was honest on held-out noise. Per search at 1/week on one training day:
  - M0: efficiency 0%, honesty p = 0.92;
  - M1: efficiency 0.2%, p = 1.0;
  - M2: efficiency 0.2%, p = 0.29.

  All pass honesty, and none is flagged by the faint-signal check.
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

| List | What it does | Efficiency (1/day and 1/week) | FAR honesty | Faint-signal check | Expected |
|---|---|--:|---|---|---|
| nothing | reports no triggers | 0% | honest | clean | zero sensitivity, honest |
| every_second_honest | a 1 s trigger every second, honest FAR of 1 Hz | 0% | honest | clean | zero sensitivity at useful FAR, honest |
| every_second_liar | a 1 s trigger every second, each claiming a tiny FAR | 100% | dishonest | flagged | caught by FAR honesty |
| random_liar | random 1 s triggers, each claiming a tiny FAR | 6.9% | dishonest | clean | caught by FAR honesty |
| oracle | reads the answer key: every injection, tiny FAR | 100% | honest | flagged | caught by the faint-signal check |

</div>

All five behave as designed. The oracle shows why the faint-signal check matters: its FARs look honest, because it reports nothing on noise, and only the faint-signal check exposes it.

<div class="plot-pair">
{% include figure.html
   src="/assets/img/ligo/2026-11-27/every_second_liar_far_honesty.png"
   alt="Observed trigger rate on the noise set against the claimed false-alarm-rate threshold for every_second_liar: the observed rate stays near 1 Hz at every threshold, far above the honest diagonal"
   label="every_second_liar: FAR honesty" %}
{% include figure.html
   src="/assets/img/ligo/2026-11-27/oracle_far_honesty.png"
   alt="Observed trigger rate on the noise set against the claimed false-alarm-rate threshold for oracle: no triggers on noise at any threshold, so no curve appears above the honest diagonal"
   label="oracle: FAR honesty" %}
</div>

## 4. Reference search (plumbing test)

- Single-detector excess power: whiten, then 4 frequency bands × 4 time scales, a robust z-score, and a threshold.
- Coincidence: H1 and L1 trigger extents overlap within 15 ms; the rank is the smaller of the two detectors' scores.
- Background: one noise day, with L1 time-slid against H1 by multiples of 7 s (1,000 slides), giving about one year.
- Scored on one injection day, with FAR honesty checked on a second, unused noise day.

<div class="table-scroll" markdown="1">

| FAR threshold | Efficiency | Found | Noise expected | Noise observed |
|---|--:|--:|--:|--:|
| 1/hour | 20.8% | 89 | 13.77 | 7 |
| 1/day | 0.7% | 3 | 0.57 | 1 |
| 1/week | 0% | 0 | 0.08 | 0 |
| 1/month | 0% | 0 | 0.02 | 0 |
| 1/year | 0% | 0 | 0.00 | 0 |
| 1/10yr | 0% | 0 | 0.00 | 0 |

</div>

Per family at 1/day: circular BBH 4.0%, sine-Gaussian 0.9%, white-noise burst 0%. FAR honesty: worst p = 0.15, pass.

<div class="plot-pair">
{% include figure.html
   src="/assets/img/ligo/2026-11-27/reference_excesspower_eff_snr.png"
   alt="Efficiency at a false-alarm rate of 1 per day against network optimal SNR for the reference excess-power search, per waveform family: near zero everywhere, rising only for sine-Gaussians at the highest SNR"
   label="Reference search: efficiency against SNR at FAR 1/day" %}
{% include figure.html
   src="/assets/img/ligo/2026-11-27/reference_excesspower_far_honesty.png"
   alt="Observed trigger rate on the noise set against the claimed false-alarm-rate threshold for the reference excess-power search: the curve stays at or below the honest diagonal"
   label="Reference search: FAR honesty" %}
</div>

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
