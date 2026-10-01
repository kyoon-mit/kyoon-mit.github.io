---
layout: project
title: The story so far
permalink: /projects/bns/story/
eyebrow: Overview
summary: >-
  From the first chirp-mass fits on loud signals, through the discovery that
  real events are mostly quiet, to the current attempt to reach them without
  heterodyning. Kept honest, including the dead ends.
next_page: /projects/bns/background/
next_title: Background, the physics the model is trying to invert
---

<ol class="chapter-list">
  <li><span class="chapter-list__title"><a href="#i-early-promise-at-high-snr">Early promise at high SNR</a></span><span class="chapter-list__body">Dec 2025 to Jan 2026. Chirp mass from pre-merger strain, on loud signals.</span></li>
  <li><span class="chapter-list__title"><a href="#ii-three-experiments">Three experiments</a></span><span class="chapter-list__body">To May 2026. Merger regression with uncertainty, pre-merger regression, a first sky-localization ring.</span></li>
  <li><span class="chapter-list__title"><a href="#iii-the-reality-check">The reality check</a></span><span class="chapter-list__body">May to Aug 2026. A correct SNR and a realistic population break the merger model at low SNR.</span></li>
  <li><span class="chapter-list__title"><a href="#iv-the-heterodyning-question">The heterodyning question</a></span><span class="chapter-list__body">Summer 2026. Why existing pipelines can reach low SNR, and why we want a way around it.</span></li>
  <li><span class="chapter-list__title"><a href="#v-denoise-first">Denoise first</a></span><span class="chapter-list__body">Aug to Sep 2026. Teaching an S4D to recover the waveform, and what the loss was really measuring.</span></li>
  <li><span class="chapter-list__title"><a href="#vi-project-8-as-a-test-bed">Project 8 as a test bed</a></span><span class="chapter-list__body">Sep 2026. Trying to reproduce a striking denoise-and-regress result on electron chirps.</span></li>
  <li><span class="chapter-list__title"><a href="#vii-back-to-bns">Back to BNS</a></span><span class="chapter-list__body">Oct 2026, running now. The Project 8 recipe on BNS.</span></li>
</ol>

## I. Early promise at high SNR

The first models were trained in a standalone codebase. An S4D of about
1.3 M parameters (model dimension 256, 8 layers) read 55 to 56 seconds of strain
ending 8 seconds before merger, at 216 Hz, and regressed the chirp mass
directly. On signals with SNR 20 to 40 it worked well. A follow-up compared
pre-training on one SNR band and fine-tuning on another against training from
scratch.

Those runs are in the
[December 2025]({{ '/projects/bns/updates/2025-12-23-regression-snr-20-30/' | relative_url }})
and
[January 2026]({{ '/projects/bns/updates/2026-01-02-transfer-learning-snr-30-40/' | relative_url }})
updates. They showed the idea was not crazy. They did not yet ask how the model
does on the signals the detectors actually see.

## II. Three experiments

By May 2026 the work had grown into three experiments, presented at the
[AI for Gravitational Waves workshop at CERN]({{ '/projects/bns/updates/2026-05-07-cern-three-experiments/' | relative_url }}):

- **Chirp mass and its uncertainty from the merger.** A 70K-parameter S4D on
  4 seconds around coalescence, trained with a Gaussian likelihood so it reports
  a mean and a variance. Its predicted uncertainty separated signal from
  noise-only inputs well enough to act as a crude detection statistic.
- **Chirp mass from the pre-merger.** A 2.2 M-parameter model on a window
  ending 7 seconds before merger, at SNR 20 and above.
- **Sky localization.** Two detectors only constrain a ring on the sky, so the
  model regressed the cosine of the angle to the detector baseline, with a
  cosine-similarity loss. The ring was recovered.

<p class="note"><strong>Caveat.</strong> In that codebase both training and
test SNR were drawn uniformly, and the SNR calculation itself was later found to
be wrong. The CERN numbers describe the model on an artificial population; they
are not a measurement of how it does on real events.</p>

## III. The reality check

After CERN the work moved into
[aframe](https://github.com/ML4GW/aframe), the ML4GW group's search pipeline.
That brought three things the standalone code lacked: an SNR computed the way
the search computes it, a test population whose SNR follows a power law the
way real events do, and a sensitive-volume pipeline that compares a detector
statistic directly against the production searches.

The merger model (S4D with a ResNet and MLP head, 1.7 M parameters, about
7.5 days on an H200) was then
[tested both ways]({{ '/projects/bns/updates/2026-07-30-reality-check/' | relative_url }}).
On a uniform-SNR test set it was nearly perfect. On the power-law test set the
estimate collapsed toward the average chirp mass for most events, the
uncertainty-based detection AUC fell from 0.96 to 0.66, and the sensitive
volume came out roughly an order of magnitude below the matched-filter
pipelines. A pure S4D classifier trained for detection did no better.

Through the summer we tried to recover sensitive volume with the inverse
uncertainty as a statistic and with plain classifiers, alongside LinOSS
variants, group norm and longer pre-merger windows. None of it closed the gap.
The difficulty was not the architecture. It was the SNR.

## IV. The heterodyning question

The machine-learning BNS pipelines that do reach low SNR, DINGO-BNS and the
AFRAME BNS search we contributed to
([arXiv:2607.01372](https://arxiv.org/abs/2607.01372)), both **heterodyne**:
they remove the inspiral phase using a prior chirp mass, so what reaches the
network is close to stationary. Heterodyning is what makes the quiet events
reachable, and the network's clearest advantage over matched filtering is
computational cost.

That leaves a circle. Heterodyning needs a chirp mass; a regression model that
could supply one at low SNR would not need heterodyning in the first place.
Nobody we know of has done direct regression at SNR 4. Breaking into that circle,
or showing it cannot be done without heterodyning, is the question the rest of
this project works on.

## V. Denoise first

If a model cannot read the parameters out of noise directly, perhaps it can
first recover the waveform, and a regressor can read the clean waveform. From
August 2026 the work turned to an S4D **denoiser**: whitened noisy strain in,
the clean injected waveform out.

The first month went mostly into learning what the loss was measuring. A
mixture of time-domain and log-spectrum errors produced curves that looked
healthy, but the
[outputs correlated with the target at 0.007]({{ '/projects/bns/updates/2026-09-08-denoiser-loss/' | relative_url }}):
the model emitted a short impulse at the edge of the window, whose smooth
spectrum fooled the frequency term. Fixing that meant supervising shape
and amplitude separately and logging a scale-free overlap rho on every run. It
also meant measuring the two loss terms' gradients, which were out of balance
by a factor of about 2400.

With the loss repaired, the
[denoiser scans]({{ '/projects/bns/updates/2026-09-23-denoiser-scans/' | relative_url }})
reached an overlap of about 0.8 with the true waveform when trained across SNR
4 to 100, and about 0.9 for a 16-second pre-merger window. Heterodyning the
pre-merger input with the true chirp mass raised that to 0.92. That is a real
but modest gain, and it still needs the chirp mass. Trained jointly with a
chirp-mass regressor, the denoiser put 71% of validation events within 2%
when SNR is uniform. On the power-law population its overlap is only about
0.18, and the [joint model's test]({{ '/projects/bns/updates/2026-09-29-den-reg-and-project-8/' | relative_url }})
reproduces the old picture: excellent above SNR 16, close to the prior below 8.

## VI. Project 8 as a test bed

Project 8 measures the energy of single electrons from the faint cyclotron
radiation they emit, a chirp-like radio signal in a cavity. Internal Project 8
results show an S4D denoiser trained jointly with an energy regressor
recovering a sharp core of events, selected by the model's own uncertainty,
nearly two orders of magnitude sharper than the overall spread. If that
transfers, it is exactly the low-SNR lever BNS needs.

So we built a Project 8 loader in the same codebase, trained the same joint
model, and compared. Our overall spread was comparable, but the sharp core did
not appear: our most confident events fall more than an order of magnitude
short of it, and a plain regressor without the denoiser did just as well. Tripling the recording length changed almost nothing. Two differences
remain under test: [model size, and fresh noise every step]({{ '/projects/bns/updates/2026-09-29-den-reg-and-project-8/' | relative_url }}).

## VII. Back to BNS

The [run started on 1 October 2026]({{ '/projects/bns/updates/2026-10-01-recipe-on-bns/' | relative_url }})
carries those differences to BNS together. It uses a larger model (128 wide, 6
layers in each half) and regresses mass ratio alongside chirp mass. Each
waveform is injected into four different time-shifted noise backgrounds per
batch, and 4% of samples are pure noise. Below the 20 Hz highpass, the output
spectrum is constrained to a smooth curve. Its progress is on the
[live runs]({{ '/projects/bns/live/' | relative_url }}) page.

### What comes next

- **If the recipe helps,** push it to the pre-merger window, then to a
  bootstrap: estimate the chirp mass, heterodyne with it, denoise, re-estimate.
- **If it does not,** that is itself the answer to the question in chapter IV,
  and the pre-merger and computational-cost results stand on their own.
- **Sky localization** with three detectors, and before the merger, once the
  low-SNR question is settled.
