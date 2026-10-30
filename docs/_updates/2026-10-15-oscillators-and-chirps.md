---
title: "Why one S4D channel needs at least 115 tones to follow a 4 s chirp"
date: 2026-10-15
tags: [s4d, cnn]
math: true
summary: >-
  A lecture for physicists outside machine learning, revised on 16 October.
  An S4D layer is a set of driven, damped oscillators whose frequencies are
  fixed once training is over. On clean signals every network we tried,
  S4D included, puts 99.8 to 100% of events within 1% of the true chirp mass
  once dropout is removed. In noise, with the same data and the same final
  step, single S4D layers put 6 to 24% of validation events within 1%,
  against 38 to 42% for one layer of free kernels, and the limit is in the
  S4D filters, not in the final step. The lecture also takes up the common
  questions and states what our data concede. Objections, rebuttals and a
  final verdict follow most sections.
---

{%- assign u = '/projects/bns/updates/' -%}
{%- assign d = '/projects/bns/derivations/' -%}

<div class="debate-toggles" role="group" aria-label="Show or hide the objection, rebuttal and verdict blocks">
<button type="button" class="debate-toggle debate-toggle--objection" data-kind="objection" aria-pressed="true">Objection</button>
<button type="button" class="debate-toggle debate-toggle--rebuttal" data-kind="rebuttal" aria-pressed="true">Rebuttal</button>
<button type="button" class="debate-toggle debate-toggle--verdict" data-kind="verdict" aria-pressed="true">Final verdict</button>
</div>
<p class="debate-legend">Red: objections to the section above. Green: rebuttals. Blue: the final verdict. The buttons show or hide each kind.</p>
<script src="{{ '/assets/js/debate.js' | relative_url }}" defer></script>

{% include notice-snr-powerlaw.html %}

<div class="notice" role="note" markdown="1">
<p class="notice__title">Revised 16 October 2026, after the dropout and mechanism tests</p>

Several premises of the first version were wrong, and the passages that rested
on them have been rewritten
([16 October status]({{ u | append: '2026-10-16-status-dropout-and-signal-only/' | relative_url }})).
Our clean-signal S4D networks had dropout 0.2; without it the same small S4D
puts 99.9% of clean events within 1%, so the clean test does not separate
the designs. A channel of decaying oscillators needs at least 115 to 239 of
them to be the filter of the last 4 s of one of our chirps, the longest
stretch a window holds; the 476 to 1,184 of the first
version count undamped waves that last the whole window. In noise, the S4D
filters limit the result, not the final step. Why S4D works on clean
signals is not established
([what an S4D channel computes]({{ u | append: '2026-10-16-what-s4d-computes/' | relative_url }})).
</div>

## Introduction

Suppose we have 4 s of data from the two LIGO detectors, and in it, ending
in the window's last half second (section 1), the signal of two neutron
stars spiralling into each other. The signal is weak: its SNR, defined in section 1, is
between 8 and 10. From these 4 s we want the chirp mass, the combination of
the two masses that sets how fast the signal's frequency rises, to within
1%. The target is not arbitrary: the standard method puts 94% of such events
within 1% on our own test data
([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})).

Our earlier networks were built from S4D layers, a design from machine
learning for long time series (Gu et al. 2022,
[arXiv:2206.11893](https://arxiv.org/abs/2206.11893)). In our tests on noisy
data they learned this task worse than a much simpler network whose first
layer holds 256 freely learned shapes, the free kernels of section 5. This
lecture asks why: is there a physical reason, or did we train them badly?

Part of the answer is that we trained some of them badly. Our S4D networks
for clean signals, with no detector noise, had dropout 0.2: during training
each layer switched each of its channels off at random with probability
0.2, and not at evaluation. With dropout 0 and nothing else changed, the
small S4D of section 6 puts 99.9% of clean validation events within 1%, and
on clean signals aframe's ResNet, a dilated CNN and the free kernels reach
100%, 100% and 99.8%
([16 October status]({{ u | append: '2026-10-16-status-dropout-and-signal-only/' | relative_url }})).
Without noise, every design we tried learns the task.

The claim I want to defend concerns noisy data. In our tests on real noise,
with the same data, the same training schedule and the same final step,
every network with one S4D layer that we tried put 6 to 24% of validation
events within 1% of the true chirp mass, while one layer of free kernels put
38 to 42%
([slides of 14 October]({{ u | append: '2026-10-14-slides-chirps-tones-filters/' | relative_url }})):
the best S4D layer found half as many events as the free kernels (19.1%
against 39.1%, averaged over epochs 200 to 250; section 6). The final step
is not the cause; the S4D filters are (section 6). The physics shows what
each filter has to do, and why that is hard for S4D. An S4D layer is a set of driven, damped oscillators
whose frequencies are fixed once training is over. A weak chirp can only be
found by adding its several hundred cycles in step, and an oscillator of
fixed frequency stays in step with a chirp only briefly. One channel can
still act as the chirp's filter, but only with at least 115 to 239
oscillators, each tuned to its part of the chirp and fading at the right
rate (section 4). Our channels had 32 or 256, and training did not bring
the 256 into place.

Three things are not claimed. We do not claim that S4D cannot represent a
chirp: by Fourier's theorem, enough oscillators of fixed frequency can build
any shape 4 s long, and our own fits show it
([derivation]({{ d | relative_url }}#early-tone-fit); section 4). Nor do we
claim that S4D is a poor design in general. For a steady signal, such as
the electron signals of Project 8 or the narrow lines in LIGO's own noise, a
few fixed oscillators are the right description, and S4D may well suit those
parts of our problem. Nor do we claim that a deeper or better-tuned S4D
would stay behind: that is untested. Sections 6 and 7 state the limits of
our experiments.

Sections 1 to 4 build the physics, sections 5 to 9 take up the questions a
reader is likely to ask, and section 10 sums up.

<div class="debate debate--objection" markdown="1">

**Objection.** *Re: "…an oscillator of fixed frequency stays in step with a chirp only briefly, so a chirp has to be assembled from hundreds of oscillators that agree in phase."* The free kernels are themselves built from oscillators of fixed frequency. Each is stored as its spectrum, one learned complex number for every frequency from 20 to 512 Hz in steps of 0.25 Hz, 1,968 in all ([derivation]({{ d | relative_url }}#parameters)). A free kernel is therefore a sum of 1,968 waves of fixed frequency that never fade, all starting at the present: the construction of section 4, one wave per 0.25 Hz of the band. Training did assemble chirps from these parts, since 125 of the 256 came to match a waveform at 0.5 to 0.81 ([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})). Fixed frequencies, and parts that all start at the same instant, cannot then be what separates the two designs. What differs is the number of waves per shape, 1,968 against 32 or 256, and how they are learned. The free kernels learn only the weights of waves held on an even grid, and the shape depends on those weights in proportion; S4D also learns each wave's frequency and damping and one time step per channel, on which the shape depends in a more complicated way. That is a claim about counting, and about learning, which the lecture itself calls unproven in its fourth obstacle, rather than about the physics of fixed frequencies.

</div>

<div class="debate debate--rebuttal" markdown="1">

**Rebuttal.** Agreed. Any shape 4 s long is a sum of waves of fixed frequency 0.25 Hz apart, by Fourier's theorem, and the free kernels are stored that way, so fixed frequency alone cannot separate the designs. Two things do differ: the number of waves behind each shape, 1,968 against 32 or 256 per S4D channel, and what training adjusts. In the free kernels it adjusts only weights, on which the shape depends in proportion; in S4D it also adjusts each wave's frequency and damping and one time step per channel. Free kernels stored as 4,096 time samples, with no waves in the storage, put 36.0% of validation events within 1% on average over epochs 200 to 250, against 39.1% for the spectrum storage (training logs), so the waves of the storage did not make them work. The physics says what a design must reach, a shape in step with the chirp over the whole window, not which design training brings there; the introduction should say so. One run would separate number from learning: an S4D layer started as the free kernels start, 1,968 nearly undamped waves per channel on their grid, then trained with frequencies, damping and time steps free to move. If that lowers the score, learning those numbers is the obstacle.

</div>

<div class="debate debate--verdict" markdown="1">

**Final verdict.** The measured gap stands: over epochs 200 to 250 the free kernels put 39.1% of validation events within 1% of the true chirp mass, and the four S4D variants that trained that long put 4.7 to 19.1% (training logs). The objection is right, and the rebuttal concedes it. Each of the free kernels is stored as 1,968 complex weights on a grid from 20 to 512 Hz, 0.25 Hz apart, so it is a sum of waves of fixed frequency that all start at the present, and training turned 125 of them into chirps. Fixed frequency cannot be what separates the designs. What differs is the number of waves behind each shape, 1,968 against 32 or 256 per S4D channel, and what training adjusts: in the free kernels only weights, in S4D also each wave's frequency and damping and one time step per channel. Free kernels stored as 4,096 time samples instead reached 36.0% over the same epochs, so storage as waves is not what made them work. The introduction should present the gap as measured and its cause as open. Two runs would separate number from learning: an S4D layer started on the free kernels' grid, trained with its frequencies, damping and time steps once held fixed and once free.

Ruling: the objection is upheld.

Added 16 October: the quoted sentence has been rewritten. A channel of decaying oscillators needs at least 115 to 239 of them to be the filter of the last 4 s of one of our chirps, the longest stretch a window holds (section 4), so 32 per channel is too few by number alone, while 256 is enough in principle; for the 256-oscillator layer the question is learning, and in its training the frequencies hardly moved (section 5).

</div>

## 1. The signal and the standard method

Our goal here is to set up the task and the method we compare against.
Suppose two neutron stars orbit each other closely. Gravitational radiation
carries energy away, the orbit shrinks, and the frequency of the wave rises
until the stars merge; this rising wave is the chirp. To leading order its
frequency $f$ rises at the rate

$$
\dot f = \frac{96}{5}\,\pi^{8/3}\left(\frac{G\mathcal M}{c^3}\right)^{5/3} f^{11/3},
$$

where $G$ is Newton's constant, $c$ the speed of light, and $\mathcal M =
(m_1 m_2)^{3/5}/(m_1 + m_2)^{1/5}$ the chirp mass of two stars of masses
$m_1$ and $m_2$ ([derivation]({{ d | relative_url }}#late-chirp-rate)). At a
given frequency a heavier system sweeps faster, and the frequency together
with its rate of change fixes $\mathcal M$.

Our windows are 4 s long, and the merger falls in their last half second,
3.5 to 4 s after the window starts
([derivation]({{ d | relative_url }}#oct16-merger-position)). Unless stated
otherwise, the numbers in this lecture are for the longest case, the last
4 s before the merger. Over the chirp masses we consider, 0.85 to 2.75 M☉
(M☉ is the mass of the Sun), the wave then enters the window at 48 to 99 Hz
and makes 305 to 636 cycles before the merger; at 1.2 M☉ it enters at 80 Hz
and makes 513 cycles ([derivation]({{ d | relative_url }}#cycles)). When the
merger falls 3.5 s into the window, the chirp in it is shorter, down to 281
cycles at 2.75 M☉ ([derivation]({{ d | relative_url }}#oct15-het-grid)).
For two chirps aligned at the
merger, a 1% change in chirp mass changes the phase accumulated over the
last 4 s by 12 to 25 radians, which is 1.9 to 3.9 cycles
([derivation]({{ d | relative_url }}#ck-chirp)). The chirp mass is written
into the slow drift of hundreds of cycles across the whole window.

The data are whitened first: rescaled, frequency by frequency, so that the
detector noise is equally strong at all frequencies; for stationary Gaussian
noise its samples are then independent, each with a spread (standard
deviation) of 1. In whitened data
the strength of a signal $s(t)$ is its SNR, the signal-to-noise ratio,

$$
\rho = \Big(\sum_t s(t)^2\Big)^{1/2},
$$

the square root of the summed squared signal over all samples $t$. It is the
largest value that a comparison of the data with the expected wave can
produce, in units of the spread that noise alone produces. At SNR 8 the
signal in a single sample is, on average, 0.088 of the noise's spread
([derivation]({{ d | relative_url }}#proj-per-sample)), so no single sample,
and no single cycle, shows it.

The standard method, matched filtering, compares the data with a
precomputed copy of the expected wave. Let $h(\ell)$ be that copy read
backwards from the merger, so that $h(0)$ is the wave at the merger and
$h(\ell)$ the wave $\ell$ samples earlier, scaled so that $\sum_\ell
h(\ell)^2 = 1$. The comparison at time $t$ is

$$
z(t) = \sum_\ell h(\ell)\,x(t - \ell),
$$

where $x$ is the whitened data: each sample of the recent past is multiplied
by the copy at the same distance back, and the products are added over the
whole window. If the copy has the signal's shape and $t$ is the merger, the
signal's part of $z$ is exactly $\rho$, while the noise adds a random number
of spread 1 ([derivation]({{ d | relative_url }}#peak-energy)). Since the
phase of the arriving signal is not known, the method uses a cosine-like and
a sine-like copy, adds the squares of the two comparisons (we call this sum
the energy), and keeps the largest value over time. It does this for copies
at many chirp masses, a template bank, and in effect the chirp mass whose
copies respond most strongly is the estimate
([12 October]({{ u | append: '2026-10-12-template-bank-network/' | relative_url }})).
On our test windows, with real noise from the second half of LIGO's third
observing run, it puts 94% of events at SNR 8 to 10 within 1% of the true
chirp mass
([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})).

Therefore the task is well posed: the data hold the answer to 1%, and a
known method reads it out.

## 2. Why the whole wave must be added in step

Our goal here is to show that at SNR 8 the chirp can only be found by adding
all its cycles in step, and that a small, steady error in phase destroys
most of the sum. We show it with a picture first, and then with a formula.

Suppose the chirp makes 600 cycles in the window (ours hold 281 to 636), and
cut the comparison $z$ of section 1 into 600 pieces, one per cycle. If the
SNR is spread evenly, each piece carries $\rho/\sqrt{600}$, which at SNR 8
is 0.33 ([derivation]({{ d | relative_url }}#semi-coherent)). Draw each
piece's output as an arrow, as in a phasor diagram. The signal contributes
an arrow of length 0.33 whose direction is the phase of the copy relative to
the signal, and the noise an arrow of random direction and typical length 1.
The noise arrows add like the steps of a random walk and, after 600 steps,
have wandered $\sqrt{600} = 24.5$ step lengths. If the copy is in step with
the signal,
the signal arrows all point the same way and add to $600 \times 8/\sqrt{600} = 196$.
The ratio is $196/24.5 = 8$: adding in step gives back the full SNR
([derivation]({{ d | relative_url }}#ck-coherent)).

Now suppose the direction of each piece is lost, for example because each
piece's output is squared before the pieces are added. The signal still
raises each square, but only by $0.33^2 = 0.11$ on average, against a noise
square of mean 1 and spread $\sqrt 2$. Over 600 pieces the signal raises the
total by $\rho^2 = 64$ while the noise makes it fluctuate by $\sqrt{2 \times
600} = 34.6$, so the signal stands out by $64/34.6 = 1.85$ standard
deviations instead of 8
([derivation]({{ d | relative_url }}#oct15-phase-drift)). The SNR needed to
stand out by a given amount now grows like $N^{1/4}$ with the number of
pieces $N$; for 600 pieces, standing out by one standard deviation takes
$(2 \times 600)^{1/4} = 5.9$ times the SNR that the in-step sum needs
([derivation]({{ d | relative_url }}#semi-coherent)).

How exact must the step be? Suppose the copy drifts steadily out of step
with the signal, so that its phase error grows from zero at the first piece
to $k$ cycles at the last. Take the pieces as arrows of equal length with
phases $2\pi k x$, where $x$ runs evenly from 0 to 1. Their average is

$$
\int_0^1 e^{2\pi i k x}\,dx = e^{i\pi k}\,\frac{\sin \pi k}{\pi k},
$$

and its size, $|\sin(\pi k)/(\pi k)|$, is the fraction of the in-step sum
that survives ([derivation]({{ d | relative_url }}#oct15-phase-drift)). A
drift of a quarter cycle keeps 0.90 of the sum, half a cycle keeps 0.64, and
a whole cycle keeps nothing: the arrows bend into a full circle, and the sum
closes to zero. At SNR 8 that leaves 7.2, 5.1 and 0.

A wrong frequency produces exactly such a drift. A copy whose frequency is
off by $\delta f$ drifts by $\delta f\,T$ cycles over a time $T$; over our
4 s window, an error of 0.0625 Hz costs 10% of the sum and an error of
0.25 Hz costs all of it
([derivation]({{ d | relative_url }}#oct15-phase-drift)). The same effect
gives the standard method its precision. A copy whose chirp mass is 1% off
drifts by 1.9 to 3.9 cycles over the window, and a copy responds with less
than half of its full value to signals 0.6% below or 0.19% above its own
chirp mass ([derivation]({{ d | relative_url }}#ck-tuning)).

Therefore a method that finds a weak chirp must hold its reference in step
with the signal over the whole window, to within a fraction of a cycle at
every moment. Every design below has to be judged by whether it can do
this, and by whether it can learn to.

## 3. What an S4D layer is

Our goal here is to show that an S4D layer is, exactly, a set of driven,
damped oscillators with fixed frequencies, and that its output compares the
data with one fixed shape, as the standard method does, but with a
restricted kind of shape.

Suppose we have one complex number $x(t)$ that obeys

$$
\dot x = (-a + i\omega)\,x + u(t),
$$

with real constants $a > 0$ and $\omega$, and a real input $u(t)$: the data,
or the output of the layer before. This is one state of an S4D layer (Gu et
al. 2022, section 3, as implemented in the ml4gw library that we use). Write
$x = p + iq$ with $p$ and $q$ real. The real and imaginary
parts of the equation are

$$
\dot p = -a\,p - \omega\,q + u, \qquad \dot q = \omega\,p - a\,q .
$$

Differentiate the first, use the second to remove $\dot q$, and use the
first again to remove $q$:

$$
\ddot p + 2a\,\dot p + (a^2 + \omega^2)\,p = \dot u + a\,u
$$

([derivation]({{ d | relative_url }}#oct15-oscillator)). This is a mass on a
spring with friction and a driving force. The free motion decays at the
rate $a$ and oscillates at the angular frequency $\omega$, that is, at the
frequency $\omega/2\pi$; the natural angular frequency is $\sqrt{a^2 +
\omega^2}$, and the force is the rate of change of the input plus $a$ times
the input. One S4D state is one damped, driven oscillator.

A possible objection is that this cannot be right, since the S4D equation is
of first order and an oscillator obeys an equation of second order. This is
confusing the order of one complex equation with the order of the real
motion. One complex equation of first order is two real equations of first
order, and two real equations of first order make one of second order, as
we just saw. Hamilton's equations for a mass on a spring are the familiar
case: $\dot x = p/m$ and $\dot p = -kx$ are both of first order, and
together they are Newton's $m\ddot x = -kx$. The complex $x$ plays the part
of the phasor of an AC circuit. A later design, LinOSS, is built explicitly
"on a system of forced harmonic oscillators" (ICLR 2025,
[arXiv:2410.03943](https://arxiv.org/abs/2410.03943)); the derivation shows
that S4D's states are oscillators as well, damped ones.

What does such an oscillator do to the data? Suppose the input is one short
kick at time 0. The oscillator rings: $x(t) = e^{(-a + i\omega)t}$ for $t >
0$, a wave of angular frequency $\omega$ that fades at the rate $a$. The
equation is linear, so its response to any input is the sum of its
responses to the kicks that make up the input, each started at its own
time. An S4D channel holds several such oscillators (32 in our earlier
networks) and outputs a weighted sum of their responses,

$$
y(t) = 2\,\mathrm{Re}\sum_n C_n\,x_n(t) + D\,u(t)
= \int_0^\infty K(s)\,u(t - s)\,ds + D\,u(t),
$$

$$
K(s) = \sum_n 2|C_n|\,e^{-a_n s}\cos(\omega_n s + \arg C_n),
$$

where the $C_n$ are complex weights, $D$ is a real weight, and $s$ is the
time before the present
([derivation]({{ d | relative_url }}#oct15-oscillator); the same in samples:
[derivation]({{ d | relative_url }}#ck-s4d-step)). Compare this with the
standard method of section 1. The output multiplies the input $s$ seconds
ago by a fixed shape $K(s)$ and adds the products, so it is the same kind of
comparison. What differs is the kind of shape: $K$ is a sum of decaying
waves that all start ringing at the same instant, the present, $s = 0$, and
can only fade from there.

A layer has many channels side by side (our earlier networks had 128 per
layer), each with its own oscillators. Each channel's output passes through
a fixed nonlinear function, the channels are then mixed with learned
weights, and the result feeds the next layer. Training adjusts all the
weights in small steps, including each oscillator's $a_n$ and $\omega_n$.
When training is over these are fixed numbers: each oscillator rings at the
same frequency at every moment and for every input
([derivation]({{ d | relative_url }}#early-mamba-step)).

Therefore one S4D channel compares the recent past of its input with a fixed
sum of decaying waves of fixed frequencies, all struck at the same instant.

<div class="debate debate--objection" markdown="1">

**Objection.** *Re: "What differs is the kind of shape: $K$ is a sum of decaying waves that all start ringing at the same instant … and can only fade from there."* The restriction is one of number, not of kind. The damping rate $a$ can be made as small as one likes (it is stored as an exponential, so it stays positive but can come as close to zero as training takes it), and waves that fade arbitrarily slowly, spaced 0.25 Hz apart, build any 4 s shape as closely as one likes; the [derivation of the fits]({{ d | relative_url }}#early-tone-fit) says so, and the free kernels are built that way. In our fits, at the sizes we trained, fading helped rather than hurt. With 256 waves, the decaying fits reached a match of 0.87 to 0.90 at 1.2 to 2.0 M☉, while the 256 strongest undamped Fourier waves reached only 0.74 to 0.76 ([derivation of the fits to whitened chirps]({{ d | relative_url }}#early-tone-fit)). The comparison in section 5, 0.88 to 0.92 against 0.96 to 0.99, uses 1,024 and 2,048 waves, four to eight times more than any channel we trained. Starting at the present and fading therefore did not limit the shapes our S4D layers could hold. The third obstacle describes a ceiling near a match of 0.9, above anything either design learned (the free kernels' best was 0.81).

</div>

<div class="debate debate--rebuttal" markdown="1">

**Rebuttal.** Agreed, and more strongly than stated. The damping rate is stored through its logarithm, with a cap only on how fast a wave may fade, so a wave can fade as slowly as training makes it. A set of $N$ decaying waves can therefore come as close as one likes to any $N$ undamped waves, including the $N$ strongest Fourier waves of the window, and the best fit with $N$ decaying waves is at least the Fourier fit: with 2,048 waves at least 0.96 to 0.99, not 0.88 to 0.92. The lower figures belong to our fitting method, as the [derivation of the fits]({{ d | relative_url }}#early-tone-fit) says, and the third obstacle should be withdrawn as a limit on what an S4D channel can hold. One step needs care: at 256 waves the two fits differ in two ways, since our method also places the frequencies freely while the Fourier fit keeps them on the 0.25 Hz grid, so that comparison shows the value of free frequencies, not of fading. Two things remain, the start and the learning, and a cheap test separates them: fit one S4D channel of 256 waves to a whitened chirp by small training steps from the standard start, without noise, and compare it with the 0.87 to 0.90 that our method found.

</div>

<div class="debate debate--verdict" markdown="1">

**Final verdict.** The derivation stands: one S4D state obeys the equation of a damped, driven oscillator, and one channel compares its input with a fixed shape made of decaying waves that start at the present. The objection is right that the restriction is one of number, not of kind. In the S4D code we use, the damping rate is stored through its logarithm and capped only on the fast side, so a wave can fade as slowly as training makes it, and on a 4 s window slowly fading waves 0.25 Hz apart come as close as one likes to any shape. A channel of 2,048 decaying waves can therefore approach the 0.96 to 0.99 of the 2,048 strongest Fourier waves; the 0.88 to 0.92 quoted in section 5 belongs to our fitting method. The rebuttal rightly corrects one step of the objection: at 256 waves the decaying fit, 0.87 to 0.90, also chose its frequencies freely, unlike the Fourier fit, 0.74 to 0.76, so that comparison does not show that fading helps. Open is whether training finds such shapes. Fitting one channel of 256 waves to a whitened chirp by small training steps from the standard start, without noise, and comparing with 0.87 to 0.90 would tell.

Ruling: the objection is upheld.

Confirmed 16 October: the old fitting step turned each slightly growing wave into a decaying one by reflecting its pole, which changes its shape. Clipping those waves to no growth instead gives 0.93 to 0.96 with 2,048 waves, oscillators laid along the chirp reach 0.99 with 320 to 896, and fitted channels of 256 keep 0.94 to 0.99 (section 5). The ceiling near 0.9 was an artefact of our fitting.

</div>

## 4. A steady signal against a chirp

Our goal here is to show that a steady signal needs one oscillator for each
of its spectral lines, while a chirp needs more than a hundred in one
channel, and to see why in terms of time.

Suppose first that the signal is steady, a wave of constant frequency that
lasts the whole record. Its copy read backwards is again such a wave, which
one slowly fading oscillator produces, and a few steady lines need one
oscillator each. This is the case of Project 8, which measures the energy of
single electrons from the radiation they emit while circling in a magnetic
field; the frequency is set by the electron's energy (Phys. Rev. Lett. 114,
162501 (2015), [arXiv:1408.5362](https://arxiv.org/abs/1408.5362)). In our
simulated records the signal is a nearly constant carrier with a few side
frequencies, each lasting the whole record
([29 September]({{ u | append: '2026-09-29-den-reg-and-project-8/' | relative_url }})),
and 1 to 6 Fourier components (median 3, over 50 records) reproduce it with
a match of 0.9, the match being the fraction of the best possible SNR that
the approximation keeps
([7 October]({{ u | append: '2026-10-07-chirp-kernels/' | relative_url }});
[derivation]({{ d | relative_url }}#ck-fourier-tones)). S4D models do well
on Project 8 data (internal results), which fits this picture.

The same measurement for binary neutron star chirps gave 476 to 744
Fourier components for four leading-order chirps of 4 s, and 533 to 1,184
for four whitened waveforms from our training set
([7 October]({{ u | append: '2026-10-07-chirp-kernels/' | relative_url }});
[derivation]({{ d | relative_url }}#time-warp)). The reason is Fourier's
theorem on a finite window. Waves that last the whole 4 s can be told apart
only if their frequencies differ by at least $1/(4\ {\rm s}) = 0.25$ Hz,
and a chirp sweeps through hundreds of hertz, so it needs close to one
component per 0.25 Hz of the band that holds its energy. At 1.2 M☉, 81% of
the energy (a match of 0.9) lies between 80.1 and 247.6 Hz, a band 670
components wide, and the measured count is 689
([derivation]({{ d | relative_url }}#ck-fourier-tones)). These counts hold
for Fourier components, waves that never fade and last the whole window. An
S4D oscillator can fade, and below we will see that this makes it far
cheaper.

The same point can be put in terms of time, which shows what one oscillator
contributes. Suppose the chirp passes the frequency $f_0$ at the time $t_0$.
Since its phase advances at $2\pi f$ and $f$ rises at the rate $\dot f$, the
phase near $t_0$ is

$$
\Phi(t_0 + s) = \Phi(t_0) + 2\pi f_0\,s + \pi\dot f\,s^2 + \dots
$$

A steady wave at $f_0$, in step with the chirp at $t_0$, has the phase
$\Phi(t_0) + 2\pi f_0\,s$. The two differ by $\pi\dot f s^2$, which stays
within an eighth of a cycle, $\pi/4$, while $|s| \le \tfrac12\dot f^{-1/2}$.
The chirp therefore stays in step with one fixed frequency for the time

$$
T_{\rm step} = \dot f^{-1/2}
$$

([derivation]({{ d | relative_url }}#oct15-in-step-time)). Within that time
the steady wave keeps 97% of the in-step sum. Outside it the wave goes in
and out of step with the chirp, and however long it rings, its total
overlap with the chirp is never more than that of a perfectly in-step
stretch $1.34\,T_{\rm step}$ long (taking the chirp's amplitude as constant
over that time).

<div markdown="1">

| chirp mass | at 50 Hz | at 100 Hz | at 300 Hz |
|---|---|---|---|
| 0.85 M☉ | 1.15 s | 0.32 s | 0.043 s |
| 1.2 M☉ | 0.87 s | 0.24 s | 0.032 s |
| 2.75 M☉ | 0.43 s | 0.12 s | 0.016 s |

</div>

The table gives $T_{\rm step}$ at leading order
([derivation]({{ d | relative_url }}#oct15-in-step-time)). In our windows the
chirp starts at 48 to 105 Hz, so the 50 Hz column applies inside the window
only to chirp masses above 2.55 M☉. Take 1.2 M☉ at 100 Hz: a fixed
oscillator at 100 Hz is in step with the chirp for 0.24 s, 6% of the 4 s
window. Each oscillator holds the short stretch of the chirp near its own
frequency, and the chirp needs a new oscillator each time its frequency has
moved on.

How many, then, does one channel need to be the chirp's filter? Read as a
filter, the comparison of section 1 holds each frequency $f$ of the chirp
back by the time $\tau(f)$ from the moment the chirp passes $f$ to the
merger, so that every part of the chirp comes out at the merger together;
radar engineers built such filters to compress chirped pulses (Klauder,
Price, Darlington and Albersheim 1960, *Bell System Technical Journal* 39,
745, [doi:10.1002/j.1538-7305.1960.tb03942.x](https://doi.org/10.1002/j.1538-7305.1960.tb03942.x)).
A driven, damped oscillator does hold back a burst at its own frequency, by
its lifetime (the time in which it fades by a factor $e$), and across its
resonance the phase of its response turns by half a cycle. Holding every
frequency back by $\tau(f)$ takes a total turn of phase of $\int\tau\,df$
cycles across the band, and one oscillator of a channel supplies at most one
cycle of it: half from its own resonance, and at most half more from the way
the channel's weights combine it with the others. A channel that is the
chirp's filter over the whole window therefore needs

$$
N \ge \int \tau(f)\,df = \tfrac38\,N_{\rm cyc}
$$

oscillators, the equality holding at leading order, where $\tau \propto
f^{-8/3}$ and the number of cycles is $N_{\rm cyc} = \int f\,|d\tau/df|\,df =
\tfrac83\int\tau\,df$. A channel is the same in every window, so to be the
filter in all of them it must cover the longest case, the last 4 s before
the merger, with 305 to 636 cycles: that is at least 115 to 239 oscillators
for chirp masses 2.75 to 0.85 M☉, and 193 at 1.2 M☉, where
$\int\tau\,df = 192.3$. The chirp of a window whose merger falls 3.5 s in
would need at least 106 to 220 on its own
([derivation]({{ d | relative_url }}#oct16-s4d-three-eighths)). The bound is
close to what is needed.
In our fits, oscillators laid along the chirp, each fading in the time its
frequency must be held, jumped from a match of 0.46 to 0.48 to one of 0.86
to 0.93 as their number passed from 0.81 to 0.98 times the bound to 1.01 to
1.23 times it (chirp masses 1.2 to 2.0 M☉;
[16 October]({{ u | append: '2026-10-16-what-s4d-computes/' | relative_url }})).
The two counts measure different things: Fourier components count
bandwidth, one per 0.25 Hz, while fading oscillators count delay,
$\int\tau\,df$.

One might ask why Project 8 does not already demand many oscillators, since
its spectra show several lines and its electrons come with a range of
energies. This is confusing the number of steady lines with the number of
oscillators a chirp needs. Each line of a Project 8 record is steady and
costs one oscillator. A range of energies is a range of steady frequencies:
a network that reads records of any energy needs oscillators spread over
that range, but each record uses only a few of them, each in step for the
whole record. A chirp needs more than a hundred within one event, each
tuned to its own part of the chirp.

Another common question is why S4D-type models do well on astronomical time
series elsewhere. I would answer generally, without reference to any
particular study. Where a signal repeats with fixed periods, fixed
frequencies are the natural description, as for Project 8: what matters is
the shape of the signal, not the field it comes from. And
doing well always means doing well compared with something; a comparison
between designs counts only on the same task with the same data, and on
ours, in noise, S4D did worse than the free kernels (section 5); on clean
signals it did as well (section 6). Nor is S4D's long memory, by itself,
what a chirp needs: an S4D oscillator can ring for seconds, but at one
frequency, while the chirp's filter needs more than a hundred of them, each
ringing as long as its own part of the chirp must be held, and all in step.

Therefore a steady signal needs one oscillator per line, while one channel
that is the filter of a chirp needs at least 115 to 239 fading oscillators
in our window, each tuned to its part of the chirp, fading at the right
rate, and in step with the others. Built from waves that last the whole
window, a match of 0.9 took 476 to 1,184.

<div class="debate debate--objection" markdown="1">

**Objection.** *Re: "S4D models do well on Project 8 data (internal results), which fits this picture."* The steady side of this contrast rests on internal results, which a reader of this page cannot inspect, and our own published test is less clear. When we trained our own S4D network with a denoiser on simulated Project 8 records, it reproduced the spread of the energy errors but not the sharp core of the internal results, and a spectrum peak, given the true values of the other parameters, did better; the 7 October update concluded that the network was "not extracting what the data holds" ([29 September]({{ u | append: '2026-09-29-den-reg-and-project-8/' | relative_url }}), [7 October]({{ u | append: '2026-10-07-why-denoising-does-not-detect/' | relative_url }})). That record holds a nearly steady signal, the case this section says a few fixed oscillators describe best. The same update traces the shortfall to finding the carrier among its sidebands and to our shorter recordings, which may be right. Either way, S4D as we built and trained it fell short on the kind of signal it should suit, so the same choices may also contribute to its shortfall on chirps. A contrast between the two signals made with the same network and the same training choices on both would carry more weight.

</div>

<div class="debate debate--rebuttal" markdown="1">

**Rebuttal.** Partly agreed. The sentence rests on results the reader cannot inspect, and our own published test does not support it. On simulated Project 8 records our S4D network reproduced the spread of the energy errors but not the sharp core of the internal results, putting 4 to 5% of events within 1 eV, while a spectrum peak given the true pitch angle, radius, axial frequency and slope put 7% there ([29 September]({{ u | append: '2026-09-29-den-reg-and-project-8/' | relative_url }}), [7 October]({{ u | append: '2026-10-07-why-denoising-does-not-detect/' | relative_url }})). The sentence should report this. Our test does not settle the contrast either way: the spectrum peak was handed four true values that the network had to infer, and our Project 8 records are loud, with a median SNR of 20.8, while three quarters of our validation chirps lie below SNR 8. I agree with the test the objection proposes. Train the same single-layer networks of section 5, S4D with 256 oscillators per channel and free kernels, with the same settings, on Project 8 records and on chirps at matched SNR. If S4D keeps up with the free kernels on the steady signal and falls behind only on the chirp, the contrast is shown; if it falls behind on both, the explanation lies elsewhere.

</div>

<div class="debate debate--objection" markdown="1">

**Objection.** *Re: "Where a signal repeats with fixed periods, fixed frequencies are the natural description…"* This answer assumes, without checking, that the successes elsewhere involve fixed periods. The S4D paper reports "state-of-the-art results for image, audio, and medical time-series domains" (Gu et al. 2022, [arXiv:2206.11893](https://arxiv.org/abs/2206.11893)), and the S4 paper before it reached 91% on images read one pixel at a time (Gu et al. 2022, [arXiv:2111.00396](https://arxiv.org/abs/2111.00396)). Neither sound nor pictures are, in general, a few steady lines. What such tasks have in common is a signal strong enough to be recognized from short stretches. Our own clean test agrees: without noise, a small S4D network with the energy and maximum put 96.9% of events within 1% (and the same small S4D 99.9% once dropout was removed, 16 October). The distinction our data support is between signals loud enough to be read locally and a weak signal that must be added in step over the whole window, which is the argument of section 2. Stated that way, the answer can be checked against the published astronomical studies, by asking how strong their signals were, instead of being set aside.

</div>

<div class="debate debate--rebuttal" markdown="1">

**Rebuttal.** Partly agreed: the answer assumed fixed periods without checking. The S4D paper reports "state-of-the-art results for image, audio, and medical time-series domains" (Gu et al. 2022, [arXiv:2206.11893](https://arxiv.org/abs/2206.11893)), and S4 reached 91% on images read one pixel at a time (Gu et al., [arXiv:2111.00396](https://arxiv.org/abs/2111.00396)); neither is a few steady lines. I would refine one step. A picture read pixel by pixel is not recognized from a short stretch, since its class depends on the whole sequence. What those tasks share is that each part of the input stands well above the noise, or has none, so parts can be combined after a nonlinear step and the $N^{1/4}$ cost of section 2 does not matter. A chirp at SNR 8 is the other case: no cycle shows it, and only a sum in step over the window does. On our data, with clean chirps a small S4D network put 96.2 to 96.9% of events within 1%, and 99.9% once dropout was removed, and with noise every S4D first layer fell far behind the free kernels. The test is to train the same networks on the same chirps at falling SNR and see where S4D parts from the free kernels; published astronomical studies can be read the same way, by how strong their signals were.

</div>

<div class="debate debate--objection" markdown="1">

**Objection.** *Re: "Therefore a steady signal needs one oscillator per line, while a chirp needs hundreds…"* The in-step time of this section implies tens of pieces, not hundreds. A fixed wave stays in step for $T_{\rm step} = \dot f^{-1/2}$, and by then the chirp's frequency has moved on by $1/T_{\rm step}$, so the number of such stretches in a window is the time integral of $1/T_{\rm step}$. At leading order it equals $1.55\sqrt N$ for a window holding $N$ cycles: 35 at 1.2 M☉, and 27 to 39 over 2.75 to 0.85 M☉ in the last 4 s (we evaluated the integral numerically and in closed form). The hundreds come from waves that last the whole window, so that each must be cancelled by its neighbours outside its own stretch; that is the cost of the Fourier construction, which the free kernels pay with 1,968 waves per shape. Parts that could be confined to their own stretch, such as short wave packets placed at different delays, would number as many as the stretches. The count therefore argues against oscillators that cannot be placed at a delay, the third obstacle, rather than against fixed frequencies. It also makes the natural pieces of section 2 the 35 stretches rather than 600 cycles, for which its power-adding loss is $(2\times35)^{1/4} = 2.9$ rather than 5.9.

</div>

<div class="debate debate--rebuttal" markdown="1">

**Rebuttal.** Agreed, and we checked the count. The number of in-step stretches in the last $T$ seconds is $\int \dot f^{1/2}\,dt = \tfrac{16}{5}\,T\,\dot f(T)^{1/2} = 1.55\sqrt N$ at leading order, for a window holding $N$ cycles: 35 at 1.2 M☉, where the window holds 513 cycles. A chirp built from one packet of fixed frequency per stretch, each cut to its stretch and placed at its own delay, matches the chirp at 0.973, with 24 to 30 packets up to 512 Hz over 2.75 to 0.85 M☉ (our numerical check). The hundreds of section 4 count waves that last the whole window and must be cancelled by their neighbours outside their own stretch. So the count speaks against parts that all start at the present, as S4D's oscillators do, and not against fixed frequencies; the conclusion of section 4 should say so. Waves that all start at the present and fade need more: at least $\int\tau\,df$, 193 at 1.2 M☉, as section 4 now derives; with 32 per channel our later fits reached a match of 0.43 to 0.56 at 1.2 to 2.0 M☉, with 256 0.94 to 0.99 at 0.85 to 2.75 M☉ (whitened waveforms; corrected 16 October from 0.33 and 0.87 to 0.90, which were a Fourier count and an artefact of our old fitting step). Section 2 should also give 2.9, from $(2 \times 35)^{1/4}$, as the cost of a design that adds the powers of in-step stretches, beside 5.9 for single cycles.

</div>

<div class="debate debate--verdict" markdown="1">

**Final verdict.** The counts stand: 1 to 6 Fourier waves (median 3) hold a Project 8 record at a match of 0.9, against 476 to 744 for a leading-order chirp, and a chirp stays in step with one fixed wave for $\dot f^{-1/2}$. The conclusion drawn from them needs changing. On the count the objection is right: a window of $N$ cycles holds $1.55\sqrt N$ in-step stretches, 35 at 1.2 M☉, and one packet of fixed frequency per stretch, each at its own delay, matches the chirp at 0.973. More parts are needed when every part starts at the present: at least 115 to 239 if they fade at the right rates (section 4, as revised on 16 October), and 476 to 1,184 for a match of 0.9 if they never fade. On Project 8 the objection is partly right: the sentence rests on internal results, and our published test put only 4 to 5% of events within 1 eV. That test shows no failure of the design either, since the spectrum peak that did better was given four true values; and its records are loud (median SNR 20.8), unlike most of our chirps. I suggest training the S4D layer with 256 oscillators per channel and the free kernels, with the same settings, on Project 8 records and on chirps at matched SNR. On results elsewhere the objection is right: the S4D paper reports state-of-the-art results on images and audio, which are not a few steady lines.

Rulings on the three objections, in order: partly upheld, upheld, upheld.

Added 16 October: the conclusion quoted by the third objection has been rewritten. Its point that S4D's oscillators cannot be placed at a delay no longer holds as stated: a fading oscillator holds back its part of the chirp by its lifetime, which is why 115 to 239 of them can suffice.

</div>

## 5. Is the network big enough?

A possible objection is that our earlier network had plenty of oscillators.
Its layers had 128 channels of 32 oscillators, 4,096 per layer
([derivation]({{ d | relative_url }}#ck-s4d-step)), far more than the 115
to 239 that one channel needs to be the filter of one of our chirps
(section 4). I concede the point in principle: a sum of enough
fixed-frequency oscillators can build the shape, and 4,096 is enough if
they work together. Our goal here is to show that having the oscillators is
not the same as using them, and then to test it.

The first obstacle is agreement in phase. A shape built from more than a
hundred oscillators matches the chirp only if each is in step with the
chirp during its own part and the parts join without a slip of more than a
fraction of a cycle (section 2). With 32 oscillators per channel, fewer than
section 4 counts, one channel cannot be the whole filter, and the shape must
be spread over channels whose outputs are then added in step. In the
single-layer networks tested below, each channel's output is squared (its
energy is taken) before the channels are combined, so channels cannot be
added in step at all: each channel must be the filter on its own. In a
deeper S4D network a GELU sits between each channel and the mixing of
channels. The first version of this lecture said that this, too, prevents
adding in step. It does not: a GELU passes a weak signal with an average
gain of one half, and a sum in step taken after it keeps 84 to 91% of the
SNR it would have without the GELU, when the pieces added carry independent
Gaussian noise with a spread of 0.5 to 2 (a ReLU, the function
$\max(0, x)$, keeps 86%, and a threshold at zero 80%, at any spread). The
channels of one layer share their input, so their noises are in general
correlated, a case these numbers do not cover. Only an even function, such
as a square or an energy, loses the part linear in the signal at every
spread, and what it leaves is a sum of powers
([derivation]({{ d | relative_url }}#oct16-nonlinearity-linear-part); the
[derivation of the power-sum loss]({{ d | relative_url }}#semi-coherent),
which listed a GELU beside a square, has been corrected).

The second obstacle is where the oscillators start. In the standard start
of S4D, called S4D-Lin, one random number per channel sets both the spacing
of the channel's frequencies and how long its oscillators last, and
oscillator $n$ completes exactly $n$ cycles while it fades by a factor $e$,
so a channel of 32 oscillators that last 1 s reaches 31 Hz at most. With the
starting values of our earlier network (32 per channel, 2,048 samples per
second), 0.76% of the oscillators start both inside the signal's band (20 Hz
to half the sampling rate) and lasting longer than 1 s; with 256 per channel
at 1,024 samples per second, 14%
([derivation]({{ d | relative_url }}#s4d-tones)). After 200 epochs of
training (an epoch is one round of training on 50,048 windows), our run of
that size had 7%, half the fraction expected at the start
([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})).

The third obstacle, as first written, was that every oscillator starts
ringing at the same instant and can only fade. The shape a chirp needs is
the chirp played backwards: its highest frequencies sit at the present, near
the merger, and its lowest 3.5 to 4 s back. An oscillator at the lowest
frequency is needed only at the far end of the shape, yet it rings from the
present onward and is loudest at the start, so other oscillators near the
same frequency must beat against it to keep the sum quiet early and loud
late. I took this cancellation to be costly, because in our first fits to
whitened 4 s chirps decaying oscillators stopped at a match of 0.87 to 0.91
with 1,024 and 0.88 to 0.92 with 2,048, while undamped Fourier components
reached 0.96 to 0.99 with 2,048
([derivation]({{ d | relative_url }}#early-tone-fit)). That ceiling was an
artefact of the fitting step: the best fits contained oscillators that grow
slightly, and the step turned each into a decaying one by reflecting its
pole, which changes its shape. Clipped to no growth instead, the same fits
give 0.93 to 0.96 with 2,048; oscillators laid along the chirp reach 0.99
with 320 to 896; and fitted channels of 256 keep 0.94 to 0.99 at chirp
masses 0.85 to 2.75 M☉
([16 October]({{ u | append: '2026-10-16-what-s4d-computes/' | relative_url }})).
Fading is what lets an oscillator hold back its part of the chirp (section
4). The third obstacle is therefore withdrawn as a limit on what a channel
can hold; what remains of it is the count, at least 115 to 239 per channel.

The fourth obstacle concerns learning. Training improves a network by small
adjustments, each in the direction that reduces its error. For one
oscillator compared with a steady signal over a time $T$, the in-step sum as
a function of the frequency error $\delta f$ is $|\sin(\pi\,\delta f\,T)/
(\pi\,\delta f\,T)|$ (section 2): a central peak $1/T$ wide on each side,
0.25 Hz for 4 s, among side peaks no higher than 0.217
([derivation]({{ d | relative_url }}#oct15-phase-drift)). An oscillator that
starts outside the central peak is led by small steps to a side peak. A free
shape has no such structure: its output is a weighted sum of its values, so
a small change in any value changes the output in proportion. This fourth
point is our explanation of the experiment below, not something we have
proven for a chirp. What the saved models do show is that training hardly
moved the S4D frequencies: in the three single-layer S4D networks we
analysed, at most 2.5% of the oscillators moved by more than half the
spacing between neighbouring frequencies at the start, while many changed
their lifetimes. The channels that came to act as a chirp's filter are
those whose time step happened to suit one
([16 October]({{ u | append: '2026-10-16-what-s4d-computes/' | relative_url }})).

To prove this point experimentally, we have this experiment
([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})).
Several networks were trained on the same data, with the same schedule and
the same final step, and differed only in their first layer. The final step
is that of the standard method: each reference shape is complex, so it acts
as a cosine-like and a sine-like copy at once, the squares are added, the
largest value in the window is kept, and learned weights turn these largest
values into a score for each of 235 chirp masses. The first layers were S4D
layers of several kinds, or free kernels: 256 reference shapes as long as
the window, whose 4,096 values each (4 s at 1,024 samples per second) are
all learned, with no formula behind them
([page on the free kernels]({{ '/projects/bns/free-kernel/' | relative_url }})).
After every epoch each network was scored on validation windows, data with
real noise that it never trains on.

<div markdown="1">

| first layer | oscillators behind each shape | learned numbers | within 1% |
|---|---|---|---|
| S4D, 256 channels of 32 oscillators | 32 | 93k | 7% |
| S4D, 256 channels of 256 oscillators | 256 | 323k | 18 to 24% |
| the same, started in band, lasting 4 s | 256 | 323k | 7 to 9% |
| S4D, wider: 1,024 channels of 32, mixed with plain weights into 256 shapes | up to 32,768 | 717k | 6% |
| S4D, deeper: six S4D layers of 128 channels of 32 | 32 per channel, six layers | 347k | 14% |
| free kernels: 256 freely learned shapes of 4 s | none (any shape) | 1.07M | 38 to 42% |

</div>

Validation over all SNRs, SNR drawn from a power law from SNR 4; one
training run per design; ranges go from the latest to the best epoch, and
single values are the latest reading (the best epochs of those three rows
had reached 9.7%, 7.5% and 14.0%), read from the training logs on 14 October
([slides of 14 October]({{ u | append: '2026-10-14-slides-chirps-tones-filters/' | relative_url }}),
slides 4 and 17; designs:
[13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})).
Our earlier S4D network with a denoiser reached 13.6%.

Two caveats found on 16 October. The deeper network and our earlier network
with a denoiser had dropout 0.2 (run configurations;
[16 October status]({{ u | append: '2026-10-16-status-dropout-and-signal-only/' | relative_url }})),
the setting that broke our clean-signal S4D networks (section 6), so their
numbers are suspect; the single-layer rows had no dropout. And the two
single-layer S4D runs with the standard start (S4D-Lin) that we checked, 32
and 256 oscillators per channel, partly read a numerical artefact: a
constant offset that the GPU's Fourier-transform routine adds when our
long-convolution code halves the sample rate. Computed without the offset,
they score 6.1% and 20.6% instead of 7.2% and 21.2% on 20,000 test windows
([16 October]({{ u | append: '2026-10-16-what-s4d-computes/' | relative_url }})).
The free kernels and the band start are not affected; the wider network
was not checked.

Every S4D variant stayed between 6 and 24%; the free kernels reached 38 to
42%. In this population 75% of events are below SNR 8
([derivation]({{ d | relative_url }}#late-snr-bands)), so every number is
low; what matters is the comparison on the same population. The runs went
on after that reading, to between 123 and 421 epochs, and no S4D variant
passed 24% (training logs; the best, 23.7%, came from 256 oscillators per
channel).

{% include figure.html
   src="/assets/img/bns/2026-10-13/arm_curves.png"
   alt="Fraction of validation events within 1 and 2 percent of the true chirp mass against epoch, for the free kernels, several S4D first layers and the earlier S4D network"
   label="Validation during training, as of 13 October"
   caption="Fraction of validation events within 1% (left) and 2% (right) of the true chirp mass, 9-epoch running means. In the legend, d_state 64 and 512 mean 32 and 256 oscillators per channel; the width and depth runs are the wider and deeper networks of the table; the den-reg is our earlier S4D network with a denoiser, and the ResNet a deep network of another kind. The runs continued after this figure." %}

The free kernels taught themselves the right shapes. At the start, the best
match of any of them to any real waveform was 0.10; after training, 125 of
the 256 matched a waveform at 0.5 to 0.81, with chirp masses spread evenly
from 0.85 to 2.74 M☉
([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})).
Of the 256 shapes of the S4D layer with 256 oscillators per channel, only 20
matched a chirp above 0.5 (same source), although fitted channels of 256
decaying oscillators keep 0.94 to 0.99 at chirp masses 0.85 to 2.75 M☉
([16 October]({{ u | append: '2026-10-16-what-s4d-computes/' | relative_url }});
the 0.87 to 0.90 of the
[earlier fits]({{ d | relative_url }}#early-tone-fit) was an artefact of
their fitting step), above the free kernels' best of 0.81. Over the whole
range, then, the S4D layer could have held shapes as good as those the free
kernels learned, and it did not learn them.

{% include figure.html
   src="/assets/img/bns/2026-10-13/free_kernels_spectrograms.png"
   alt="Frequency against time for four learned free kernels, each a track whose frequency rises toward the end of the 4 seconds"
   label="Four of the 256 free kernels after training"
   caption="Frequency against time (darker is stronger) for four free kernels learned from random starting values, read forward in time. Each became a chirp whose frequency rises toward the end, and each matches a real waveform at 0.75 to 0.77 (13 October)." %}

But suppose even that is not enough to convince you, and you suspect that
some S4D variant would have caught up with more oscillators or a better
start. Two rows of the table answer this. The wider network had up to
32,768 oscillators behind each of its 256 shapes, mixed with plain weights
and no nonlinear function in between; it did worst of all, at 6%. The
network whose oscillators all started inside the band and lasting 4 s
removed the second obstacle by construction, yet at matched epochs it
trailed the standard start: 4.0, 5.6 and 6.5% over epochs 20 to 39, 40 to 59
and 60 to 76, against 12.4, 15.2 and 16.5%, with the free kernels at 35.3,
36.8 and 37.3% ([brainstorm]({{ '/projects/bns/brainstorm/' | relative_url }})).
More oscillators per channel did help, from 7% with 32 to 18 to 24% with
256, but no change brought S4D near the free kernels.

One might ask whether the free kernels win simply because they have more
learned numbers, 1.07 million against 93,000 to 717,000. The wider S4D
network had 717,000 and did worst, and the layer with 256 oscillators per
channel, with 323,000, could in principle hold better shapes than the free
kernels learned. What decides is what the numbers describe, and how easily
training can adjust them.

Therefore a layer was big enough in principle, and more oscillators helped,
but one channel of 32 holds fewer than section 4 counts for a chirp's
filter, and the channels of 256, which hold more, did not learn to use them:
their frequencies stayed close to where they started. Section 6 shows that
the final step is not what held them back.

<div class="debate debate--objection" markdown="1">

**Objection.** *Re: "…each channel's output passes through a fixed nonlinear function before the channels are mixed, so the parts are not simply added."* The nonlinear function in our S4D layers is $x$ times the probability that a standard normal variable lies below $x$. It equals $x/2$ plus a part that is even in $x$, so a small signal riding on the noise passes with an average gain of exactly one half. For Gaussian noise of any spread, independent from piece to piece, a sum in step taken after the function keeps between 84 and 100% of the SNR it would have without it (85% at unit spread; [derivation]({{ d | relative_url }}#oct16-nonlinearity-linear-part)). That is far from the power sum of section 2, and a later layer can still add channels in step through the linear half; the site's [derivation of the power-sum loss]({{ d | relative_url }}#semi-coherent), which counts this function among the steps that destroy the in-step sum, should be corrected. The table also argues against this obstacle. None of its single-layer rows has a nonlinear step before the energy, since each shape there is one channel, or a plain weighted sum of channels in the wider network. The one design with nonlinear steps between its layers, the deeper network, did better (14 to 15%) than the single layer with 32 oscillators per channel (7%) and the wider network (6%).

</div>

<div class="debate debate--rebuttal" markdown="1">

**Rebuttal.** Agreed. The nonlinear function in our S4D layers is $x$ times the probability that a standard normal variable lies below $x$. It equals $x/2$ plus a part even in $x$, and for noise symmetric around zero the even part is uncorrelated with the input, so a weak signal passes with an average gain of exactly one half. For independent Gaussian noise of any spread, a sum in step taken after the function keeps 84 to 100% of its SNR (85% at unit spread; [derivation]({{ d | relative_url }}#oct16-nonlinearity-linear-part)). The derivation of the power-sum cost, which lists this function beside a square, should be corrected. The table agrees: no single-layer row has a nonlinear step before the energy, since each shape there is one channel, or a plain weighted sum of channels in the wider network, and over epochs 200 to 250 the deeper network, the only one with such steps, reached 11.3% against 6.9% for the single layer with 32 oscillators per channel and 4.7% for the wider network (training logs). That comparison does not isolate the step, since the deeper network also has six layers and other training settings. What remains of the first obstacle is the agreement in phase itself, which the single-layer rows test without any nonlinear step.

</div>

<div class="debate debate--objection" markdown="1">

**Objection.** *Re: "The wider network had up to 32,768 oscillators behind each of its 256 shapes … it did worst of all, at 6%."* This row measures where the oscillators started, not how many there were. In the standard start, oscillator $n$ completes $n$ cycles while it fades by a factor $e$ ([derivation of S4D frequencies and lifetimes]({{ d | relative_url }}#s4d-tones)), so with 32 per channel no oscillator can start above 31 Hz and last longer than 1 s, whatever the channel's time step. An oscillator at 100 Hz lasts at most 0.31 s, while at 1.2 M☉ the chirp passes 100 Hz 2.2 s before the merger. None of the 32,768 could therefore begin where the slower part of the chirp lies, and the mixing weights cannot change an oscillator's frequency or how long it lasts; only training of the oscillators' own numbers could. Of the network's 717,000 learned numbers, 524,288 are these mixing weights. The row would test the number of oscillators only with a start that puts them in the band with long lives. That run was not made, nor was an S4D whose channels hold as many oscillators as each free kernel holds waves, 1,968. Whether more oscillators would let S4D catch up is still open.

</div>

<div class="debate debate--rebuttal" markdown="1">

**Rebuttal.** Agreed, and our saved models confirm it. In the standard start, oscillator $n$ completes $n$ cycles while it fades by a factor $e$, so no oscillator of a 32-oscillator channel starts above 31 Hz with a lifetime over 1 s, and none of the wider network's 32,768 started where the slower part of the chirp lies. Training did not move them there. After 421 epochs, 0.34% of them lay between 20 and 512 Hz with lifetimes over 1 s, and 0.14% did so at or above 48 Hz, the lowest frequency at which any of our chirps enters the window (we read every frequency and lifetime from the saved model). The mixing weights, 524,288 of its 716,779 learned numbers, cannot change that. So this row shows that training did not bring the oscillators into place; it cannot show that more of them would not help. That question needs a run whose oscillators start in the band with long lives, at a spacing that avoids the repeating pattern of our band start, and with channels that hold well over the 115 to 239 oscillators section 4 counts for a chirp, up to the 1,968 waves of a free kernel.

</div>

<div class="debate debate--objection" markdown="1">

**Objection.** *Re: "The network whose oscillators all started inside the band and lasting 4 s removed the second obstacle by construction…"* The band start exchanged the second obstacle for another. Each channel's 256 frequencies were spaced evenly, 1.92 Hz apart, all lasting 4 s ([brainstorm]({{ '/projects/bns/brainstorm/' | relative_url }})). A sum of waves spaced evenly by $\Delta f$ repeats every $1/\Delta f$, as a Fourier series does, here every 0.52 s, and a 4 s lifetime damps each repeat by only 12%. Every band-started shape therefore began as a pattern repeated 7.7 times across the window, which cannot follow a 4 s chirp until training moves the frequencies off their even grid. With the starting frequencies and lifetimes and the best possible weights, one such channel matches a leading-order 1.2 M☉ chirp at 0.41, against 0.55 for the best channel the standard start can give and 0.77 for the 256 strongest Fourier waves; 0.41 also at 1.0 and 2.0 M☉ (least-squares fits we made, without whitening). The long lifetimes also bring the false peaks in frequency discussed at section 10. The run tested one poor start, so its result cannot show that no start would work.

</div>

<div class="debate debate--rebuttal" markdown="1">

**Rebuttal.** Agreed. Waves 1.92 Hz apart add to a pattern that repeats every 0.52 s, apart from a fixed turn of phase, and a 4 s lifetime weakens each repeat by only 12%, so every band-started shape began as one pattern repeated 7.7 times across the window. We repeated the least-squares fits: with the starting frequencies and lifetimes and the best weights, one channel matches a leading-order chirp at 0.41 (at 1.0, 1.2 and 2.0 M☉), below the 0.55 of the best channel the standard start offers at 1.2 M☉. Training did not leave that pattern far behind: at epoch 122 no band-started shape matched a leading-order chirp above 0.48, while 85% of its oscillators were still at or above 48 Hz with lifetimes over 1 s (read from the saved model). The run tested one poor start, and its result cannot show that no start would work. A start that removes both problems is the free kernels' own grid, waves 0.25 Hz apart from 20 to 512 Hz, whose pattern repeats only after 4 s, with the onset of each training window tapered so that long-lived oscillators meet no false peaks (section 10).

</div>

<div class="debate debate--verdict" markdown="1">

**Final verdict.** The measurement stands: the free kernels learned 125 chirp-shaped references and the best S4D layer 20, and more oscillators per channel helped, from 6.9 to 19.1% within 1% over epochs 200 to 250. The second obstacle is supported: after 421 epochs only 0.34% of the wider network's oscillators lay between 20 and 512 Hz with lifetimes over 1 s. The fourth remains unproven. All three objections are right. In Gaussian noise the nonlinear function passes a weak signal with an average gain of exactly one half, and a sum in step taken after it, over pieces with independent noise, keeps 84 to 100% of the SNR ([derivation]({{ d | relative_url }}#oct16-nonlinearity-linear-part)); the single-layer rows have no such step. The first obstacle should go, and the derivation that lists this function beside a square should be corrected. The wider row tests where its oscillators started, not how many it had: with 32 per channel the standard start puts none above 31 Hz with a lifetime over 1 s. The band start began as one pattern repeating every 0.52 s, which matches a chirp at only 0.41 with the best weights. Neither row shows that more oscillators or a better start would fail. The deciding run gives each channel hundreds of oscillators, started in band with long lifetimes and 0.25 Hz apart.

Rulings on the three objections, in order: upheld, upheld, upheld.

Added 16 October: a separate [derivation]({{ d | relative_url }}#oct16-nonlinearity-linear-part) confirms the first objection (a sum in step after a GELU keeps 84 to 91% of the SNR for noise spreads of 0.5 to 2, and tends to 100% as the spread falls; after a ReLU 86%, after a threshold at zero 80%; only even functions lose the linear part at every spread, leaving a sum of powers), and the sentence it quotes has been rewritten, as has the [derivation of the power-sum loss]({{ d | relative_url }}#semi-coherent); the first obstacle now rests on the energy taken from each channel before channels are combined.

</div>

## 6. Is something wrong with how we trained it?

A possible objection is that the S4D networks were trained badly, and that
the gap reflects our choices rather than the design. Part of this objection
is right, more of it than the first version of this lecture conceded, and I
take it first.

Our clean-signal S4D networks were trained badly. On clean signals a small
S4D network (four layers of 64 channels with 16 oscillators each) that
averaged over time put 32.6% of validation events within 1%
([14 October]({{ u | append: '2026-10-14-signal-only-test/' | relative_url }})),
and a version whose last layer was complex and read through its energy and
largest value over time, as in the free kernels, reached 96.9%
([slides of 14 October]({{ u | append: '2026-10-14-slides-chirps-tones-filters/' | relative_url }}),
slide 13). The first version of this lecture concluded that averaging over
time was the problem. It was not. Both networks had dropout 0.2. With
dropout 0 and nothing else changed, the same small S4D puts 99.9% of clean
validation events within 1% with a mean over time, and 99.9% with a
maximum, against at best 36.9% and 16.0% with dropout 0.2. On clean
signals aframe's ResNet, which averages over time, reaches 100%, a dilated
CNN 100% and the free kernels 99.8%
([16 October status]({{ u | append: '2026-10-16-status-dropout-and-signal-only/' | relative_url }})).

Averaging over time can still cost a great deal in noise. With ideal shapes,
the copies of real waveforms used by the standard method, replacing the
largest value of the energy over time by its average dropped the fraction
within 1% at SNR 8 to 10 from 91% to 22%
([12 October]({{ u | append: '2026-10-12-template-bank-network/' | relative_url }})).
With the right copy, the energy peaks sharply at the moment the copy lines
up with the signal; averaged over the window, that short peak is diluted by
the noise everywhere else, and an output that oscillates averages to nearly
nothing ([derivation]({{ d | relative_url }}#oct7-time-average)). That is
shown for a bank of ideal copies. Whether it also held back our S4D networks
in noise is not shown, because the clean-signal evidence I gave for it was
dropout.

Therefore the clean test cannot separate the two designs, or any of the
others: every one we tried passes it. Without noise, the chirp mass can in principle be read from a few
cycles, from the frequency and its rate of change
([derivation]({{ d | relative_url }}#late-chirp-rate)), with nothing added
in step over the window. How the S4D does it is not known. One explanation
I proposed, that it reads the chirp locally, each first-layer oscillator
responding as the chirp passes its frequency, was put to a test whose
predictions and rules for judging them were written down and fingerprinted
before it ran. The verdict by those rules was inconclusive, and the same
rules applied to filters of known behaviour show that they could not have
told that explanation from its alternative. Its central step, the
first-layer oscillators responding in turn as the chirp sweeps, was not
supported, and I withdraw it. Two things were found. The
network's first layer holds no filter that adds the chirp in step better
than one oscillator alone. And, after the fact, its 1% precision depends on
the chirp switching on at the first sample of the window: setting the first
31 ms of each clean window to zero drops it from 98.3% to 4.5% within 1%,
while moving the whole window 31 ms earlier leaves it at 98.35%; the free
kernels give 99.6% and 99.7%
([16 October]({{ u | append: '2026-10-16-what-s4d-computes/' | relative_url }})).
In noisy windows the
noise switches on at that same first sample, so the clean precision may not
carry over to noisy data.

The noisy test is the one that needs the in-step sum. In it every
single-layer design had the same final step (the energy, its largest value
over time, and learned weights) and no dropout. With that step, S4D stayed
at 6 to 24% and the free kernels reached 38 to 42% (section 5).

Is the final step what held S4D back in noise? We retrained it from scratch
on each network's 256 channel outputs, using 512,000 new training windows,
and scored it on 20,000 new windows made as the validation windows are
made. The new final steps came within 0.9 points of each network's own:
7.9% within 1% for S4D with 32 oscillators per channel, 10.2% for the band
start, 21.1% with 256 per channel and 39.7% for the free kernels, against
7.2, 9.4, 21.2 and 40.0% with their own (the better of a linear and a small
MLP final step in each case). A bank of 256 whitened copies of real
waveforms, passed through the same kind of final step, reached 43.6%. The
final step is not the limit; the filters are. Over 235 copies of real
waveforms, the best channel of each network keeps a median match of 0.37,
0.43, 0.57 and 0.75, in the same order
([16 October]({{ u | append: '2026-10-16-what-s4d-computes/' | relative_url }})).
The two S4D numbers with the standard start are partly the artefact of
section 5; without it their own final steps score 6.1% and 20.6%.

A second part of the objection concerns how long the networks trained. The
S4D runs were not short. The 256-oscillator run had trained 200 epochs when
its oscillators were counted, and it went on to epoch 343 (training log);
the free kernels were first tested at epoch 141, then their best, and were
stopped at epoch 253
([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})).
At matched epochs the gap is the same. Over epochs 200 to 250, the S4D layer
had 19.1% with 256 oscillators per channel and 6.9% with 32, against 39.1%
for the free kernels (same source); over epochs 20 to 39, 12.4% with 256
against 35.3%
([brainstorm]({{ '/projects/bns/brainstorm/' | relative_url }})). The free
kernels were ahead within the first 40 epochs and stayed ahead.

What our tests do not show is the result of an equal tuning effort. Each
design was trained once, with one choice of training settings, and we did
not search over those settings for either; in the clean tests the S4D
trained most of its weights with a step size of 10⁻⁴ and the free kernels
with 10⁻³
([14 October]({{ u | append: '2026-10-14-signal-only-test/' | relative_url }});
run configurations). None of our S4D networks with more than one layer has
yet been trained on noisy data without dropout (run configurations). Some
S4D variants were still improving slowly when last read: the deeper network
went from 14% to a best of 15.1%, and the one started in band from 7 to 9%
to 10.5% (training logs). We do not know where they would end. The strict
comparison, with the same effort spent on each design, is the next step.

Therefore the objection stands for our clean-signal S4D networks, which
dropout broke, and may stand for the deeper network, which had dropout too.
It does not explain the single-layer gap on noisy data: with the same final
step and the same schedule the gap remained, and it sits in the filters, not
in the final step.

<div class="debate debate--objection" markdown="1">

**Objection.** *Re: "Therefore the clean test cannot separate the two designs."* This rests on an assumption the lecture does not test. A small S4D network, four layers of 64 channels with 16 oscillators each, put 96.2 to 96.9% of clean events within 1% of the true chirp mass. Either it read the chirp mass from a few cycles, as the lecture assumes, or its layers built, from short pieces, comparisons that stay in step over much of the window. The second would contradict the claim that S4D does not assemble a chirp; only the first makes the clean test irrelevant. The trained network can tell us which. Train or test it on clean windows that keep only a short stretch of the chirp, such as the last half second, or add noise of growing strength (SNR 50, then 25, then 12) and see how fast its fraction within 1% falls compared with the free kernels. Until then the clean result is set aside by assumption rather than by measurement.

</div>

<div class="debate debate--rebuttal" markdown="1">

**Rebuttal.** Agreed: the lecture sets the clean result aside by an argument from physics, not by a measurement of what the network did. A clean chirp holds its chirp mass in any few cycles ([derivation of the chirp mass from the frequency and its rate of change]({{ d | relative_url }}#late-chirp-rate)), so the clean test does not require a sum in step over the window, but it does not show that the small S4D network avoided one; its 96.2 to 96.9% fits both readings. The test the objection proposes tells them apart: train both designs on the same chirps at SNR 50, 25 and 12. A network that reads a few stretches loses precision as each stretch's share of the SNR falls (8.5, 4.2 and 2.0 if spread evenly over the 35 in-step stretches of a 1.2 M☉ chirp), while one that sums in step keeps it, as the free kernels do at SNR 10 to 12 (85% within 1% on the test, [13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})). If S4D holds up as long as the free kernels, it can learn the sum in step, its shortfall on noisy data needs another cause, and the sentence should be withdrawn. Until then it is a reading, not a result.

</div>

<div class="debate debate--objection" markdown="1">

**Objection.** *Re: "Some S4D variants were still improving slowly when last read: the deeper network went from 14% to a best of 15.1%…"* A best-epoch value is the largest of many noisy readings, so it creeps upward even when a network has stopped improving. One validation epoch scores 2,048 windows, 96% of them with a signal, so at these fractions its spread is 0.6 to 1.1 points ([derivation]({{ d | relative_url }}#late-binomial)), and the largest of a hundred independent readings lies on average 2.5 spreads above their mean. The deeper network's last reading, 12.7%, was below its best, and its last ten epochs averaged 12.7% (training log), so its improvement is not shown. The same effect lifts the upper ends of the table's ranges, 24% and 42%, and the row for 32 oscillators per channel reads 7% although its best epoch reached 9.7% (training log), so the rows do not follow one rule. Averages over matched epochs, which the lecture uses elsewhere, are the fair measure throughout. With one run per design, even they cannot tell how much a second run of the same design would differ.

</div>

<div class="debate debate--rebuttal" markdown="1">

**Rebuttal.** Agreed. Each validation epoch draws 2,048 fresh windows, 96% with a signal, so one reading has a binomial spread of 0.6 to 1.1 points at these fractions ([derivation of the validation spread]({{ d | relative_url }}#late-binomial)), and the best of many readings sits above their mean: the largest of 100 independent standard normal numbers averages 2.5. The rows also follow no single rule. At 16:20 on 14 October the run with 32 oscillators per channel stood at 6.5% with a best of 9.7%, shown as 7%; the wider network at 6.1% with a best of 7.5%, shown as 6%; the deeper network at 13.1% with a best of 14.0%, shown as 14% (training logs). The deeper network's later best, 15.1%, shows no improvement, since its last reading and the mean of its last ten were both 12.7%; the band start did improve, from 6.5% over epochs 60 to 76 to 9.5% over its last ten. The table should give means over matched epochs. Over epochs 200 to 250 these are 39.1% for the free kernels and 19.1, 11.3, 6.9 and 4.7% for S4D with 256 per channel, deeper, 32 per channel and wider: the gap of 20 points or more stands. A second run of each design would show how much runs differ.

</div>

<div class="debate debate--objection" markdown="1">

**Objection.** *Re: "…with the right last step and the same schedule, the gap on noisy data remained."* The same schedule does not make the settings suitable for both designs. In every S4D channel one learned number, its time step, scales all of the channel's frequencies and damping rates together ([derivation of S4D frequencies and lifetimes]({{ d | relative_url }}#s4d-tones)). Changing its logarithm by $\delta$ compresses the channel's shape in time by the factor $e^\delta$ and so moves the chirp mass the shape matches by the fraction $\delta$. Our runs trained this number with a step size of $10^{-3}$ (run configuration), and our training method changes a number by at most about the step size per update, so one update can move a channel's chirp mass by up to 0.1%, while a shape responds with less than half its full value to a signal 0.19% above its own chirp mass ([derivation]({{ d | relative_url }}#ck-tuning)). Shapes tied to a learned chirp mass have drifted out of order before ([brainstorm]({{ '/projects/bns/brainstorm/' | relative_url }}): the network whose chirp-shaped references each carried a learned chirp mass); the free kernels have no such number. The settings also differed: the deeper network trained its other weights with a step size of $10^{-4}$ instead of $10^{-3}$, switched off whole channels at random during training, and ran at 2,048 samples per second (run configurations). Holding the time step fixed, or training it more slowly, is a cheap test not yet made.

</div>

<div class="debate debate--rebuttal" markdown="1">

**Rebuttal.** Agreed, and our saved models support the mechanism. The settings were not the same in every row: the deeper network trained its other weights with a step size of $10^{-4}$ instead of $10^{-3}$ and ran at 2,048 samples per second, and during training it switched off whole channels at random, each with probability 0.2 (run configurations), so the claim of equal settings holds only for the single-layer rows. The shapes do drift. We found the chirp mass that each channel of the layer with 256 oscillators per channel matches best, at epochs 288 and 343: the 17 channels matching a leading-order chirp above 0.5 at both moved by a median of 0.52% (0.04 to 1.38%), 15 of them by more than 0.19%, and in 13 of the 17 the time step changed in the direction that produces the shift (median change 1.3%). The 125 free kernels matching above 0.5 moved by a median of 0.08% between epochs 141 and 248, twice as many epochs. Whether the drift causes the gap or follows from it is not settled. The test is cheap: train the same layer with its time steps held fixed, or with a step size ten times smaller for them, and see whether the shapes stop drifting and the score rises.

</div>

<div class="debate debate--verdict" markdown="1">

**Final verdict.** The concession on the last step stands, and so does the gap in matched-epoch means: over epochs 200 to 250, 39.1% within 1% for the free kernels against 19.1% for the best S4D layer. All three objections are right. The clean result fits two readings, since a small S4D network at 96.2 to 96.9% may read the chirp mass from a few cycles or add many in step; training both designs on the same chirps at SNR 50, 25 and 12 would decide which. Best-epoch values are the largest of many noisy readings: the deeper network's last ten epochs averaged 12.7% against a best of 15.1%, so its improvement is not shown, while the band start did improve, from 6.5% over epochs 60 to 76 to 9.5% over its last ten. The table should give matched-epoch means. The deeper network also had other settings: a step size ten times smaller for most weights, whole channels switched off at random, and 2,048 samples per second. In S4D one learned time step per channel stretches a shape in time and so moves its chirp mass; chirp-like S4D shapes moved by a median of 0.52% in 55 epochs, those of the free kernels by 0.08% in 107. Holding those time steps fixed would test whether this drift matters.

Rulings on the three objections, in order: upheld, upheld, upheld.

Added 16 October: the paragraph quoted by the first objection has been rewritten and no longer assumes how the S4D reads clean chirps. With dropout 0 the network reaches 99.9%; a test of the local reading, fixed in advance, was inconclusive; its first layer holds no filter that adds the chirp in step; and its 1% precision depends on the chirp switching on at the window's first sample. The training at SNR 50, 25 and 12 proposed here has not been run. On the third objection: the deeper network's random switching off of channels is dropout 0.2, the setting that broke our clean-signal S4D networks, so its numbers are suspect.

</div>

## 7. Is it the amount of data?

A possible objection is that S4D needs more data than we gave it. Suppose it
does; what would that mean for our comparison?

The noise in our training windows is real data from both LIGO detectors,
from the first half of the third observing run: 21 files, 100,011 s (1.158
days) in all, with 0.484 days more kept apart for validation (run
configuration and the files' recorded durations). Every training window is
cut from this background at its own random time, separately for each
detector
([1 October]({{ u | append: '2026-10-01-recipe-on-bns/' | relative_url }})),
so each window's noise is a new combination drawn from the same 1.158 days,
and the signals are injected fresh each time, each waveform into four
backgrounds (run configurations). An earlier run that made that change
together with four others was better at SNR 8 to 25 and unchanged below
SNR 8
([5 October]({{ u | append: '2026-10-05-recipe-at-epoch-630/' | relative_url }})),
but since several things changed at once, it does not isolate the effect of
data.

The decisive observation is simpler. The free kernels were trained on
exactly the same data as the S4D networks and reached 38 to 42% against 6 to
24% (section 5), so the amount of data cannot explain the gap between the
two designs. And if S4D needed far more data than the free kernels to reach
the same result, that would itself count against it for this task, where
the background and the computing time are finite.

The test that would settle the question is a learning curve: train both
designs on a quarter, a half and all of the background, and see how each
improves. If S4D improves steeply with data while the free kernels do not,
more data might close the gap; if both level off, it will not.

Therefore the amount of data does not explain the gap we measured, and a
learning curve would tell whether more data could close it.

<div class="debate debate--objection" markdown="1">

**Objection.** *Re: "The free kernels were trained on exactly the same data as the S4D networks … so the amount of data cannot explain the gap between the two designs."* Equal data need not help two designs equally. The noise is reused heavily: each epoch takes 50,048 windows of 4 s from 100,011 s of background, so each second of each detector's noise is used 2.0 times per epoch on average, 284 times by the end of epoch 141, and the background holds only 24,994 separate 4 s stretches per detector. A network with a million freely learned numbers can adapt to that particular stretch of the first half of the third observing run, and the validation noise comes from the same half. On the test, with noise from the second half, the free kernels put 31 and 28% of events within 1% over all SNRs (epochs 141 and 248) against 38 to 42% on validation, while our earlier S4D network with a denoiser went from 13.6% on validation to 14% on the test ([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }}); [slides of 14 October]({{ u | append: '2026-10-14-slides-chirps-tones-filters/' | relative_url }})). Both used the same waveform files and the same validation and test noise. The 13 October update already names adaptation to the training noise as a possible cause. None of the S4D first layers has been tested on the second half, so the size of the gap on independent noise is not yet known.

</div>

<div class="debate debate--rebuttal" markdown="1">

**Rebuttal.** Partly agreed: the free kernels' lead on validation noise may overstate their lead on independent noise. Each epoch cuts 50,048 windows of 4 s from 100,011 s of training background, so each second of each detector's noise is used 2.0 times per epoch, and validation noise comes from the same half of the run. On the test, with noise from the second half, the free kernels scored 31 and 28% within 1% at epochs 141 and 248 ([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})), against 39.1% averaged over validation epochs 200 to 250, while our earlier S4D network went from 13.4%, the mean of its last 20 validation epochs, to 14% ([14 October]({{ u | append: '2026-10-14-den-reg-final/' | relative_url }})). The S4D first layers have not been tested there. If they lost nothing, as that network did not, the free kernels' 28 to 31% would stand against 19.1% for the best of them (validation, epochs 200 to 250): the gap would shrink from 20 points to 9 to 12, not close. Scoring the saved S4D models on the same test windows needs no new training. The learning curve of this section would then show whether either design is short of background.

</div>

<div class="debate debate--verdict" markdown="1">

**Final verdict.** What stands is that both designs saw the same noise, 100,011 s of real data from both detectors in the first half of the third observing run, and the section's point that a design needing far more data would suit this task less well. The objection is right that equal data do not rule out the data as a cause, since they can help two designs unequally. The noise is reused heavily: each second of it is used 2.0 times per epoch, 284 times by the end of epoch 141. The free kernels also do worse on independent noise: from 41.6 and 41.9% within 1% on validation, whose noise comes from the same half of the run, to 31 and 28% on the test, whose noise comes from the second half ([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})). Our earlier S4D network did not drop (13.4% on validation, 14% on the test), but no S4D first layer has been scored on the test. If the S4D layers lost nothing there, the gap would shrink from 20 points to 9 to 12, an estimate rather than a measurement. Scoring the saved S4D models on the same test windows needs no training; the learning curve would then show whether either design is short of data.

Ruling: the objection is upheld.

</div>

## 8. Removing the chirp first: heterodyning

Our goal here is to take seriously the strongest alternative, which is to
make the signal steady before S4D sees it.

Suppose two waves of nearly equal frequency, $\cos(2\pi f_1 t)$ and
$\cos(2\pi f_2 t)$, are multiplied. The product,

$$
\tfrac12\cos\big(2\pi(f_1 - f_2)t\big) + \tfrac12\cos\big(2\pi(f_1 + f_2)t\big),
$$

is a slow beat at the difference frequency plus a fast term that is easy to
remove. Heterodyning a chirp works the same way. Multiply the data by
$e^{-i\Phi(t;\tilde{\mathcal M})}$, the conjugate of the chirp's phase for
an assumed chirp mass $\tilde{\mathcal M}$; a signal with the phase
$\Phi(t;\mathcal M)$ becomes one with the phase $\Phi(t;\mathcal M) -
\Phi(t;\tilde{\mathcal M})$. If the assumed chirp mass is right, the
leading-order phases cancel and what is left varies slowly, the kind of
signal for which a few fixed oscillators suffice
([derivation]({{ d | relative_url }}#proj-heterodyne)).
DINGO-BNS (Nature 639, 49 (2025),
[arXiv:2407.09602](https://arxiv.org/abs/2407.09602)) and the AFRAME binary
neutron star search ([arXiv:2607.01372](https://arxiv.org/abs/2607.01372))
both use this step
([23 September]({{ u | append: '2026-09-23-denoiser-scans/' | relative_url }})).

If the true chirp mass is $1 + \epsilon$ times the assumed one, the leftover
phase is $|1 - (1 + \epsilon)^{5/8}|$ times the chirp's own phase, which is
$\tfrac58|\epsilon|$ of it to first order
([derivation]({{ d | relative_url }}#sep-het-phase)). The leftover is itself
a chirp, with $\tfrac58|\epsilon|$ times the frequency of the original, and
over the last 3.5 to 4 s before the merger, the stretch a window holds, it
adds up to the following number of cycles
([derivation]({{ d | relative_url }}#oct15-het-grid)).

<div markdown="1">

| chirp-mass error | leftover cycles in the window |
|---|---|
| 0.1% | 0.18 to 0.40 |
| 1% | 1.75 to 3.98 |
| 2% | 3.5 to 8.0 |
| 5% | 8.7 to 20 |
| 10% | 17 to 41 |

</div>

Chirp masses 0.85 to 2.75 M☉, the last 3.5 and 4 s before the merger,
chirps aligned at the merger, leading order.

A grid of assumed chirp masses changes the picture. With ten masses spaced
evenly in log over 0.85 to 2.75 M☉, the nearest is never more than 6.7% off,
and the leftover is at most 23 to 25 cycles (median 8 to 9). With the
hundred masses of the AFRAME grid, spaced evenly in log over 1.0 to
2.5 M☉, the nearest is never more than 0.46% off, and the leftover is at
most 1.6 cycles ([derivation]({{ d | relative_url }}#oct15-het-grid)).

A possible objection is that a coarse grid turns our hard problem into a
much easier one, on which S4D could do well. This objection deserves to be
taken seriously, because it is our own claim applied: make the signal
steady, and S4D is in its element. After heterodyning at the nearest of a
hundred masses, less than two cycles are left over the window, close to the
steady case of Project 8. After heterodyning at the nearest of ten, up to 25
cycles of a slow chirp are left, far fewer than the original 281 to 636 but
not a steady signal.

What we have measured is little. Our only training tests with heterodyning
were on a denoiser, a network that cleans the signal rather than estimating
the chirp mass, and they used the true chirp mass. On the 16 s before the
merger, the denoiser's output reached an overlap (normalized product with
the true waveform, 1 when perfect) of 0.917 with heterodyning, against 0.900
without, though the two runs also differed in other settings; on the 4 s
window, heterodyning with a random chirp-mass error of 0.1% still gave 0.873
([23 September]({{ u | append: '2026-09-23-denoiser-scans/' | relative_url }})).
All three runs, like the other runs of that update, had dropout 0.2 inside
every layer, the setting that made our S4D chirp-mass regressors fail on
clean signals
([16 October]({{ u | append: '2026-10-16-why-dropout-broke-our-s4d/' | relative_url }}));
whether it also held these denoisers back has not been tested.
No test with an error of 1 to 10% exists. The experiment that decides the
question is a scan of the error: heterodyne with the chirp mass off by 0,
0.1, 1, 3, 5 and 10%, and train the same S4D network on each.

Therefore heterodyning is the natural way to give S4D a steady signal, and
how large an error it tolerates is the open question.

<div class="debate debate--objection" markdown="1">

**Objection.** *Re: "After heterodyning at the nearest of ten, up to 25 cycles of a slow chirp are left … but not a steady signal."* By the lecture's own measures, the leftover may already suit S4D. At the worst-case error of the ten-mass grid, 6.74%, the leftover's frequency is $\tfrac58 \times 6.74\% = 4.2\%$ of the chirp's, so its rate of change is 4.2% as large and its in-step time $1/\sqrt{0.042} = 4.9$ times longer. Counted as in section 4, it needs few Fourier waves: for the four leading-order chirps of the 7 October set, a match of 0.9 takes 476 to 744 waves before heterodyning and 23 to 34 after it at that error, and 3 to 7 at a 1% error (we computed these with the chirps aligned at the merger, as in the table above; [derivation]({{ d | relative_url }}#oct15-het-grid-worst)). That is comparable to the 32 oscillators of one channel of our earlier networks and well below the 256 of our larger layer. Our one heterodyne test also showed more than this section quotes: on the merger window, heterodyning with the true chirp mass lifted the denoiser's overlap from about 0.77 to 0.86 at a comparable epoch ([23 September]({{ u | append: '2026-09-23-denoiser-scans/' | relative_url }})). Until the error scan is run, the verdict on S4D should be limited to data that have not been heterodyned.

</div>

<div class="debate debate--rebuttal" markdown="1">

**Rebuttal.** Agreed. By the count of section 4 the leftover is no longer the hard case. At the ten-mass grid's worst errors, a true chirp mass 6.74% above or 6.31% below the nearest grid mass, the leftover's frequency and sweep are 4.0 to 4.2% of the chirp's, so it stays in step with a fixed wave 4.9 to 5.0 times longer, and the four leading-order chirps of the 7 October set need 21 to 34 Fourier waves for a match of 0.9 instead of 476 to 744 (3 to 7 at a 1% error; we computed both signs; corrected on 16 October, since the first version also took an error of 6.74% below, which lies outside the grid; [derivation]({{ d | relative_url }}#oct15-het-grid-worst)). That is one S4D channel's worth. The leftover also lies where the standard start already puts long-lived oscillators: at 1.2 M☉, while the chirp rises from 80 to 512 Hz the leftover stays between 3.2 and 21 Hz, and a channel of 32 oscillators lasting 1 s spans 0 to 31 Hz ([derivation]({{ d | relative_url }}#oct15-het-grid-worst)). The section also omits a result: on the 4 s merger window, heterodyning with the true chirp mass lifted the denoiser's overlap from about 0.77 to 0.86 at a comparable epoch, on mostly loud events ([23 September]({{ u | append: '2026-09-23-denoiser-scans/' | relative_url }})). Until the error scan of this section is run, the verdict of the lecture should be limited to data that have not been heterodyned.

</div>

<div class="debate debate--verdict" markdown="1">

**Final verdict.** The table of leftover cycles and the grid figures stand, and so does the fact that no test with a chirp-mass error of 1 to 10% exists. The objection is right that the section understates what heterodyning may do for S4D, and the rebuttal agrees. By the count of section 4, the leftover at the ten-mass grid's worst errors (a true chirp mass 6.74% above or 6.31% below the nearest grid mass) has 4.0 to 4.2% of the chirp's frequency, so a match of 0.9 takes 21 to 34 Fourier waves instead of 476 to 744, and 3 to 7 at a 1% error (we repeated the counts for both signs of the error; [derivation]({{ d | relative_url }}#oct15-het-grid-worst)). At 1.2 M☉ the leftover stays between 3.2 and 21 Hz ([derivation]({{ d | relative_url }}#oct15-het-grid-worst)). That is one S4D channel's worth, not hundreds. The section also omits a result: on the 4 s merger window, heterodyning with the true chirp mass lifted the denoiser's overlap from 0.77 to 0.86 (rounded values) at a comparable epoch, on mostly loud events ([23 September]({{ u | append: '2026-09-23-denoiser-scans/' | relative_url }})). Until the error scan proposed here is run, the lecture's verdict on S4D should be limited to data that have not been heterodyned.

Ruling: the objection is upheld.

</div>

## 9. Why 5 to 10% is not the goal

One might ask why we insist on 1%, when an S4D network might reach 5 or 10%,
which could be useful. Two facts set the goal. The standard method puts 94%
of events at SNR 8 to 10 within 1% on the same test windows (section 1).
And the window holds that information. The Cramér–Rao bound, the smallest
spread that any estimate that is right on average can have in the given
noise, is 0.198% of the chirp mass for the 3.5 s before the merger at SNR 8
to 12 (median over 55 events), five times smaller than 1%
([derivation]({{ d | relative_url }}#sep-fisher);
[5 October]({{ u | append: '2026-10-05-window-bound-and-prior-conditioning/' | relative_url }})).
The bound is optimistic this close to the noise, since it assumes that the
probability of the data, as a function of the chirp mass, has a single
smooth peak, but the standard method's 94% shows that 1% is reachable in
practice. A network that stops at 5 to 10% leaves most of
the information in the window unused.

A first guess good to 5 or 10% is still useful, and it connects to the
previous section. An estimate good to ±5% leaves 10 to 11 of the hundred
AFRAME grid masses as candidates for heterodyning, and one good to ±10%
leaves 21 to 22 ([derivation]({{ d | relative_url }}#oct15-grid-count)).
Such a network
could choose where to heterodyne, and a second stage working on nearly
steady data could refine the estimate. That is a different design from the
one we set out to test, and in my view a sensible one, but it is not a
reason to accept 5 to 10% as the answer.

Therefore 1% remains the goal, and 5 to 10% is useful as the first stage of
a two-stage design.

<div class="debate debate--objection" markdown="1">

**Objection.** *Re: "Therefore 1% remains the goal, and 5 to 10% is useful as the first stage of a two-stage design."* If 5 to 10% is useful as a first stage, the designs should also be compared there, and there the gap nearly closes. On the same validation events, averaged over epochs 200 to 250, the free kernels put 54.2% of events within 10% of the true chirp mass, the deeper S4D network 49.2% and the layer with 256 oscillators per channel 44.4%; within 1%, the same runs had 39.1%, 11.3% and 19.1% (training logs). This is what the lecture's own physics predicts, since a coarse estimate does not need the comparison to stay in step over the whole window and a 1% estimate does. The evidence is therefore against S4D for the 1% stage, but not clearly against it as the first stage of the two-stage design this section recommends.

</div>

<div class="debate debate--rebuttal" markdown="1">

**Rebuttal.** Partly agreed. A first stage should be judged at its own tolerance, and there the gap is smaller, as section 2 predicts for an estimate that need not stay in step over the whole window. Over epochs 200 to 250 the free kernels put 54.2% of validation events within 10%, the deeper S4D network 49.2% and the layer with 256 oscillators per channel 44.4%; within 5%, 48.2, 36.4 and 36.6%; within 1%, 39.1, 11.3 and 19.1% (training logs). But these fractions are over all SNRs, and three quarters of the events lie below SNR 8, where a network has little to go on. Our validation chirp masses cluster, half of them between 1.50 and 1.96 M☉, so a constant answer of 1.67 M☉, the free kernels' most frequent answer on windows that look like noise ([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})), already falls within 10% for 37.6% of events and within 5% for 18.8% (computed on the validation waveforms). At 10% all three networks lie within 17 points of that guess, and where each puts its default answer can decide their order. The fraction within 5 and 10% at SNR 8 to 12 decides the question; our logs record that band only at 1 and 2%, and scoring the saved models on the test windows would give it.

</div>

<div class="debate debate--verdict" markdown="1">

**Final verdict.** The goal stands: the standard method puts 94% of events at SNR 8 to 10 within 1% on our test windows. The objection is partly right. A first stage should be compared at its own tolerance, and there the gap is smaller: over epochs 200 to 250 the free kernels put 54.2% of validation events within 10%, the deeper S4D network 49.2% and the layer with 256 oscillators per channel 44.4%. But these fractions are over all SNRs, three quarters of the events lie below SNR 8, and a constant answer of 1.67 M☉, which the free kernels often give to windows that look like noise, already falls within 10% for 37.6% of the validation events (we checked this on the validation waveforms). All three networks lie within 17 points of that guess, and within 5% the gap is still 12 points (48.2% against 36.4 and 36.6%). The evidence therefore does not show the gap closing where a first stage would work. The fraction within 5 and 10% at SNR 8 to 12 would settle it; our logs record that band only at 1 and 2%, and scoring the saved models on the test windows would give it.

Ruling: the objection is partly upheld.

</div>

## 10. Summary, conclusion and next steps

In summary, the standard method reads the chirp mass of a weak binary
neutron star signal by adding its 281 to 636 cycles in step with a copy of
the expected wave; at SNR 8 each cycle carries an SNR of 0.32 to 0.48
($8/\sqrt N$ for $N$ cycles), and a steady
drift of half a cycle across the window costs 36% of the sum. An S4D layer
is a set of driven, damped oscillators with frequencies fixed after
training, and it compares the data with a fixed sum of decaying waves that
all start at the present. A steady signal needs one such oscillator per
line; a chirp stays in step with one fixed frequency only for $\dot
f^{-1/2}$, 0.24 s at 100 Hz for 1.2 M☉, and one channel that is its filter
needs at least 115 to 239 oscillators in our window, each tuned to its part
of the chirp and fading at the right rate. On clean signals every network
we tried, S4D included, puts 99.8 to 100% of events within 1% once dropout
is removed. In noise, with the same data and final step, single S4D layers
with 32 to 32,768 oscillators behind each shape put 6 to 24% of validation
events within 1%, and free kernels 38 to 42%; a final step retrained from
scratch changes each network's score by less than a point, so the filters
set it.

In conclusion, one S4D layer, as we started and trained it, is a poor fit
for reading the chirp mass of a weak chirp: at equal settings the best one
put half as many events within 1% as one layer of free kernels, and its
filters, not its final step, set that limit. It can represent a chirp; the
difficulty is that one channel must hold at least 115 to 239 oscillators
that agree in phase, each fading at the right rate, and that training must
bring them there from starting values mostly far from the chirp, by small
steps across many false peaks in frequency. With 32 per channel the count
is not met; with 256 it is, but training left the frequencies close to
where they started. The last point is our explanation, not a proof. Our
data concede more than the first version of this lecture said. The
clean-signal gap I reported was dropout, not S4D or its last step. Why S4D
works on clean signals is not established, and its clean precision rests on
the chirp switching on at the window's first sample. The deeper S4D network
and our earlier S4D network with a denoiser had dropout 0.2. The
single-layer S4D runs with the standard start partly read a numerical
artefact. And whether a deeper or better-tuned S4D closes the gap is
untested.

Our next step is then to run the tests that could prove this wrong: the
noisy version of the signal-only comparison, with S4D at dropout 0, aframe's
ResNet and the free kernels under the same settings, and our earlier S4D
network with a denoiser rerun without dropout
([16 October status]({{ u | append: '2026-10-16-status-dropout-and-signal-only/' | relative_url }})),
then the learning curve of section 7 and the heterodyne scan of section 8.
The time-warp test is being redone at dropout 0 (same source). At leading
order, in the time coordinate $(t_c - t)^{5/8}$, with $t_c$ the time of the
merger, the chirp becomes a steady wave whose frequency is set by the chirp
mass, so warping the time axis is another way to make the signal steady
before S4D sees it ([derivation]({{ d | relative_url }}#time-warp)).

I suggest therefore that we use S4D where the physics is steady. LIGO's own
noise has narrow lines in its spectrum, "narrow spectral artifacts (lines)
due to instrumental or environmental disturbances" in the words of a LIGO
study of the first two observing runs (Phys. Rev. D 97, 082002 (2018),
[arXiv:1801.07204](https://arxiv.org/abs/1801.07204)). By Fourier's theorem
a narrow line is an oscillation that persists for a long time, which a few
fixed oscillators describe well. For the chirp itself, I suggest keeping
reference shapes that can follow a sweep, such as the free kernels, until
one of the tests above shows otherwise.

<div class="debate debate--objection" markdown="1">

**Objection.** *Re: "…and by small steps across many false peaks in frequency."* We checked the false peaks for a chirp: they grow with the oscillator's lifetime and come from the window's abrupt start. For one oscillator against a leading-order 1.2 M☉ chirp, read backwards from the merger as in section 1, we computed the overlap as the oscillator's frequency moves from 100 to 300 Hz. With a lifetime (the time in which it fades by a factor $e$) of 0.25 s the overlap has no local peak at all; with 0.5 s its peaks rise at most 0.02% above the values 0.15 Hz away; with 1 s, 1.9%; with 4 s, 43%, at intervals of 0.25 Hz. When the chirp's onset at the far end of the window is tapered over half a second, the peaks vanish even for a 4 s lifetime. A chirp sweeps through every frequency, so wherever the oscillator sits it meets the chirp when the chirp passes that frequency. In the run with the standard start, most in-band oscillators lasted under a second after 200 epochs (26% in band, 7% in band and longer than 1 s; [brainstorm]({{ '/projects/bns/brainstorm/' | relative_url }})), so false peaks cannot explain why it stopped at 18 to 24%. They may explain part of the band start's poorer result, since its oscillators all lasted 4 s, and a taper would remove them.

</div>

<div class="debate debate--rebuttal" markdown="1">

**Rebuttal.** Partly agreed. For a chirp the false peaks are not the side peaks of a steady signal. We scanned one oscillator's overlap with a leading-order chirp across 60 to 300 Hz. The ripples come from the window's abrupt far edge and, in our check at 1.2 M☉, vanish when its first 0.5 s is tapered; their height grows with the share of the oscillator's amplitude left at that edge, $e^{-4\,{\rm s}/T}$ for lifetime $T$: 0.02 to 0.04% at 0.5 s, 1.7 to 2.4% at 1 s, 13 to 19% at 2 s and 38 to 58% at 4 s (1.2 and 2.0 M☉). After 200 epochs of the standard start, 26% of the oscillators were in band and 7% were in band with lifetimes over 1 s ([brainstorm]({{ '/projects/bns/brainstorm/' | relative_url }})), so false peaks are unlikely to be the main reason that run stopped at 18 to 24%, and "many false peaks" in the summary is too broad. But the oscillators that the early part of the chirp needs, in band and lasting 2 to 4 s, meet ripples of 13% and more, and the band start began with only such oscillators. The taper is the test: train both starts on windows whose first 0.5 s is tapered and see whether either improves.

</div>

<div class="debate debate--objection" markdown="1">

**Objection.** *Re: "I suggest therefore that we use S4D where the physics is steady."* Before S4D is given the lines, it should be shown that they are still in the data the network sees. Each of our windows is whitened with a noise spectrum measured over the 20 s just before it, in bins 0.5 Hz wide (run configuration), which is meant to divide out lines that stay steady over that time. What remains for fixed oscillators are lines narrower than a bin or changing within those 20 s, and how much of our chirp-mass error they cause has not been measured. No test of S4D on lines exists in this project, so this suggestion rests on the analogy of section 4 alone.

</div>

<div class="debate debate--rebuttal" markdown="1">

**Rebuttal.** Partly agreed: no test of S4D on lines exists in this project, and the suggestion rests on the analogy of section 4. But the lines are still in the data the network sees. Our whitening uses a noise spectrum measured over the 20 s before each window in bins 0.5 Hz wide, and then cuts the whitening response to 1 s with a Hann taper (run configuration; ml4gw's whitening code), which blurs that spectrum over ±2 Hz, the half-width of the main lobe of a Hann window 1 s long (Harris 1978, *Proceedings of the IEEE* 66, 51, [doi:10.1109/PROC.1978.10837](https://doi.org/10.1109/PROC.1978.10837)), so a narrow line is only partly divided out. In a simulation with the same settings, a steady line 100 times the noise floor of its 0.5 Hz bin still stood 20 times above the floor of the whitened 4 s window, against 161 before whitening, and narrow lines remain in the average whitened spectrum of 400 empty test windows ([derivation of the benchmark's noise floor]({{ d | relative_url }}#oct7-noise-floor)). What has not been measured is whether they move our chirp-mass estimates, and that comes first. The free kernels make the test cheap, since they are stored as a spectrum: set their weights to zero at the line frequencies and score them again. Only if the fraction within 1% rises is there a task for S4D, or for removing those frequencies outright. In my view the steady signal that matters more here is the leftover after heterodyning (section 8).

</div>

<div class="debate debate--verdict" markdown="1">

**Final verdict.** What stands is the physics of section 2 and the measurement: at our SNRs only a reference kept in step over the whole window recovers the full SNR, and in our runs the free kernels learned such references far better than any S4D layer (39.1% against at most 19.1%). The conclusion should be limited to S4D as we started and trained it, on data that have not been heterodyned. Of its explanation, the poor start is supported by the saved models, while the number of parts (at least 115 to 239 per channel, section 4 as revised on 16 October) and the fading concern how many waves a channel needs, not what it can hold. On the false peaks the objection is right: for a chirp they come from the window's abrupt far edge, grow with the oscillator's lifetime, from 0.02% at 0.5 s to 38 to 58% at 4 s, and vanished in our check when the first 0.5 s was tapered. On the lines the objection is partly right: no S4D test exists and their effect on our error is unmeasured, but whitening does not remove them, since narrow lines remain in the average whitened spectrum of empty test windows. I suggest training both starts on tapered windows, and scoring the free kernels again with their weights set to zero at the line frequencies.

Rulings on the two objections, in order: upheld, partly upheld.

</div>
