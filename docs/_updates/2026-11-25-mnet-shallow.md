---
title: "MNet-Shallow on our data, first pass: 1 to 4,096 learned templates detect nothing"
date: 2026-11-25
tags: [detection, matched-filter]
math: true
summary: >-
  Yan et al. (2022) write matched filtering over k templates as a network
  with one layer: the templates are the weights, and a maximum over them is
  the output. They call it MNet-Shallow. We trained it on our data, H1 only,
  with 1, 4, 16, 64, 256, 1,024 and 4,096 templates started from random
  numbers. Every run stayed at chance for 200 epochs: validation AUROC
  0.4997 to 0.5000, and training loss never below ln 2, the loss of always
  answering one half. A second pass will start each template from a waveform
  drawn from the same priors as our training signals. The paper's own setup
  leaves out several parts of matched filtering as searches run it.
---

{%- assign d = '/projects/bns/derivations/' -%}
{%- assign gh = 'https://github.com/kyoon-mit/aframe/blob/58a7643d/' -%}
{%- assign tree = 'https://github.com/kyoon-mit/aframe/tree/58a7643d/' -%}

Yan et al., Phys. Rev. D 105, 043006 (2022),
[arXiv:2104.03961](https://arxiv.org/abs/2104.03961), show that matched
filtering over $k$ templates $s_{\gamma_1}, \dots, s_{\gamma_k}$ is a network
with one hidden layer:

$$
\max_i \,\langle s_{\gamma_i}, x\rangle = \rho^1\,\varphi\!\left(W^1 x + b^1\right)
\qquad \text{(their Eq. 29)},
$$

where the weights $W^1$ are the $k$ templates (Eq. 27), $b^1 = 0$ (Eq. 28),
$\varphi$ is the identity (Eq. 26) and $\rho^1$ is max pooling over the $k$
outputs.
They call this network MNet-Shallow: "When these are chosen as in
(27)-(28), MNet-Shallow implements the matched filtering decision rule." It
can then be trained: "By learning the weights $W^1$ and biases $b^1$ from
examples, we can further adapt this network to implement a more general
family of decision rules, beyond matched filtering" (Section IV.B).

The code is in our aframe fork at commit 58a7643d
([arch.py]({{ gh }}projects/train/train/experimental/mf_like/arch.py),
[task.py]({{ gh }}projects/train/train/experimental/mf_like/task.py),
[configs and launch script]({{ tree }}dev/local/train/claude_tests/mf_like)):

```python
class MNetShallow(nn.Module):
    """MNet-Shallow (Yan et al. 2022, PRD 105, 043006; arXiv:2104.03961):
    max_i (<w_i, x> + b_i) over ``num_templates`` rows of W (Eq. 29).

    Args:
        d_input: samples per input segment (n).
        num_templates: rows of W (k).
        bias: whether b is a trained parameter (zero at start, Eq. 28).
    """

    def __init__(
        self, d_input: int, num_templates: int, bias: bool = False
    ) -> None:
        super().__init__()
        self._d_input = d_input
        self._num_templates = num_templates
        self._bias = bias
        self._pool = nn.MaxPool1d(kernel_size=self._num_templates)
        self._hidden_layer = nn.Linear(
            in_features=self._d_input,
            out_features=self._num_templates,
            bias=self._bias,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """(B, n) segments -> (B,) max over templates of W x + b."""
        output_layer = self._pool(self._hidden_layer(x))
        return output_layer.squeeze(-1)
```

Training flattens each whitened window to one vector and uses the logistic
loss, as the paper does (Section VI.C):

```python
class MFLikeDetector(SupervisedAframe):
    def forward(self, X: Tensor) -> Tensor:
        return self.model(X.flatten(1))

    def train_step(self, batch: tuple[Tensor, Tensor, dict]) -> Tensor:
        X, y, _ = batch
        y_hat = self(X)
        return torch.nn.functional.binary_cross_entropy_with_logits(
            y_hat, y.view_as(y_hat)
        )
```

## First pass: templates started from random numbers

What we did differently from the paper. The paper's setup is from its
Sections VI.A to VI.C; ours is from the configs linked above. The ranges of
our training signals and the learning-rate and starting-weight numbers are
printed by
[nov25_checks.py]({{ gh }}dev/analysis/claude_tests/mf_like_checks/nov25_checks.py)
([output]({{ gh }}dev/analysis/claude_tests/mf_like_checks/nov25_checks.txt),
items 3 and 4).

<div markdown="1">

| | Paper | First pass |
|---|---|---|
| Signals | binary black holes, IMRPhenomD, both masses uniform in 40 to 50 M☉, spin 0, coalescence phase 0, plus polarization only | binary neutron stars from our training waveform file: source-frame chirp mass uniform in 0.85 to 2.75 M☉, spins up to 0.4 in any direction, random phase, sky position, polarization angle and inclination, projected onto H1 |
| Noise | L1, O2 (1 to 25 August 2017), bandpass 30 to 400 Hz, whitened | H1, O3a, highpass 20 Hz, whitened with a spectrum from the 20 s before each window |
| Window | 0.3 s, 614 samples | 4 s, 8,192 samples (2,048 Hz) |
| Merger position | fixed, at 90% of the window | anywhere from 3.5 to 4.0 s into the window |
| SNR | one value per experiment: 5 or 9 | power law with index −3 from 4 to 100 |
| Templates at start | 1,000 waveforms drawn from the signal range, "subject to the same preprocessing and normalization process as done in matched filtering" | random numbers, uniform in ±1/√8192 = ±0.0110 (PyTorch `nn.Linear` default) |
| Number of templates | 1,000 | 1, 4, 16, 64, 256, 1,024 and 4,096 |
| Bias $b^1$ | learned with the weights | none |
| Optimizer | Adam, constant learning rate 10⁻⁵ | AdamW without weight decay (the same as Adam), one-cycle schedule: from 4 × 10⁻⁷ up to 10⁻⁵ over the first 11.5% of steps, then down to 4 × 10⁻¹¹ |
| Training data | 2.62 million segments; epochs not stated | 200 epochs of 782 batches of 64: 10,009,600 samples, each carrying a signal with probability one half |
| Score | false-negative against false-positive rate on 2 million test segments | AUROC up to a false-positive rate of 10⁻³, on 8,192 validation signals (SNR power law −3 from 4 to 100) |

</div>

The one-cycle numbers are PyTorch 2.10's defaults for `OneCycleLR`
(`div_factor` 25, `final_div_factor` 10⁴). The AUROC is torchmetrics'
`BinaryAUROC` with `max_fpr` = 10⁻³, which rescales the partial area so that
chance scores 0.5 and perfect separation 1 (torchmetrics 0.11.4, "McClish
correction: standardize result to be 0.5 if non-discriminant and 1 if
maximal").

Results, wandb project CLAUDE-TESTS, runs
`mnet_shallow_h1_t<N>_train_snr4_prob0.5`, read back by the same script
([output]({{ gh }}dev/analysis/claude_tests/mf_like_checks/nov25_checks.txt),
item 5):

<div markdown="1">

| Templates | Best validation AUROC (epoch) | Training loss, epoch 0 | Lowest training loss | Training loss, epoch 199 |
|---|---|---|---|---|
| 1 | 0.5000 (39) | 0.7667 | 0.6960 | 0.6975 |
| 4 | 0.4999 (0) | 0.7937 | 0.6989 | 0.7024 |
| 16 | 0.4999 (0) | 0.8978 | 0.7033 | 0.7072 |
| 64 | 0.4999 (0) | 0.9942 | 0.7152 | 0.7202 |
| 256 | 0.4999 (0) | 1.1525 | 0.7547 | 0.7674 |
| 1,024 | 0.4999 (0) | 1.2619 | 0.8604 | 0.8863 |
| 4,096 | 0.4999 (0) | 1.3468 | 1.0509 | 1.0780 |

</div>

- **No run detects anything.** The validation AUROC is 0.4997 to 0.5000 in
  all 200 epochs of every run, which is chance.
- **No run beats a constant answer.** With half the samples carrying a
  signal, answering one half for every sample gives a logistic loss of
  ln 2 = 0.6931, and no constant does better
  ([derivation]({{ d | relative_url }}#nov25-logistic-chance)). Every run
  stays above it.
- **More templates, higher loss.** The loss at every stage rises with the
  number of templates, from 0.6975 with 1 to 1.0780 with 4,096 at the last
  epoch.
- **Validation with one detector.** Aframe builds validation noise by
  sliding one detector's data against the other's (time slides): channel
  $i$ is shifted by $i$ times the slide
  ([metrics.py]({{ gh }}projects/train/train/metrics.py), `TimeSlide`). With
  H1 alone, channel 0 is never shifted, so every time slide reuses the same
  H1 data, and the noise side of the AUROC rests on less independent data than
  the 210,000 s of livetime set in the config.

## Second pass: templates started from waveforms drawn from the signal priors

Planned. Each template starts as a waveform drawn at random from our training
waveform file, so its chirp mass, spins, phase, sky position, polarization
angle and inclination follow the same priors as the training signals, not a
uniform draw in mass alone. It is projected onto H1, whitened, placed with
its merger in the 3.5 to 4.0 s range of the window and scaled to unit length,
as the paper does for its templates.

<div markdown="1">

| Templates | Best validation AUROC (epoch) | Training loss, epoch 0 | Lowest training loss | Training loss, epoch 199 |
|---|---|---|---|---|
| 1 | pending | pending | pending | pending |
| 4 | pending | pending | pending | pending |
| 16 | pending | pending | pending | pending |
| 64 | pending | pending | pending | pending |
| 256 | pending | pending | pending | pending |
| 1,024 | pending | pending | pending | pending |
| 4,096 | pending | pending | pending | pending |

</div>

## How the paper's setup differs from matched filtering in a search

The paper says its fixed-time, fully connected setup is a deliberate
simplification: "To exhibit the equivalence between matched filtering and
neural networks in the simplest possible setting, here we train our networks
on injections whose starting time is fixed, and focus on fully connected
neural networks (not enforcing convolutional structure)" (Section IV.A). Its
matched-filter baseline is built the same way: random mass pairs, templates
normalized "to equal power", and the best of 30 random draws for each
template count (Section VI.B). Searches differ in these ways. FINDCHIRP
(Allen et al., Phys. Rev. D 85, 122006 (2012),
[arXiv:gr-qc/0509116](https://arxiv.org/abs/gr-qc/0509116)) names the first
three in its Section I: "a quadrature sum of matched-filter outputs for
orthogonal-phase waveforms (thereby eliminating the unknown phase), use of
Fourier transform to efficiently apply the matched filters for different
times of arrival, and use of a bank of templates to cover the parameter
space".

1. **Phase.** A search filters with two quadratures of each template, 90°
   apart, so the result does not depend on the signal's unknown phase.
   MNet-Shallow takes one real product per template. The paper's signals all
   have coalescence phase 0, so one quadrature is enough there. When the
   signal's phase differs from the template's by $\phi$, the product is
   $\cos\phi$ times its best value: zero at 90° and negative beyond
   ([derivation]({{ d | relative_url }}#nov25-phase)).
2. **Arrival time.** A search computes the filter output at every arrival
   time at once with an FFT and keeps the peak. In the paper each template
   sits at one fixed time, and the signals do too. The paper notes that in
   deployment "the matched filtering rule is applied in a sliding fashion",
   which makes the network a convolutional one (Section IV.A).
3. **Template placement.** Search banks are placed so that every signal in
   the range has at least a chosen match with its nearest template, the
   minimal match (Owen, Phys. Rev. D 53, 6749 (1996),
   [arXiv:gr-qc/9511032](https://arxiv.org/abs/gr-qc/9511032), Section II;
   Owen and Sathyaprakash, Phys. Rev. D 60, 022002 (1999),
   [arXiv:gr-qc/9808076](https://arxiv.org/abs/gr-qc/9808076)). The paper
   draws its templates at random and says so: "although the templates are
   not chosen uniformly in actual LIGO deployment ... we make this choice
   here due to simplicity" (Section VI.A).
4. **Normalization.** A search divides each template's output by that
   template's noise-weighted norm $\sigma$, so outputs of different templates
   are SNRs on one scale (FINDCHIRP, Eqs. 4.3 and 4.4). MNet-Shallow starts
   with templates of equal power, but once $W^1$ and $b^1$ are trained the
   templates have different norms, and the maximum compares outputs on
   different scales. That is part of how it goes "beyond matched filtering".
5. **Detectors.** Searches combine two or more detectors. PyCBC keeps
   triggers whose arrival times differ by no more than "the gravitational-wave
   travel time between detectors, with an additional window to account for
   uncertainty in the measurement of the time of arrival" (Usman et al.,
   Class. Quantum Grav. 33, 215004 (2016),
   [arXiv:1508.02357](https://arxiv.org/abs/1508.02357), Section 2). The paper
   uses L1 alone.
6. **Glitches.** Searches split the template into frequency bands and test
   whether the candidate's SNR is shared among them as a chirp's would be, the
   χ² test, which separates "spurious events from the events that would be
   produced by genuine signals" (Allen, Phys. Rev. D 71, 062001 (2005),
   [arXiv:gr-qc/0405045](https://arxiv.org/abs/gr-qc/0405045)). The paper's
   output is the plain maximum.
7. **False-alarm rate.** Searches measure their background by "applying a
   time shift to the triggers from one detector relative to another", and
   PyCBC "is able to measure false-alarm rates as low as one per million
   years" (Usman et al. 2016, Section 2 and abstract). The paper's Fig. 11
   plots false-positive rates up to 0.03%, which is 600 of its 2 million test
   segments.
8. **Signal length.** The paper's black holes of 40 to 50 M☉ fit in its
   0.3 s window. A binary neutron star stays in the detectors' band for its
   last minutes, so a search's templates for it are minutes long; our 4 s
   window holds only the last 4 s.
