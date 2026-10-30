---
title: "Cramér–Rao bound: our 4 s window allows 0.39% chirp-mass error at SNR 4 to 6, so the window is not the limit"
date: 2026-10-05
tags: [regression]
summary: >-
  A Cramér–Rao estimate says even the 4 s merger window holds enough
  information for sub-percent chirp mass at SNR 4 to 8, so the window is not the
  limit. Both published low-SNR pipelines start from a near-correct chirp mass,
  one from a trigger or a scan, the other from a grid.
---

{% include notice-snr-powerlaw.html %}

## The window is not the bottleneck

For 600 events drawn at random from our test injection set, the chirp-mass
Cramér–Rao bound, the square root of the chirp-mass entry of the inverse Fisher
matrix (Cutler and Flanagan 1994,
[arXiv:gr-qc/9402014](https://arxiv.org/abs/gr-qc/9402014); Vallisneri 2008,
[arXiv:gr-qc/0703086](https://arxiv.org/abs/gr-qc/0703086)), was computed
for windows ending at merger, with a TaylorF2 waveform (3.5PN phase, no spins)
and the median O3b PSD. Each event is normalized to its catalog SNR, which is
the SNR of its stored waveform, 30 s long; so the 30 s column is the catalog
SNR, and the shorter windows' SNRs are fractions of it
([setup and derivation]({{ '/projects/bns/derivations/' | relative_url }}#sep-fisher)). Our 4 s window holds the
merger 3.5 to 4 s from its start, so 3.5 s before merger is always in it.

| SNR | events | bound σ(Mc)/Mc, 3.5 s | 8 s | 16 s | 30 s | in-window SNR, 3.5 s to 30 s |
|---|---|---|---|---|---|---|
| 4 to 6 | 399 | 0.39% | 0.19% | 0.11% | 0.08% | 4.0 to 4.8 |
| 6 to 8 | 121 | 0.28% | 0.13% | 0.08% | 0.05% | 5.6 to 6.6 |
| 8 to 12 | 55 | 0.20% | 0.09% | 0.05% | 0.04% | 7.8 to 9.5 |
| 12 to 16 | 17 | 0.14% | 0.06% | 0.04% | 0.03% | 11.5 to 13.5 |

Our 3.5 s window already holds 85% of the 30 s SNR (median over events), and
its bound is 5.1 to 14.7 times tighter than the 2% we score against (5.1 at
SNR 4 to 6). Lengthening it to 30 s tightens the bound 4.9 to 5.2 times (ratio
of the bin medians) but raises the SNR by only 17 to 22%
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#sep-fisher)).

The bound is optimistic at this SNR, though. It comes from a linear expansion
of the waveform around the true parameters, a single smooth likelihood peak,
and is reliable only at high SNR; at low SNR the actual error can be much
larger than the bound (Vallisneri 2008, cited above). So the information is not
missing for lack of window, but a precise estimate at SNR 5 is not guaranteed
either. A matched-filter benchmark on the same windows would settle it.

## What the published pipelines do differently

Both reach low SNR by handing the network data already demodulated with a
nearly correct chirp mass, so the network never has to find the chirp mass in
the full range from the raw chirp.

- **DINGO-BNS** (Dax et al. 2025,
  [arXiv:2407.09602](https://arxiv.org/abs/2407.09602)) trains across narrow
  chirp-mass priors, ±0.005 M☉ around a reference chirp mass (±0.42% of
  GW170817's 1.1975 M☉), conditions the network on that reference, and
  removes the leading-order chirp phase with it before compressing the data
  in a multibanded frequency domain (128 s of data; from 19.4 Hz in their
  LIGO-Virgo-KAGRA setting). At inference the reference comes from a search
  trigger, or from a scan over 241 reference values covering 1.0 to 2.2 M☉,
  keeping the chirp mass of the maximum-likelihood sample. The released GW170817 demo
  ([binary-neutron-star-demo](https://github.com/dingo-gw/binary-neutron-star-demo))
  also fixes the sky position.
- **The AFRAME BNS search** (Gupta et al. 2026,
  [arXiv:2607.01372](https://arxiv.org/abs/2607.01372)) heterodynes the
  whitened strain at a grid of 100 chirp masses spaced uniformly in log from
  1.0 to 2.5 M☉ (the same defaults are in the AFRAME data module). It ranks
  the 100 de-chirped streams by their peak and passes the top 10, the 1.5 s
  before each peak, to the network, which only has to tell whether they hold a
  signal.

Our models are asked something neither does: find the chirp mass in a broad
prior from the raw chirp. The
[brainstorm]({{ '/projects/bns/brainstorm/' | relative_url }}) page lists the
tests that follow from this.

## Also started today

- A fine-tune of the Project 8 recipe run on SNR ≥ 8 only, validating on the
  full power law from SNR 4.
- A sensitive-volume measurement from the epoch-630 checkpoint, with −σ as the
  statistic, no time integration, and about one week of O3b background.
