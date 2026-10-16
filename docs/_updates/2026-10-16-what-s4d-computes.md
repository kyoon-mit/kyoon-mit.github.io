---
title: "What an S4D channel computes: resonators, delays, and a withdrawn explanation"
date: 2026-10-16
math: true
summary: >-
  One S4D channel is a set of driven, damped resonators. To be the matched
  filter of a chirp, a channel must hold each frequency until the merger,
  and that takes at least as many resonators as the integral of the delay
  over frequency: 3/8 of the chirp's cycles, 115 to 239 for the last 4 s
  before the merger, the longest stretch of chirp our windows hold.
  Fits jump at that count; the trained S4D channels hold far less. A
  pre-registered test of my explanation of why S4D works on clean signals
  was inconclusive, and I withdraw that explanation. In noise, the filters
  limit S4D, not the read-out. Two S4D runs learned to read a GPU FFT
  artefact in our long-convolution code.
---

{%- assign u = '/projects/bns/updates/' -%}
{%- assign d = '/projects/bns/derivations/' -%}

{% include notice-snr-powerlaw.html %}

## 1. One S4D channel is a set of resonators

One channel of an S4D layer (Gu, Gupta, Goel and Ré 2022,
[arXiv:2206.11893](https://arxiv.org/abs/2206.11893)) holds $N$ complex
states, all driven by the same input $u(t)$:

$$
\dot x_n = (-a_n + i\omega_n)\,x_n + u(t), \qquad
y(t) = 2\,\mathrm{Re}\sum_{n=1}^{N} C_n\,x_n(t) + D\,u(t).
$$

Each state is a damped harmonic oscillator driven by the input
([derivation]({{ d | relative_url }}#oct15-oscillator)); I call it a
resonator here, where earlier pages say tone. It has a frequency
$\omega_n/2\pi$ and a ring time $T_n = 1/a_n$, the time in which its free
swing falls by a factor $e$. The term $D\,u(t)$ is the skip term. Everything
is linear, so the channel is a filter: the input convolved with one fixed
kernel, $K(s) = \sum_n 2|C_n|\,e^{-a_n s}\cos(\omega_n s + \arg C_n)$, plus
$D\,u(t)$. Driven by a steady tone, a resonator traces the resonance curve
of a driven oscillator: it responds to a band whose full width at half power
is $1/(\pi T_n)$ in hertz, and across that band its phase turns by half a
cycle ([derivation]({{ d | relative_url }}#oct16-s4d-resonance-curve)).

<div markdown="1">

| network | kernels run at | channels | resonators per channel |
|---|---|---|---|
| S4D 64 × 32 × 4, trained on clean signals | 2048 Hz | 64 in each of 4 layers | 16 |
| S4D, state size 64, noisy | 1024 Hz | 256, one layer | 32 |
| S4D, state size 512, noisy | 1024 Hz | 256, one layer | 256 |
| S4D, state size 512, band init, noisy | 1024 Hz | 256, one layer | 256 |
| free kernels, noisy | 1024 Hz | 256, one layer | none: a free spectrum, 20 to 512 Hz |

</div>

The noisy networks are the one-layer CNN with 4 s kernels of the
[free-kernel page]({{ '/projects/bns/free-kernel/' | relative_url }}), read
through each channel's peak energy and a linear read-out; the S4D versions
build each kernel from resonators, and the two without band init start from
the standard S4D-Lin values.

## 2. The delay idea

### In everyday terms

Friends agree to meet at a restaurant at 7 pm, and they leave home at
different times. For all of them to walk in together, each trip must last
from the moment that friend leaves until 7 pm; whoever leaves first needs
the longest trip.

A matched filter does the same with the chirp. Think of the chirp as a slide
whistle: one note that rises and then stops, at the merger. The low notes
reach the detector first and the high notes last. The matched filter's
output at the merger adds up all the notes, each in step with its copy in
the template, and that is what makes the output large. To add notes that
arrived at different times, the filter must hold each note until the
merger: the low notes longest, the high notes hardly at all. At chirp mass
1.2 M☉ the note at 80 Hz must be held for 4.02 s, the note at 200 Hz for
0.349 s and the note at 400 Hz for 0.055 s
([derivation]({{ d | relative_url }}#oct16-s4d-matched-delay)). A filter that
holds each frequency for its own time is a delay line whose delay depends on
frequency. Pass the whistle through it and all its notes leave at once, as
one short click much louder than any single note. Chirp radars work this
way: "each pulse of distinct carrier frequency is made to 'wait' until the
highest-frequency component arrives, whereupon all the short pulses emerge
simultaneously" (Klauder, Price, Darlington and Albersheim 1960, *Bell
System Technical Journal* 39, 745, p. 750,
[doi:10.1002/j.1538-7305.1960.tb03942.x](https://doi.org/10.1002/j.1538-7305.1960.tb03942.x)).

A resonator can hold a note: like a bell, it keeps ringing after the drive
stops, and the centre of a burst at its own frequency comes out exactly one
ring time late. Resonators tuned along the chirp, each ringing as long as its
note must be held, can act as the delay line.

Two things make this costly. A resonator that rings long listens to a narrow
band: ring time times width at half power is $1/\pi$. Holding the 80 Hz note
for 4.02 s takes a resonator 0.079 Hz wide; holding the 400 Hz note for
0.055 s, one 5.79 Hz wide. So the low part of the chirp needs many narrow
resonators, the high part a few broad ones. And ringing fades: a resonator
that rings much shorter than the time left until the merger has lost its
note by then. It can only tell when the chirp passed its frequency, like one
row of a spectrogram.

### The math

For a whitened template $h(t)$ (the analytic signal) with merger at $t_c$,
the matched filter's kernel is $K(s) = \overline{h(t_c - s)}$. A filter's
group delay, $\tau_g(f) = -\frac{1}{2\pi}\frac{d\theta}{df}$ for the phase
$\theta$ of its transfer function, is how late the envelope of a narrow-band
burst at $f$ comes out. In the stationary-phase approximation the matched
filter has

$$
\tau_g(f) = \tau(f) = \frac{5}{256}\left(\frac{G\mathcal M}{c^3}\right)^{-5/3}(\pi f)^{-8/3},
$$

the leading-order time from the chirp passing $f$ to the merger
([derivation]({{ d | relative_url }}#oct16-s4d-matched-delay)). One
resonance has group delay $a/\big(a^2 + (\omega - \omega_n)^2\big)$: the ring
time at its centre, and an area of $\pi$, half a cycle of phase, over all
frequencies ([derivation]({{ d | relative_url }}#oct16-s4d-ring-delay)).

Integrating a filter's group delay over frequency gives the total phase it
turns, so the matched filter must turn $\int\tau\,df$ cycles across a band.
One resonator turns at most one cycle: half from its own resonance, and at
most another half from one of the channel's zeros (complex frequencies where
its response vanishes, placed by the weights). So a channel needs

$$
N \ge \int_{\rm band}\tau(f)\,df
$$

resonators to be the chirp's matched filter over a band
([derivation]({{ d | relative_url }}#oct16-s4d-phase-limit)). For a
leading-order chirp this is exactly 3/8 of its cycles
([derivation]({{ d | relative_url }}#oct16-s4d-three-eighths)). In our 4 s
windows the merger falls 3.5 to 4 s after the first sample
([derivation]({{ d | relative_url }}#oct16-merger-position)), so a window
holds the last 3.5 to 4 s of the chirp. A channel's kernel is the same in
every window, so to be the matched filter in all of them it must cover the
longest case, the last 4 s:

<div markdown="1">

| chirp mass | frequency 4 s before merger | cycles | $\int\tau\,df$: fewest resonators |
|---|---|---|---|
| 0.85 M☉ | 99.41 Hz | 636.2 | 238.6 |
| 1.2 M☉ | 80.14 Hz | 512.9 | 192.3 |
| 1.8 M☉ | 62.20 Hz | 398.1 | 149.3 |
| 2.75 M☉ | 47.72 Hz | 305.4 | 114.5 |

</div>

One channel needs at least 115 to 239 resonators over our range of chirp
masses (the chirp of a window whose merger falls 3.5 s in would need at
least 106 to 220 on its own); the clean network has 16 per channel, the
noisy ones 32 or 256.
Fourier tones count differently: each covers a fixed 0.25 Hz of the 4 s
window, so their number grows with the bandwidth, not with the delay. The
proof covers a channel in continuous time with its full kernel; for the
sampled kernel cut at 4 s, the fits below are the test.

### What the fits show

Each fit finds a channel of $N$ resonators close to the matched-filter kernel
of one whitened chirp; the match is the fraction of the matched filter's SNR
it keeps ([methods]({{ d | relative_url }}#oct16-s4d-fits)).

- **The match jumps at the count.** One resonator per band of equal
  $\int\tau\,df$, ring time $\tau(f)$, only the weights solved: the match
  jumps from 0.46 to 0.48 at 0.81 to 0.98 times $\int\tau\,df$ to 0.86 to
  0.93 at 1.01 to 1.23 times it, counting the resonators on the dominant sign
  of frequency (1.2, 1.5 and 2.0 M☉; figure 1). The 1.0 M☉
  source is seen nearly edge-on, so 39% of its kernel's energy lies at
  negative frequencies and both signs must be covered.
- **The old ceiling was an artefact of our fitting.** The
  [earlier tone fits]({{ d | relative_url }}#early-tone-fit) stopped at 0.88
  to 0.92 even with 2,048 resonators, because our code made each slightly
  growing pole decay by reflecting it ($z \to 1/\bar z$), which changes its
  shape. Clipping those poles to $|z| = 1$ instead gives 0.933 to 0.958, and
  the layout along the chirp reaches 0.99 with 448 resonators at 1.2 and
  1.5 M☉, 320 at 2.0 M☉ and 896 at 1.0 M☉ (figure 2).
- **32 resonators keep 0.43 to 0.56.** With all parameters fitted and the
  result required to hold in float32 (the precision S4D computes in), one
  channel of 32 keeps 0.43, 0.48 and 0.56 of the SNR at 1.2, 1.5 and
  2.0 M☉ (0.29 at the edge-on 1.0 M☉), not the 0.25 to 0.33 of the fits on
  the [14 October page]({{ u | append: '2026-10-14-s4d-project-8-vs-bns/' | relative_url }}).
  These are values good layouts reach, not limits. With 256 resonators, fits
  keep 0.942 to 0.992 over 0.85 to 2.75 M☉.

{% include figure.html
   src="/assets/img/bns/2026-10-16/match_vs_resonator_count.png"
   alt="Match against the number of resonators divided by the integral of tau df, for chirp masses 1.0, 1.2, 1.5 and 2.0 solar masses; the 1.2, 1.5 and 2.0 curves jump from below 0.5 to above 0.85 as the ratio passes 1; the 1.0 curve, counted over both signs of frequency, jumps from 0.50 to 0.78 near 1 and reaches 0.97 at 1.6"
   label="Figure 1. The match jumps at the count"
   caption="Resonators laid along the chirp, one per band of equal ∫τ df, ring time τ(f), only the weights solved (the figure's 'no fit'), evaluated in float32. Horizontal axis: the number of resonators over ∫τ df on the dominant sign of frequency. Left: match; right: 1 − match. For 1.0 M☉ (dashed, open circles) the count is summed over both signs of frequency." %}

{% include figure.html
   src="/assets/img/bns/2026-10-16/match_vs_resonators_all_fits.png"
   alt="Match (top row) and 1 − match (bottom row, log scale) against the number of resonators for every fitting method, at chirp masses 1.0, 1.2, 1.5 and 2.0 solar masses"
   label="Figure 2. Every fit, four chirp masses"
   caption="Top row: match; bottom row: 1 − match. Grey dashed lines: the earlier matrix-pencil fits, with growing resonators reflected (open squares; they level off at 0.88 to 0.92) or clipped to |z| = 1 and not refitted (filled triangles). Grey dash-dot line, open triangles: the same fits with growing resonators allowed, not usable in S4D. Dotted line, diamonds: the strongest Fourier tones (the figure's 'Fourier components'). Thin dark line, small dots: resonators along the chirp, only the weights solved (figure 1). Thick navy line (the figure's 'optimized decaying resonators'): all parameters fitted by VarPro from three fixed starts (the two matrix-pencil fits and the layout along the chirp), the best result that holds in float32. Navy stars: the same from 8 to 24 random starts. Open navy circles: the same fits in float64 alone; above the thick line they do not hold in float32 and are not usable in S4D. Vertical lines: 32 resonators, and ∫τ df over the dominant sign of frequency." %}

## 3. What the trained S4D channels are

For each trained channel I computed its match to 235 whitened templates
(above 20 Hz), the best match of one resonator alone in its band, and the
slope of its group delay against the chirp's $\tau(f)$: 1 if it delays each
frequency as the matched filter does, 0 if it delays none ([methods]({{ d | relative_url }}#oct16-s4d-channel-analysis)).

**The clean network's first layer holds no part of a delay line.** At the
epoch-69 checkpoint, used for every test below (epoch 135 gives the same
picture), 671 of the layer's 1,024 resonators lie between 20 and 1024 Hz,
with short rings: median 5.7 ms, 95th percentile 0.25 s (figure 3). On
1,000 clean test windows the best match per channel has a median of 0.090
and a maximum of 0.204, while one resonator alone reaches 0.20 to 0.32 at
60 to 400 Hz: no channel adds the chirp in step better than one resonator
does. The slope has a median of 0.000. The channels are broadband, and the
skip term is large ($D^2/\lVert K\rVert^2$ has a median of 0.72), so they
are not narrow spectrogram rows either. Layers 2 to 4 were not analysed; a
GELU passes the part of each output that is linear in the input with gain
1/2 ([derivation]({{ d | relative_url }}#oct16-s4d-gelu-linear)), so later
layers could still add first-layer outputs in step.

**Each noisy network learned channels whose delay follows the chirp.** The
counts use my own cuts (a squared gain over one resonator of at least 2, and
a slope between 0.5 and 2), fixed after seeing the channels. Accuracies are
on the test set of section 5.

<div markdown="1">

| network (within 1%) | channels following the chirp | their match: median, max | slope, median | chirp delay across their band, median |
|---|---|---|---|---|
| S4D, 32 per channel (7.2%) | 40 | 0.35, 0.50 | 1.02 | 0.48 s |
| S4D, 256 per channel, band init (9.4%) | 39 | 0.41, 0.56 | 1.14 | 1.13 s |
| S4D, 256 per channel (21.2%) | 42 | 0.59, 0.74 | 1.06 | 1.18 s |
| free kernels (40.0%) | 115 | 0.78, 0.80 | 0.80 | 2.98 s |

</div>

Their median match orders the networks as their accuracy does. The eight
best channels of the 256-per-channel network hold 1.40 to 2.15 resonators
per unit of $\int\tau\,df$, ring times 0.65 to 1.05 $\tau$ (medians), in
line with section 2. Training moved few frequencies (at most 2.5% of
resonators by more than half the starting spacing) and many ring times; the
channels that follow the chirp are those whose step $\Delta t$ happened to
fit. Their tuning in chirp mass is broad: full width at half height 3.6% to
34% of the chirp mass for the S4D networks' five best channels, against 1.4%
to 2.0% for free kernels. A second, independent pass over the analysis, with
its own code, added a caution: the 32-per-channel network's chirp-following
channels keep only 7% to 16% of their kernel energy between 20 and 512 Hz,
and the rest lies below 20 Hz, where that network reads the artefact of
section 6.

{% include figure.html
   src="/assets/img/bns/2026-10-16/ring_time_vs_hold_time.png"
   alt="Ring time of each resonator between 20 Hz and the Nyquist frequency against the time before merger at its frequency for chirp mass 1.2 solar masses, four S4D networks, with lines where ring time equals tau for chirp masses 0.85, 1.2 and 2.75 solar masses"
   label="Figure 3. Ring time against time before merger"
   caption="Each dot is one resonator between 20 Hz and the Nyquist frequency: its ring time against τ(f) at its frequency for 1.2 M☉, shaded by its share of its channel's energy, darker for a larger share; light grey, the same network at a fresh start. Solid red line: ring time equal to τ(f) for 1.2 M☉; dashed red lines: the same for 0.85 M☉ (upper) and 2.75 M☉ (lower). Dash-dot line: the in-step time for 1.2 M☉. Dots near the solid red line could hold their note until the merger." %}

## 4. The pre-registered test on clean signals

### What I wrote down, and when

The S4D 64 × 32 × 4 trained on clean signals puts 98.3% of 4,000 clean test
windows within 1% of the true chirp mass; I had explained this as reading
the chirp like a spectrogram. Before any test ran, I wrote the claim, three
tests and the rules for reading them into a file, time-stamped 15 October
2026, 21:08:08 EDT, with sha256
`52761cf19dc7ae19ddfc606e22149e9bb8a4abd0fca9d065212704eb926c2b52`
(checked before and after the tests, and again by the second pass). The
claim, in the file's words: the trained S4D "reads chirp mass like a
spectrogram: each first-layer resonator responds when the chirp passes its
frequency, and the pattern of those local responses (frequency and sweep
rate) fixes the chirp mass. It does NOT add the whole chirp in step (no
long-range phase coherence)." The tests, verbatim (the file also holds a
title line and the names of the reference runs):

```text
H_local (my claim) versus H_global (the alternative: the channels act as long in-step partial templates).

T4  Peak times of first-layer channels. For every first-layer channel whose dominant resonance lies in 20-150 Hz,
    find the time of the peak of its output envelope on clean whitened chirps (before any nonlinearity).
    H_local: peak time follows the time the chirp passes the channel's frequency (rank correlation > 0.7 across
             channels, peaks spread over seconds).
    H_global: peaks cluster within 0.1 s of the merger for most such channels.
T2  Shuffle 0.5 s segments (8 segments, tapered, random order). Coherent match of the shuffled signal with its
    own template must fall below 0.5 (check that the manipulation really breaks in-step structure).
    H_local: S4D within-1% falls by at most 30% of its clean value.  H_global: falls by at least 70%.
T3  Random constant phase per 0.5 s segment (analytic signal times exp(i phi_k), tapered). Same check and the same
    thresholds as T2.
Refutation: if T2 and T3 both drop S4D by >= 70% and T4 shows merger-clustered peaks, my claim is wrong.
Mixed results (30-70% drops, or T4 between) are reported as inconclusive, not as support.
```

Details the file left open (the taper, redraws, a taper-only control) were
fixed in a second file before any altered window existed; none changes a
verdict. The network is the epoch-69 checkpoint, with epoch 81 as a check
(the plan named epoch 66, which training had already replaced).

### Result

Brackets are 95% bootstrap intervals over windows.

<div markdown="1">

| test | clean S4D, epoch 69 | epoch 81 | verdict by the written rule |
|---|---|---|---|
| T2, shuffle eight 0.5 s pieces | within 1% from 98.3% to 1.95%: a drop of 98.0% [97.6, 98.4] | 98.0% | the alternative's answer, not counted: the taper alone drops it by 67.4% |
| T3, random phase per 0.5 s piece | 98.3% to 31.6%: a drop of 67.8% [66.4, 69.4] | 68.5% | inconclusive (between 30% and 70%) |
| T4, peak times of the 28 channels at 20 to 150 Hz | rank correlation with frequency: median −0.27; 21 of 28 peak within 0.1 s of the merger | −0.18; 19 of 26 | the alternative's answer |
| overall | refutation needs both drops at 70% or more | the same | **inconclusive** |

</div>

By the written rules my claim is not refuted, and nothing supports it: two
of the three tests gave the alternative's answer, and T3 fell 2.2 points
short of the refutation threshold.

### Why these tests could not decide

The same tests on references, with no prediction made for them, show three
faults in the design:

1. **T2 calls a coherent filter local.** A template bank adds the chirp in
   step by construction, yet after shuffling it keeps 74.6% within 1%,
   because one 0.5 s piece of chirp, matched at its best time shift, mostly
   fixes the chirp mass. By T2's rule the bank reads locally.
2. **T4's sign of in-step adding is what any short filter gives.** The
   whitened chirp's own envelope peaks within 0.1 s of the merger in every
   window, because the chirp is loudest there. 17 of the 21 S4D channels that
   peak at the merger are dominated by the skip term or by a resonance
   ringing under 1 ms. And in 68% of window and channel pairs the chirp never
   passes the channel's frequency inside the window.
3. **The taper alone breaks the clean S4D.** The ramps at the ends of every
   piece, with nothing else changed, take it from 98.3% to 32.1% within 1%.

### Found afterwards: the chirp's switch-on at the first sample

None of this was pre-registered. The second pass reproduced it with its own
code and random draws, on the checkpoints of epochs 69, 81 and 135.

<div markdown="1">

| change to each clean window | S4D epoch 69 | epoch 135 | free-kernel CNN |
|---|---|---|---|
| none | 98.3% | 99.0% | 99.7% |
| 31 ms ramp at the window start | 32.6% | 40.2% | 99.65% |
| first 31 ms set to zero | 4.5% | 5.5% | 99.6% |
| whole window 31 ms earlier | 98.35% | 99.0% | 99.7% |
| 31 ms ramp at the window end | 98.0% | 98.9% | 99.4% |

</div>

The window cuts the chirp, so in a clean window the chirp switches on at
full amplitude at the first sample. Moving the whole window 31 ms earlier is
harmless; setting the first 31 ms to zero, which moves the switch-on to
sample 64, drops the network to 4.5% and pulls its estimates toward the
middle of the mass range. A network made only of time-invariant filters and
a maximum over time would score those two inputs alike, since one is the
other shifted by 31 ms. Its rough estimate does not need the switch-on
(under the start ramp, 99.9% are still within 5%). Why it depends on it is
not known, and whether noise, which switches on at the same sample, leaves
it usable was not tested.

With the window edges left alone, a random phase per 0.5 s piece costs the
clean S4D 3.8% of its control (1.1% with 0.25 s pieces), against 50.7% for
the bank and 41.6% to 45.9% for the free-kernel CNN: it does not use phase
coherence across 0.25 to 0.5 s.
Shuffling the pieces takes it to 1.6%: it uses their order.

### My spectrogram explanation is withdrawn

The first layer's channels are broadband and dominated by the skip term,
and their peaks do not follow the chirp's passing (correlation −0.27), so
"each first-layer resonator responds when the chirp passes its frequency" is
not supported, and I withdraw the spectrogram explanation. What held is
narrower: the first layer adds nothing in step, and, found afterwards, the
network uses no phase coherence across 0.25 to 0.5 s. The
[15 October lecture]({{ u | append: '2026-10-15-oscillators-and-chirps/' | relative_url }})
set the clean test aside because "the chirp mass can be read from any few
cycles". That is true of the physics
([derivation]({{ d | relative_url }}#late-chirp-rate)), but it is not shown
to be what this network does, and its 1% precision rests on the window's
first sample.

## 5. In noise, the filters limit S4D, not the read-out

The test set has 20,000 windows made the way the training pipeline makes its
validation windows, with SNR drawn from a power law of index −3 between 4
and 100 (75.69% below SNR 8, against 75.1% for the population;
[derivation]({{ d | relative_url }}#snr-population)). The runs' best logged
validation values are 1.1 to 2.4 points higher, being the best of many
epochs.

I trained fresh read-outs on each network's 256 channel outputs, on 512,000
new windows from waveforms not in the test set. Within 1% on the test set:

<div markdown="1">

| network | own read-out | fresh linear | fresh MLP |
|---|---|---|---|
| S4D, 32 per channel | 7.2% | 7.3% | 7.9% |
| S4D, 256 per channel, band init | 9.4% | 10.2% | 10.2% |
| S4D, 256 per channel | 21.2% | 21.1% | 20.3% |
| free kernels | 40.0% | 39.7% | 39.3% |
| bank of 256 templates, same ending | | 43.6% | 43.6% |

</div>

Every fresh read-out lands within 0.9 points of the network's own (paired
standard error 0.2 points). Two limits: the trained read-outs saw 6 to 14
million windows (the fresh ones' learning curves are flat from 256,000 to
512,000), and they were trained on the waveform file that holds the test
rows, which favours them. The bank (chirp masses 0.46% apart, effective spins near 0), passed
through the same energy, maximum, log and standardization, is a reference,
not a ceiling: above SNR 12 the free kernels beat it.

So the channels set the limit. The match of each network's best channel,
median over the 235 templates, is 0.37 with 32 resonators per channel, 0.43
with band init, 0.57 with 256 per channel, 0.75 for free kernels and 0.96
for the bank. These networks square each channel before combining them, so
each channel's match is what its output SNR gets
([derivation]({{ d | relative_url }}#peak-energy)). With 256 resonators the
count is not the limit: fits keep 0.94 to 0.99, the trained channels at most
0.74, and training changed ring times rather than frequencies. The broad
tuning in chirp mass limits precision at high SNR. One number per network,
the best-channel match, orders the four networks but does not predict their
accuracy: at low SNR they do better than their best channel alone would.

## 6. A GPU FFT artefact in our long-convolution code

The noisy networks halve the sample rate: the code takes the real FFT of
each 4 s window (8,192 samples at 2048 Hz), keeps the bins from 0 to 512 Hz,
and inverts them as a real signal of 4,096 samples. The last kept bin, at
512 Hz, becomes the new Nyquist bin, which for a real signal must be real,
but it comes from the middle of the old spectrum and is complex. PyTorch
documents that such an imaginary part "will be ignored", and the cuFFT
documentation calls the result for such input undefined. On the GPU, when
one call transforms 64 or more signals, the inverse real FFT adds
$-\mathrm{Im}(X_{512})/4096$ to every sample of each window and detector, a
constant offset (a DC offset). With 62 or fewer it adds nothing
([derivation]({{ d | relative_url }}#oct16-s4d-fft-offset)). Training and
validation used batches of 32 windows of two detectors, 64 signals.

The two S4D networks started from S4D-Lin learned to read this offset.
Scored without it, the 32-per-channel network falls from 7.2% to 6.15%
within 1% and the 256-per-channel network from 21.2% to 20.6%; the
32-per-channel network's channel outputs change by a median 26%. The
band-init network (9.4%) and the free kernels (40.0%) do not change. Earlier
pages' validation numbers for these runs include the offset. The clean
networks do not halve the rate and are not affected.

## 7. What is settled, what is not, and next

**Settled.** The count $\int\tau\,df$, proved in continuous time and
matched by the fits; what 32 and 256 resonators can keep; no delay line in
the clean first layer; chirp-following channels in every noisy network, and
channels, not read-outs, as their limit; an inconclusive pre-registered
verdict from tests that could not decide; and, found afterwards, the clean
S4D's dependence on the switch-on for its 1% precision, not its 5%.

**Not settled.** Why the clean S4D works: its layers 2 to 4 were not
analysed, and the switch-on dependence is unexplained. Whether its precision
means anything once noise is added. Whether S4D trained or started
differently could reach the free kernels in noise. Whether the
32-per-channel network's read-out uses its chirp-following channels or the
FFT offset.

**Next tests,** proposed and not yet decided: a new pre-registration whose
rules are first checked on references, with the bank and a known local
reader (for example a small network on spectrogram magnitudes) landing on
opposite sides of each threshold; a window-start test that ramps or cuts the
first 5 to 100 ms of the clean windows, to run first; a phase test that
leaves the window edges alone, with pieces of 0.5, 0.25 and 0.125 s; a
shuffle of only the pieces before the merger; and the kernel analysis of
layers 2 to 4.

**Corrections to earlier pages.** The 0.25 to 0.33 for 32 tones on the
[14 October page]({{ u | append: '2026-10-14-s4d-project-8-vs-bns/' | relative_url }})
and the 0.87 to 0.92 ceiling in the
[tone-fit derivation]({{ d | relative_url }}#early-tone-fit) are superseded
by section 2. The [$N^{1/4}$ derivation]({{ d | relative_url }}#semi-coherent)
lists a GELU among the steps that turn a sum into a sum of powers; that
holds only for its even part
([derivation]({{ d | relative_url }}#oct16-s4d-gelu-linear)).
