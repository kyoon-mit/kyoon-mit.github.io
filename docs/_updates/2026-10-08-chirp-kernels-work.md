---
title: "Chirp kernels work: matched-filter accuracy at SNR 8 to 12"
date: 2026-10-08
math: true
summary: >-
  A layer of 512 physical chirp kernels, followed by an energy, a maximum
  over time and a softmax over the kernels' chirp masses, puts 94 to 97% of
  validation events at SNR 8 to 12 within 2% in chirp mass. Our previous best
  was 16 to 29%; the matched filter gets 96 to 99%. The tests that led here,
  the architecture, and the code. Training is still running.
---

{%- assign u = '/projects/bns/updates/' -%}

{% include notice-snr-powerlaw.html %}

This follows the [chirp-kernel proposal]({{ u | append: '2026-10-07-chirp-kernels/' | relative_url }})
and the [matched-filter benchmark]({{ u | append: '2026-10-07-matched-filter-benchmark/' | relative_url }}).
Throughout, "within 2%" means the predicted chirp mass is within 2% of the
true one, and validation draws SNR with probability density proportional to
SNR⁻³ from 4 to 100. That falls more slowly than the SNR⁻⁴ of sources spread
uniformly in volume (Schutz 2011,
[arXiv:1102.5421](https://arxiv.org/abs/1102.5421)), so it has relatively
more loud events; 75.1% of its events are below SNR 8
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#snr-population)).

## The result so far

{% include figure.html
   src="/assets/img/bns/2026-10-08/ck_training.png"
   alt="Validation fraction within 1 and 2 percent in chirp mass against epoch, at SNR 8 to 12 and over all events, with the matched filter and the previous network as reference lines"
   label="Validation during training (snapshot at epoch 24 of 200)"
   caption="Left: events at SNR 8 to 12. Right: all validation events, 75.1% of which are below SNR 8. Each epoch validates on 512 windows, 96% of them with a signal; on average 68 are at SNR 8 to 12 (binomial standard deviation 7.7), so the curves are noisy. Snapshot at epoch 24; training continues." %}

<div markdown="1">

| within 2%, SNR 8 to 12 | |
|---|---|
| chirp-kernel network (validation, epochs 19 to 24) | 94 to 97% |
| matched filter with real templates (benchmark) | 96 to 99% |
| our previous best, the epoch-630 network (benchmark) | 16 to 29% |

</div>

At SNR 8 to 12 the network's validation accuracy is now close to the
matched filter's. The full test in section 4 puts it at most 3.1 points
below the matched filter from SNR 10 up, and 8 to 13 points below at SNR 8
to 10. This band decides most of how far a search can see: for sources
spread uniformly in volume, 70% of the events above SNR 8 are below SNR 12
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#snr-population)).
Before any training, the same layer already reaches 87% (test 3 below);
training adds the rest.

## 1. The tests that led here

Every test below was scored on the same SNR 8 to 12 events.

{% include figure.html
   src="/assets/img/bns/2026-10-08/ck_tests_summary.png"
   alt="Horizontal bar chart of chirp mass within 2 percent at SNR 8 to 12 for each test"
   label="What each test reached"
   caption="Chirp mass within 2% at SNR 8 to 12. Grey: tests that failed. Light blue: our previous best network. Dark blue: chirp kernels choosing the highest-energy kernel, with no training. Green: the matched filter." %}

1. **An S4D layer with an energy and a maximum (A, B, C).** In 3,000
   training steps all three learned nothing: each predicted the average
   chirp mass. With one layer, each kernel is still a sum of 32 tones (the
   proposal, section 4). In the fits we tried later, 32 tones keep at most
   25 to 33% of the matched-filter SNR of a whitened BNS chirp
   ([12 October]({{ u | append: '2026-10-12-template-bank-network/' | relative_url }}#why-the-s4d-could-not-do-this)),
   so the energy and the maximum had little to work with.
2. **Chirp kernels with a regression read-out.** A small network mapping
   the kernels' energies to a single chirp mass reached 4 to 8% (SNR 8 to 10
   and 10 to 12, power law from 4 and from 8), with 32 or with 256 kernels.
   More kernels did not help, so coverage was not the problem.
3. **The kernels on their own, no training.** On 300 noise-free signals,
   the best of 512 Newtonian kernels matches the real waveform with a median
   match of 0.80 (10 to 90%: 0.75 to 0.86), and its chirp mass is within 2%
   of the truth for all 300. On noisy windows, just picking the kernel with
   the highest energy gives **87%** within 2% at SNR 8 to 12. The information
   was in the layer all along; the regression read-out was throwing it away.
   A regression trained with squared error learns the average of the chirp
   masses that fit its input (Goodfellow, Bengio and Courville 2016, *Deep
   Learning*, section 6.2.1.2), so when the energies do not single out one
   chirp mass it answers in between, and "pick the best kernel" is not a
   smooth function it learns easily.
4. **A softmax read-out, scored by its weighted mean.** Better, but the
   weighted mean blurs the answer whenever the probability is spread over
   distant kernels.
5. **A softmax read-out, scored by its most probable kernel.** This is the
   model below. It starts at the 87% of test 3 and trains up to 94 to 97%
   in validation (epochs 19 to 24), against the matched filter's 96 to 99%
   on the benchmark.

## 2. The architecture

{% include figure.html
   src="/assets/img/bns/2026-10-08/ck_architecture.png"
   alt="Block diagram: whitened strain, convolution with 512 chirp kernels in two phases, energy summed over detectors, maximum over time, log and standardize, logits, softmax, most probable kernel's chirp mass"
   label="The chirp-kernel network"
   caption="Tensor shapes in brackets: B windows per batch, 2 detectors, 512 kernels, 8192 samples (4 s at 2048 Hz). Green boxes hold the learned parameters." %}

**Symbols.** $$x_D(t)$$ is the whitened strain of detector $$D$$ (H1 or
L1) at sample $$t$$. $$j = 1, \dots, 512$$ numbers the kernels.
$$\mathcal{M}_j$$ is kernel $$j$$'s chirp mass. $$\tau$$ is the time before
merger. $$\ell$$ is a lag in samples, and $$f_s$$ = 2048 Hz the sampling
rate.

**Step 1: the kernels.** Each kernel is a Newtonian chirp (proposal,
section 2), read backwards from its merger at lag 0, in two phases:

$$
K^{(c)}_j(\ell) = \mathcal{A}(\tau_\ell)\cos\Phi(\tau_\ell;\mathcal{M}_j), \qquad
K^{(s)}_j(\ell) = \mathcal{A}(\tau_\ell)\sin\Phi(\tau_\ell;\mathcal{M}_j), \qquad
\tau_\ell = \frac{\ell + 1}{f_s},
$$

with $$\Phi(\tau;\mathcal{M}) = -2\,(\tau c^3/5G\mathcal{M})^{5/8}$$ the
chirp phase and $$\mathcal{A}(\tau) \propto \tau^{-1/4}$$ its amplitude, both
at leading (Newtonian) order (Maggiore 2008, *Gravitational Waves*, Vol. 1,
chapter 4;
[derivation]({{ '/projects/bns/derivations/' | relative_url }}#oct7-chirp-kernels)),
limited to 20 to 800 Hz with smooth edges. Each kernel is scaled to unit
size. The 512 chirp masses start evenly spaced in $$\log\mathcal{M}$$ from
0.85 to 2.75 $$M_\odot$$, 0.230% apart, and are learned. At the same time
before merger a lighter system is at a higher frequency, and it sweeps
through each frequency more slowly (same derivation).

{% include figure.html
   src="/assets/img/bns/2026-10-08/ck_kernels.png"
   alt="Three chirp kernels at low, middle and high chirp mass over the last second before merger"
   label="Three of the 512 kernels"
   caption="The cosine phase over the last second before merger. At the same time before merger, a lighter system is at a higher frequency." %}

**Step 2: convolve.** Every detector's strain is convolved with every
kernel, both phases, using the FFT. The output at time $$t$$ is the strain
correlated with a chirp that merges at $$t$$:

$$
z^{(c)}_{j,D}(t) = \sum_{\ell} K^{(c)}_j(\ell)\, x_D(t-\ell), \qquad z^{(s)}_{j,D}(t) \text{ the same with } K^{(s)}_j .
$$

**Step 3: energy.** Square both phases, add them, and add the two
detectors. This removes the signal's unknown phase
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#peak-energy),
for a pair of kernels in quadrature):

$$
e_j(t) = \sum_{D} \Big[ z^{(c)}_{j,D}(t)^2 + z^{(s)}_{j,D}(t)^2 \Big].
$$

**Step 4: maximum over time.** $$E_j = \max_t e_j(t)$$ is kernel $$j$$'s
best match anywhere in the window. This removes the unknown merger time.
There is no average over time anywhere in the network: averaging an
oscillating output cancels it. Over the 4 s window, a component at 20 Hz or
above averages to at most 0.4% of its amplitude
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#oct7-time-average)).

{% include figure.html
   src="/assets/img/bns/2026-10-08/ck_energy_map.png"
   alt="Left: energy of every kernel against time for one event, with a bright streak at the true chirp mass near merger. Middle: each kernel's peak energy, with a sharp spike at the true chirp mass. Right: the softmax probability, concentrated at the true chirp mass"
   label="One event, through the network"
   caption="One benchmark event at SNR 10.2, true chirp mass 1.396 M☉ (dashed). Left: the energy e_j(t) of every kernel over the last 0.7 s. Middle: each kernel's maximum over time, E_j. Right: the softmax. The most probable kernel sits at 1.386 M☉, 0.7% from the truth." %}

**Step 5: logits and softmax.** Take $$\log(1 + E_j)$$, standardize it
across the 512 kernels to $$z_j$$ (subtract the mean, divide by the
standard deviation), and form one score per kernel,

$$
\text{logit}_j = s\, z_j + \sum_k W_{jk} z_k + b_j ,
$$

where $$s$$ is a learned scale (starting at 5) and $$W$$, $$b$$ a learned
correction (starting at zero). The softmax turns the scores into
probabilities $$p_j$$ over the kernels' chirp masses. The estimate is the
chirp mass of the most probable kernel, $$\mathcal{M}_{\hat\jmath}$$ with
$$\hat\jmath = \arg\max_j p_j$$.

At the start, $$W = 0$$, so the most probable kernel is simply the one with
the highest energy: the no-training 87% of test 3.

**Training.** The target is a narrow bump over the kernels, centred on the
true chirp mass $$\mathcal{M}$$, half a kernel spacing $$\delta$$ wide:

$$
q_j \propto \exp\!\Big(-\frac{(\log\mathcal{M} - \log\mathcal{M}_j)^2}{2(\delta/2)^2}\Big),
\qquad
\text{loss} = -\sum_j q_j \log p_j .
$$

Learned: the 512 kernel chirp masses, $$s$$, $$W$$ and $$b$$. Noise-only
windows carry no chirp mass and are skipped.

## 3. The code

The kernels (`train/experimental/chirp_kernel/arch.py`):

```python
TSUN = 4.925491e-6  # G * (1 solar mass) / c^3, in seconds


class ChirpKernels(nn.Module):
    def forward(self, length):
        # lag -> time before merger
        tau = (torch.arange(length) + 1) / self.sample_rate
        # chirp mass as a time, one row per kernel
        T = TSUN * self.log_mc.exp()[:, None]
        phase = -2 * (tau / (5 * T)) ** (5 / 8)
        f = (1 / (8 * math.pi)) * (5 / tau) ** (3 / 8) * T ** (-5 / 8)
        # smooth band edges keep the chirp-mass gradient well behaved
        band = (torch.sigmoid((f - self.f_low) / 2)
                * torch.sigmoid((self.f_high - f) / 20))
        amp = tau ** -0.25 * band
        kc, ks = amp * torch.cos(phase), amp * torch.sin(phase)
        norm = kc.pow(2).sum(-1, keepdim=True).sqrt()
        return kc / norm, ks / norm  # each (J, length)
```

`TSUN` is $$GM_\odot/c^3$$ with the IAU 2015 nominal solar mass parameter,
$$1.3271244 \times 10^{20}$$ m³ s⁻² (Prša et al. 2016, AJ 152, 41,
[arXiv:1605.09788](https://arxiv.org/abs/1605.09788)). The `phase` and `f`
lines are the leading-order phase and frequency
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#oct7-chirp-kernels)).

The network: convolution, energy, maximum, logits:

```python
class ChirpKernelNet(nn.Module):
    def energy_peaks(self, X):
        # X: whitened strain, (batch, detectors, length)
        length = X.shape[-1]
        kc, ks = self.kernels(length)
        n = 2 * length  # zero padding: linear, not circular, convolution
        x_f = torch.fft.rfft(X, n=n)[:, :, None]
        zc = torch.fft.irfft(x_f * torch.fft.rfft(kc, n=n), n=n)[..., :length]
        zs = torch.fft.irfft(x_f * torch.fft.rfft(ks, n=n), n=n)[..., :length]
        # energy, summed over detectors: (batch, J, length)
        energy = (zc.pow(2) + zs.pow(2)).sum(1)
        # maximum over time: (batch, J)
        return energy.amax(-1)

    def forward(self, X):
        feat = torch.log1p(self.energy_peaks(X))
        z = (feat - feat.mean(-1, keepdim=True)) / feat.std(-1, keepdim=True)
        return self.scale * z + self.correction(z)  # logits, (batch, J)
```

The loss (`train/experimental/chirp_kernel/task.py`):

```python
log_k = self.model.kernels.log_mc
spacing = (log_k[1:] - log_k[:-1]).abs().mean().detach()
width = self.hparams.label_width * spacing  # label_width = 0.5
target = torch.softmax(
    -((log_true[:, None] - log_k[None].detach()) ** 2) / (2 * width**2), -1
)
loss = -(target * torch.log_softmax(logits, -1)).sum(-1).mean()
estimate = log_k[logits.argmax(-1)].exp()
```

## 4. Test on 12,800 windows per population

The epoch-38 checkpoint (the run's best by validation), tested with the standard test step: O3b
background, half the windows with an injection, three SNR populations
(density ∝ SNR⁻³ from 4 or from 8 up to 50, and uniform from 4 to 50).
Chirp mass within 1 / 2 / 5 / 10%:

<div markdown="1">

| SNR | power law from 4 | power law from 8 | uniform 4 to 50 | previous network (epoch 630), within 2% |
|---|---|---|---|---|
| 4 to 6 | 12 / 15 / 21 / 29% | | 15 / 20 / 25 / 31% | 5% |
| 6 to 8 | 43 / 52 / 57 / 61% | | 46 / 50 / 55 / 59% | 8% |
| 8 to 10 | 80 / 87 / 89 / 91% | 77 / 86 / 89 / 91% | 80 / 86 / 88 / 89% | 15% |
| 10 to 12 | 91 / 98 / 99 / 99% | 90 / 97 / 98 / 98% | 88 / 96 / 98 / 98% | 25% |
| 12 to 16 | 93 / 99 / 99 / 100% | 92 / 99 / 99 / 99% | 90 / 97 / 99 / 99% | 56% |
| 16 to 25 | 95 / 100 / 100 / 100% | 93 / 99 / 99 / 99% | 92 / 99 / 100 / 100% | 85% |
| 25 to 50 | 89 / 97 / 98 / 98% | 93 / 99 / 100 / 100% | 90 / 98 / 99 / 99% | 92% |
| whole population, within 1 / 2% | 36 / 42% | 86 / 94% | 85 / 92% | 15% (within 2%, power law from 4) |

</div>

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-08/test_ep38/snr8_powerlaw_frac_within.png"
   alt="Fraction of events within 1, 2, 5 and 10 percent in chirp mass against SNR, power law from SNR 8"
   label="Power law from SNR 8"
   caption="Fraction within 1, 2, 5 and 10% against SNR." %}
{% include figure.html
   src="/assets/img/bns/2026-10-08/test_ep38/snr8_powerlaw_pred_vs_true.png"
   alt="Predicted against true chirp mass, power law from SNR 8"
   label="Power law from SNR 8"
   caption="Predicted against true chirp mass: median and 1-sigma band." %}
</div>

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-08/test_ep38/snr4_powerlaw_frac_within.png"
   alt="Fraction of events within 1, 2, 5 and 10 percent in chirp mass against SNR, power law from SNR 4"
   label="Power law from SNR 4"
   caption="Power law from SNR 4: 75.5% of events are below SNR 8." %}
{% include figure.html
   src="/assets/img/bns/2026-10-08/test_ep38/snr4_powerlaw_pred_vs_true.png"
   alt="Predicted against true chirp mass, power law from SNR 4"
   label="Power law from SNR 4"
   caption="Below SNR 8 many estimates fall far from the truth, widening the band." %}
</div>

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-08/test_ep38/snr4_uniform_frac_within.png"
   alt="Fraction of events within 1, 2, 5 and 10 percent in chirp mass against SNR, uniform SNR 4 to 50"
   label="Uniform SNR 4 to 50"
   caption="Fraction within 1, 2, 5 and 10% against SNR." %}
{% include figure.html
   src="/assets/img/bns/2026-10-08/test_ep38/snr4_uniform_pred_vs_true.png"
   alt="Predicted against true chirp mass, uniform SNR 4 to 50"
   label="Uniform SNR 4 to 50"
   caption="Predicted against true chirp mass: median and 1-sigma band." %}
</div>

From SNR 10 up, 96 to 100% of events are within 2%, at most 3.1 points
below the matched filter on the same populations, and 88 to 95% within 1%.
At SNR 8 to 10 the gap to the matched filter is 8 to 13 points. Against the
epoch-24 checkpoint tested the same way, within 2% changes by at most 1.6
points; within 1% moves by −0.6 to +4.0 points below SNR 25 and rises by 4
to 8 points at SNR 25 to 50 (89 to 93% against 81 to 86%). At SNR 6 to 8,
50 to 52% of events are within 2%, against 8% for the previous network.

## 5. What happened after epoch 38

Validation, 10-epoch running means:

<div markdown="1">

| epoch | SNR 8 to 12, within 1% | SNR 8 to 12, within 2% | all events, within 1% | all events, within 2% |
|---|---|---|---|---|
| 24 | 83% | 92% | 36% | 43% |
| 38 | 83% | 91% | 37% | 44% |
| 60 | 86% | 92% | 39% | 44% |
| 100 | 78% | 90% | 35% | 42% |
| 140 | 81% | 90% | 37% | 44% |
| 180 | 67% | 87% | 31% | 42% |
| 190 | 71% | 89% | 32% | 42% |

</div>

It held its level to epoch 60, then slid: within 1% at SNR 8 to 12 dropped
from 86% (epoch 60) to 67 to 71% (epochs 180 and 190), while within 2% went
only from 92% to 87 to 89%.
The fine precision is what went. It is not overfitting: every step draws
fresh injections. Two learned quantities drifted away from "the
highest-energy kernel wins":

<div markdown="1">

| | start | epoch 24 | epoch 38 | epoch 183 |
|---|---|---|---|---|
| largest gap between kernel chirp masses | 0.23% | 0.83% | 0.94% | 2.07% |
| kernels out of order | 0 | 215 | 218 | 240 |
| scale s on the energies | 5.0 | 0.52 | 0.33 | 0.18 |

</div>

- The kernels are free to move, and nothing keeps them evenly spaced. Gaps
  of up to 2.07% opened, and an event in the middle of such a gap is 1.03%
  from the nearest kernel.
- The scale on the bank's energies shrank 28 times, so the decision passed
  to the learned correction W, a blurrier mapping. Cross-entropy is lowest
  when the predicted probabilities equal the target's (Goodfellow, Bengio and
  Courville 2016, *Deep Learning*, section 3.13). Averaged over events whose
  energies look alike but whose chirp masses differ, that is a spread-out
  distribution, which a smaller s gives.

So the useful checkpoint is an early one, and the next version freezes the
kernels and keeps the bank's scale fixed. That version is training: frozen
kernels, per-detector energy maps, four S4D layers on the maps, and a
maximum over time, added to the fixed-scale bank.

## 6. Caveats

- **Small validation set.** 68 events per epoch at SNR 8 to 12 on average,
  so a fraction near 90% has a binomial standard deviation of 3.6 points
  from epoch to epoch
  ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#oct7-val-count)).
  Section 4 uses 12,800 windows per population instead.
- **Close to a learned matched filter.** The kernels are physical chirps and
  the read-out picks the best one. What training adds is the placement of
  the kernels and the correction $$W$$; the network did not discover chirps
  on its own.
- **Only chirp mass so far.** No mass ratio, no detection statistic, no sky
  position. Those are the next steps.
- **Training snapshot.** The validation curves stop at epoch 24; section 5
  covers what happened afterwards. The wandb run is
  `CLAUDE-TESTS/chirp_kernel_512_learned_mc_softmax_train_snr8_prob0.96`.
