---
layout: project
title: The story so far
permalink: /projects/bns/story/
eyebrow: Overview
summary: >-
  From the first chirp-mass fits on loud signals, through the discovery that
  most detected events are quiet, to the current attempt to reach them without
  heterodyning. Kept honest, including the dead ends.
next_page: /projects/bns/background/
next_title: Background, the physics the model is trying to invert
---

<ol class="chapter-list">
    <li>
    <div class="chapter-list__text">
      <p class="chapter-list__when">Dec 2025 to Jan 2026</p>
      <p class="chapter-list__title"><a href="#i-early-promise-at-high-snr">Early promise at high SNR</a></p>
      <p class="chapter-list__body">Chirp mass from pre-merger strain, on loud signals.</p>
    </div>
  </li>
    <li>
    <div class="chapter-list__text">
      <p class="chapter-list__when">To May 2026</p>
      <p class="chapter-list__title"><a href="#ii-three-experiments">Three experiments</a></p>
      <p class="chapter-list__body">Merger regression with uncertainty, pre-merger regression, a first sky-localization ring.</p>
    </div>
  </li>
    <li>
    <div class="chapter-list__text">
      <p class="chapter-list__when">May to Aug 2026</p>
      <p class="chapter-list__title"><a href="#iii-the-reality-check">The reality check</a></p>
      <p class="chapter-list__body">A correct SNR and a power-law SNR population break the merger model at low SNR.</p>
    </div>
  </li>
    <li>
    <div class="chapter-list__text">
      <p class="chapter-list__when">Summer 2026</p>
      <p class="chapter-list__title"><a href="#iv-the-heterodyning-question">The heterodyning question</a></p>
      <p class="chapter-list__body">Why existing pipelines can reach low SNR, and why we want a way around it.</p>
    </div>
  </li>
    <li>
    <div class="chapter-list__text">
      <p class="chapter-list__when">Aug to Sep 2026</p>
      <p class="chapter-list__title"><a href="#v-denoise-first">Denoise first</a></p>
      <p class="chapter-list__body">Teaching an S4D to recover the waveform, and what the loss was really measuring.</p>
    </div>
  </li>
    <li>
    <div class="chapter-list__text">
      <p class="chapter-list__when">Sep 2026</p>
      <p class="chapter-list__title"><a href="#vi-project-8-as-a-test-bed">Project 8 as a test bed</a></p>
      <p class="chapter-list__body">Trying to reproduce an internal denoise-and-regress result on electron signals.</p>
    </div>
  </li>
    <li>
    <div class="chapter-list__text">
      <p class="chapter-list__when">Oct 2026</p>
      <p class="chapter-list__title"><a href="#vii-back-to-bns">Back to BNS</a></p>
      <p class="chapter-list__body">The Project 8 recipe on BNS.</p>
    </div>
  </li>
    <li>
    <div class="chapter-list__text">
      <p class="chapter-list__when">Oct 2026, running now</p>
      <p class="chapter-list__title"><a href="#viii-a-reference-and-learned-kernels">A reference, and learned kernels</a></p>
      <p class="chapter-list__body">The matched filter as a network, one layer of learned kernels, and why S4D suits Project 8 and not BNS.</p>
    </div>
  </li>
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
  4 seconds ending at coalescence, trained with a Gaussian likelihood so it reports
  a mean and a variance. Its predicted uncertainty separated signal from
  noise-only inputs well enough to act as a crude detection statistic.
- **Chirp mass from the pre-merger.** A 2.2 M-parameter model on a window
  ending 7 seconds before merger, at SNR 20 and above.
- **Sky localization.** With two detectors, the arrival-time difference is
  (d/c) cos θ, with d/c = 10.01 ms for LIGO Hanford and Livingston and θ the
  angle between the source direction and the line joining them. Timing
  therefore fixes only θ, a ring on the sky
  ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#proj-ring)). The model regressed a unit
  vector with a cosine-similarity loss, and its predicted cos θ followed the
  truth with a wide band.

<p class="note"><strong>Caveat.</strong> In that codebase both training and
test SNR were drawn uniformly, and the SNR calculation itself was later found to
be wrong. The CERN numbers describe the model on an artificial population; they
are not a measurement of how it does on real events.</p>

## III. The reality check

After CERN the work moved into
[aframe](https://github.com/ML4GW/aframe), the ML4GW group's search pipeline.
That brought three things the standalone code lacked: an SNR computed the way
the search computes it, a test population whose SNR follows a power law, and a
sensitive-volume pipeline that compares a detector statistic directly against
the production searches. In our tests since September that population has
density proportional to SNR⁻³ between 4 and 50: flatter than the SNR⁻⁴ of
sources spread uniformly in volume, with median 5.64 and 75.5% of events
below SNR 8 ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#snr-population)).

The merger model (S4D with a ResNet and MLP head, 1.7 M parameters, about
7.5 days on an H200) was then
[tested both ways]({{ '/projects/bns/updates/2026-07-30-reality-check/' | relative_url }}).
On a uniform-SNR test set it was nearly perfect. On the power-law test set the
estimate collapsed toward the average chirp mass for most events, the
uncertainty-based detection AUC fell from 0.96 to 0.66, and the sensitive
volume came out far below the matched-filter pipelines at every mass tested.
The July update gives no ratio. The joint model measured in October with the
same score, −σ, which the
[7 October update]({{ '/projects/bns/updates/2026-10-07-why-denoising-does-not-detect/' | relative_url }})
places about where the July model stood, reached 1.3 to 6.2% of MBTA's
sensitive volume for four equal-mass systems, with MBTA's volumes from the
GWTC-3 search sensitivity release
([Zenodo 7890437](https://zenodo.org/records/7890437)). A pure S4D classifier
trained for detection did no better.

Through the summer we tried to recover sensitive volume with the inverse
uncertainty as a statistic and with plain classifiers, alongside LinOSS
variants, group norm and longer pre-merger windows. None of it closed the gap.
The difficulty was not the architecture. It was the SNR.

## IV. The heterodyning question

The machine-learning BNS pipelines that do reach low SNR, DINGO-BNS (Dax et
al. 2025, [arXiv:2407.09602](https://arxiv.org/abs/2407.09602)) and the
AFRAME BNS search we contributed to (Gupta et al. 2026,
[arXiv:2607.01372](https://arxiv.org/abs/2607.01372)), both **heterodyne**:
they remove the leading-order inspiral phase for an assumed chirp mass, so
what reaches the network is close to stationary
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#proj-heterodyne)). DINGO-BNS takes the chirp
mass from a search trigger or a scan over its prior. The AFRAME BNS search
heterodynes at 100 chirp masses from 1 to 2.5 M☉ and keeps the 10 channels
that respond most
([5 October update]({{ '/projects/bns/updates/2026-10-05-window-bound-and-prior-conditioning/' | relative_url }})).
In that search, heterodyning is what lets the network built for short binary
black hole signals handle BNS, and it reports sensitivity comparable to the
matched-filter pipelines at lower computational and latency cost (Gupta et al.
2026).

That leaves a circle. Heterodyning needs a chirp mass close to the true one,
given or found on a grid; a regression model that could estimate it at low SNR
from the raw chirp would need neither. Breaking into that circle, or showing it
cannot be done without heterodyning, is the question the rest of this project
works on.

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
by a factor of 2,255 to 2,406 during training.

With the loss repaired, the
[denoiser scans]({{ '/projects/bns/updates/2026-09-23-denoiser-scans/' | relative_url }})
reached an overlap of 0.79 to 0.80 with the true waveform when trained and
validated on SNR uniform on 4 to 100, and 0.89 to 0.90 for a 16-second
pre-merger window. Heterodyning the pre-merger input with the true chirp mass
raised that to 0.917. That is a real but modest gain, and it still needs the
chirp mass. Trained jointly with a
chirp-mass regressor, the denoiser put 71% of validation events within 2%
when SNR is uniform. On the power-law population its overlap is only about
0.18, and the [joint model's test]({{ '/projects/bns/updates/2026-09-29-den-reg-and-project-8/' | relative_url }})
reproduces the old picture: excellent above SNR 16, close to the prior below 8.

## VI. Project 8 as a test bed

Project 8 measures the energy of single electrons from the faint cyclotron
radiation they emit (Asner et al. 2015,
[arXiv:1408.5362](https://arxiv.org/abs/1408.5362)); our data are simulated
signals in a cavity. Internal Project 8 results show an S4D denoiser trained
jointly with an energy regressor recovering a sharp core of events, selected
by the model's own uncertainty, nearly two orders of magnitude sharper than
the overall spread. If that
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
spectrum is constrained to a smooth curve. Its successor, with shape and
amplitude terms in the denoiser loss and trained from SNR 8, finished 800
epochs on 11 October: better within 1% at SNR 8 to 16 than at epoch 339,
worse above SNR 25, and within 1 to 2 points of it below SNR 8
([14 October]({{ '/projects/bns/updates/2026-10-14-den-reg-final/' | relative_url }})).

## VIII. A reference, and learned kernels

To see what the data allows, I built the matched filter as a network
([12 October]({{ '/projects/bns/updates/2026-10-12-template-bank-network/' | relative_url }})):
703 waveform templates and no training put 95 to 96% of events at SNR 8 to 12
within 1% of the true chirp mass, against 17 to 28% for the joint model, and
with a χ² test its sensitive volume is 1.9 to 8.5 times the final joint
model's ([14 October]({{ '/projects/bns/updates/2026-10-14-den-reg-final/' | relative_url }})).
It needs a template bank, so it is a reference, not the goal.

Without templates, one layer of 256 learned 4 s kernels taught itself
chirp-shaped filters and puts 2.6 to 2.9 times as many events at SNR 8 to 12
within 1% as the final joint model
([13 October]({{ '/projects/bns/updates/2026-10-13-learned-long-kernels/' | relative_url }})).
On the clean signal alone the same kind of layer reaches 99.7% within 1%,
a plain S4D 54.0%
([14 October]({{ '/projects/bns/updates/2026-10-14-signal-only-test/' | relative_url }})).
The reason is written up as a
[major finding]({{ '/projects/bns/updates/2026-10-14-s4d-project-8-vs-bns/' | relative_url }}):
an S4D layer filters with tones at fixed frequencies, which suit Project 8's
nearly constant tones and not a chirp.

### What comes next

- **Make the chirp look like a tone** before an S4D sees it: heterodyne
  with a grid of chirp masses, or bootstrap (estimate the chirp mass,
  heterodyne with it, re-estimate).
- **Learned kernels that are chirps:** the free-kernel network at 2048 Hz and
  trained from SNR 4 (running), with a χ² test and a detection score.
- **Layers whose frequency follows the input,** such as Mamba with a complex
  state, or a learned warp of the time axis.
- **Sky localization** with three detectors, and before the merger, once the
  low-SNR question is settled.
