---
title: "Slides: S4D's fixed tones suit Project 8, not neutron-star chirps (tone count, clean-signal gap later corrected)"
date: 2026-10-14
tags: [s4d, cnn]
math: true
summary: >-
  A deck for physicists: what we tested so far; why S4D's filters, built from
  fixed-pitch tones, suit Project 8 but not binary neutron star chirps, with
  the math of one S4D layer; what one layer of learned free kernels does; pros
  and cons; prior work on template and chirp layers; training status; and the
  ways forward, including a time warp that turns a chirp into a tone.
---

{% include notice-snr-powerlaw.html %}

The slides, with the source of each number under it. "Bells" on the slides
are the tones of an S4D layer.

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/01_cover.png"
   alt="Title slide: Chirps, tones and learned filters." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/02_task.png"
   alt="Slide: the goal is to read the chirp mass straight from 4 s of data; a chirp waveform."
   caption="Cycles in our 4 s windows: <a href='/projects/bns/derivations/#cycles'>derivation</a>. The drawn chirp is schematic (fewer cycles)." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/03_tests1.png"
   alt="Slide: table of what we tested, part 1: is the information in the data."
   caption="Sources: <a href='/projects/bns/updates/2026-07-30-reality-check/'>30 July</a>, <a href='/projects/bns/updates/2026-10-05-recipe-at-epoch-630/'>5 October</a>, <a href='/projects/bns/updates/2026-10-07-matched-filter-benchmark/'>7 October (bank)</a>, <a href='/projects/bns/updates/2026-10-07-chirp-kernels/'>7 October (tones)</a>, <a href='/projects/bns/updates/2026-10-08-chirp-kernels-work/'>8 October</a>, <a href='/projects/bns/updates/2026-10-12-template-bank-network/'>12 October</a>, <a href='/projects/bns/updates/2026-10-14-den-reg-final/'>14 October</a>." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/04_tests2.png"
   alt="Slide: table of what we tested, part 2: which network learns the chirp mass without templates."
   caption="Validation within 1% over all SNRs, one seed per network, from the training logs; curves: <a href='/projects/bns/updates/2026-10-13-learned-long-kernels/'>13 October</a>." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/05_coherent.png"
   alt="Slide: a weak chirp must be added up in step; arrows in one direction against a random walk."
   caption="SNR per cycle and the N<sup>1/4</sup> loss: <a href='/projects/bns/derivations/#semi-coherent'>derivation</a>; adding in step: <a href='/projects/bns/derivations/#ck-coherent'>coherent addition</a>." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/06_s4d.png"
   alt="Slide: an S4D layer is a bank of bells; three damped tones with the same ring time."
   caption="An S4D kernel is a sum of damped tones (Gu et al. 2022, <a href='https://arxiv.org/abs/2206.11893'>arXiv:2206.11893</a>); <a href='/projects/bns/derivations/#s4d-tones'>frequency and memory</a>." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/07_s4dmath.png"
   alt="Slide: the equations of one S4D channel as driven, damped oscillators."
   caption="Gu et al. 2022, <a href='https://arxiv.org/abs/2206.11893'>arXiv:2206.11893</a>; the discrete form and the S4D-Lin start: <a href='/projects/bns/derivations/#s4d-tones'>derivation</a>." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/08_p8.png"
   alt="Slide: Project 8's signal is nearly a tone, so about 3 bells fit it."
   caption="Asner et al. 2015, <a href='https://arxiv.org/abs/1408.5362'>arXiv:1408.5362</a>; Ashtari Esfahani et al. 2017, <a href='https://arxiv.org/abs/1703.02037'>arXiv:1703.02037</a>. Tone count on 50 simulated records: <a href='/projects/bns/updates/2026-10-07-chirp-kernels/'>7 October</a>. S4D on Project 8: internal results." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/09_bns.png"
   alt="Slide: a BNS chirp crosses each fixed bell pitch once; 500 to 1,200 bells are needed."
   caption="Fourier tones: <a href='/projects/bns/updates/2026-10-07-chirp-kernels/'>7 October</a>, <a href='/projects/bns/derivations/#ck-fourier-tones'>definition</a>; tone fits, best of three methods: <a href='/projects/bns/derivations/#early-tone-fit'>method and table</a>." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/10_ring.png"
   alt="Slide: in S4D's starting values bell n rings only n cycles."
   caption="<a href='/projects/bns/derivations/#s4d-tones'>Derivation and check</a>; 7% after 200 epochs: <a href='/projects/bns/updates/2026-10-13-learned-long-kernels/'>13 October</a>." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/11_bigger.png"
   alt="Slide: validation curves; more bells per channel helps, wider did not, deeper only caught up."
   caption="Runs and curves: <a href='/projects/bns/updates/2026-10-13-learned-long-kernels/'>13 October</a>." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/12_free.png"
   alt="Slide: free kernels; spectrograms of four learned filters that became chirps."
   caption="The network: <a href='/projects/bns/free-kernel/'>free-kernel page</a>; matches to templates: <a href='/projects/bns/updates/2026-10-13-learned-long-kernels/'>13 October</a>." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/13_results.png"
   alt="Slide: clean signal without noise; free kernels 99.7% within 1%."
   caption="<a href='/projects/bns/updates/2026-10-14-signal-only-test/'>Signal-only test</a>; the complex S4D with energy and maximum is a later run of the same test." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/14_results2.png"
   alt="Slide: with real LIGO noise, free kernels equal the template bank on loud signals and fall behind on quiet ones."
   caption="50k test windows: <a href='/projects/bns/updates/2026-10-13-learned-long-kernels/'>13 October</a>; den-reg: <a href='/projects/bns/updates/2026-10-14-den-reg-final/'>14 October</a>." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/15_pros.png"
   alt="Slide: table of pros and cons of S4D, free kernels and the template bank."
   caption="Test numbers: <a href='/projects/bns/updates/2026-10-13-learned-long-kernels/'>13 October</a>; sizes and timing: <a href='/projects/bns/free-kernel/'>free-kernel page</a>, <a href='/projects/bns/derivations/#parameters'>parameter counts</a>, <a href='/projects/bns/derivations/#cost'>operation counts</a>." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/16_prior.png"
   alt="Slide: is the chirp-kernel layer plagiarism? No, but it is mostly known; table of prior work."
   caption="Wang et al. 2020, <a href='https://arxiv.org/abs/1909.13442'>arXiv:1909.13442</a>; Yan et al. 2022, <a href='https://arxiv.org/abs/2104.03961'>arXiv:2104.03961</a>; Yamamoto et al. 2025, <a href='https://arxiv.org/abs/2512.12399'>arXiv:2512.12399</a>; Mobilia, Dal Canton and Guidi 2026, <a href='https://arxiv.org/abs/2603.09386'>arXiv:2603.09386</a>; Fu et al. 2023, <a href='https://arxiv.org/abs/2302.06646'>arXiv:2302.06646</a>; Rippel et al. 2015, <a href='https://arxiv.org/abs/1506.03767'>arXiv:1506.03767</a>; Allen et al. 2012, <a href='https://arxiv.org/abs/gr-qc/0509116'>arXiv:gr-qc/0509116</a>." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/17_status.png"
   alt="Slide: table of runs in training and their best validation so far."
   caption="Best validation so far, read from the training logs at 16:20 on 14 October." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/18_warp.png"
   alt="Slide: bending the clock turns the chirp into a steady oscillation."
   caption="<a href='/projects/bns/derivations/#time-warp'>Derivation, measurement and caveats</a>. Offline and without noise; not yet tried in training." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/19_forward.png"
   alt="Slide: ways forward; better free kernels, warp then S4D, template-started filters as a reference."
   caption="Template-started filters as in Wang et al. 2020 (<a href='https://arxiv.org/abs/1909.13442'>arXiv:1909.13442</a>). Input-dependent steps (Mamba): <a href='/projects/bns/derivations/#early-mamba-step'>derivation</a>; signal per sample: <a href='/projects/bns/derivations/#proj-per-sample'>derivation</a>." %}

{% include figure.html
   src="/assets/img/bns/2026-10-14/slides/20_summary.png"
   alt="Closing slide: bells hear tones; chirps need chirp-shaped filters, or a clock that turns them into tones." %}
