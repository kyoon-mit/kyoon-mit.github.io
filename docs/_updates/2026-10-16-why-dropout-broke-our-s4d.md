---
title: "Why dropout broke our S4D chirp-mass regressor"
date: 2026-10-16
tags: [s4d, regression]
math: true
summary: >-
  Dropout switches random channels off in training and scales the rest up,
  which keeps the average of anything linear in those channels and of
  nothing else. Our S4D regressor had dropout inside every block, ahead of
  nonlinear layers, so the network used in evaluation differed from the one
  that training had tuned, whether the read-out took the mean over time or
  the maximum; the maximum adds a bias of its own (Jensen's inequality). With
  dropout 0 both read-outs put 99.9% of clean validation events within 1% of
  the true chirp mass, against 36.9% (mean) and 16.0% (maximum) with dropout
  0.2.
---

{%- assign u = '/projects/bns/updates/' -%}
{%- assign d = '/projects/bns/derivations/' -%}

{% include notice-snr-powerlaw.html %}

The [16 October status]({{ u | append: '2026-10-16-status-dropout-and-signal-only/' | relative_url }})
reports that our small S4D regressors failed on clean signals because of
dropout. This page explains how: first in words, then with the equations,
then with measurements on the trained networks.

A network runs in one of two modes. In training mode it adjusts its weights,
and random steps such as dropout are on. In evaluation mode, used for
validation and for every later use, the weights are fixed and the random
steps are off. Dropout, in training mode only, sets each channel of each
example to zero with probability $p$ and multiplies the channels that
survive by $1/(1-p)$; a new random choice of channels, a dropout pattern, is
drawn for every example at every step. With $p = 0.2$ a fifth of the
channels are switched off and the rest are multiplied by 1.25. Its purpose
is to keep a network from fitting the particular training examples
(Srivastava et al., JMLR 15, 1929 (2014); Hinton et al. 2012,
[arXiv:1207.0580](https://arxiv.org/abs/1207.0580)).

## The short answer

- **What dropout keeps.** Each value keeps its average over dropout
  patterns, since $0.8 \times 1.25 = 1$. So does anything linear in the
  values: a sum, a mean over time, a linear layer. Nothing else does,
  because the average of a nonlinear function is not the function of the
  average ([derivation]({{ d | relative_url }}#oct16-dropout-linear)).
- **Where our dropout sat.** Our S4D has two dropouts in each of its four
  blocks. Each is followed by at least one nonlinear step (a gate, a
  normalization, a GELU, or the maximum) before the output, except one: with
  the mean over time as the read-out, the last dropout reaches the output
  through linear steps only. So with the mean, seven of the eight dropouts
  can shift the average output, and with the maximum all eight
  ([derivation]({{ d | relative_url }}#oct16-dropout-where)).
- **What that does.** Training sees the network only with dropout on, and
  pulls the average of its dropout-on estimates toward the true chirp mass.
  Evaluation uses the network with dropout off, whose estimates sit
  elsewhere: on the same windows with the same weights, a median of 4.9%
  away from that average for the maximum read-out (epoch 232) and 1.5% for
  the mean (epoch 48), against the 1% we ask for
  ([derivation]({{ d | relative_url }}#oct16-dropout-offset)).
- **The maximum has a mismatch of its own.** The maximum of values that
  fluctuate is on average at least as large as the maximum of their
  averages (Jensen's inequality), so dropout also raises the maxima that the
  read-out learns from ([derivation]({{ d | relative_url }}#oct16-dropout-max)).
  Measured, they were on average 1.196 to 1.308 times larger with dropout on
  (epochs 30 to 232). In validation the maximum read-out fell below 1% from
  epoch 7 to 32 and never passed 16.0%, while the mean read-out stayed
  between 15.8 and 36.9%.
- **Dropout 0 fixes it.** With dropout 0 both read-outs reach 99.9% of
  clean validation events within 1%. The other differences between the runs
  are listed below; none of them changes the network itself.

## The runs

All five are the S4D 64 × 32 × 4 regressor of the
[signal-only test]({{ u | append: '2026-10-14-signal-only-test/' | relative_url }}):
64 channels, state size 32, 4 blocks and 51,010 learned numbers
([check]({{ d | relative_url }}#oct16-dropout-where)), fed the whitened
injected waveform alone, with no detector noise. Two detectors at 2048 Hz,
4 s windows, SNR drawn from a power law with index −3 from 4 to 100, and
50,048 training windows per epoch drawn from 200,000 waveforms. The loss is
a β-weighted Gaussian likelihood (β = 0.3; Seitzer et al. 2022,
[arXiv:2203.09168](https://arxiv.org/abs/2203.09168)) plus a penalty, with
weight 0.2, when the estimates in a batch spread less than the true values.
Validation runs after every epoch on 2,048 windows (64 batches of 32), in
evaluation mode, so with dropout off
([check]({{ d | relative_url }}#oct16-dropout-where)).

<div class="table-scroll" markdown="1">

| run | after the 4 blocks | dropout | best validation within 1% | log read to epoch |
|---|---|---|---|---|
| [real, maximum](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_max_64x32x4) | maximum over time of each channel, linear layer | 0.2 | 16.0% (epoch 63) | 232 (last) |
| [real, maximum](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_max_dropout0_64x32x4) | the same | 0 | 99.9% (epoch 198) | 285 (training) |
| [real, mean](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_64x32x4) | mean over time of each channel, linear layer | 0.2 | 36.9% (epoch 19) | 48 (last) |
| [real, mean](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_dropout0_64x32x4) | the same | 0 | 99.9% (epoch 151) | 241 (training) |
| [complex, energy and maximum](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_complex_energy_max_64x32x4) | blocks 1 to 3 as above; then a group norm, a complex S4D kernel, the log of 1 plus the energy, the maximum over time, a linear layer | 0.2 | 97.5% (epoch 55) | 61 (last) |

</div>

"Real" is the usual S4D, whose outputs are real numbers; the complex version
keeps the complex output of its last kernel. Within a read-out the two runs
differ in the dropout rate and in settings for memory use and for stopping,
which change neither the network nor the way the training data are drawn.
The mean pair also differs in its learning-rate schedule: the dropout-0.2
mean run used a reduce-on-plateau schedule in its first 42 epochs and the
warm-restart cosine schedule after
([signal-only test]({{ u | append: '2026-10-14-signal-only-test/' | relative_url }})),
while the others used the cosine schedule from the start, with the rate
rising from 1% to its full value over the first 10 epochs. The comparison
on the same weights further down does not depend on the schedule. The dropout-0.2 maximum
run reached 10.8% at epoch 5, stayed at or below 0.83% from epoch 7 to 32,
and then ranged from 2.5 to 16.0% up to epoch 232. I read the logs on 16
October at 11:45; the two dropout-0 runs are still training under the
stopping rule of the status page.

{% include figure.html
   src="/assets/img/bns/2026-10-16/dropout_curves.png"
   alt="Fraction of events within 1% of the true chirp mass against epoch for five S4D 64 by 32 by 4 runs, in two panels. Left, maximum over time: with dropout 0 the real network rises to 99.9%; with dropout 0.2 its validation falls to near 0 after epoch 6 and stays below 16%, while its accuracy on its own training batches with dropout on rises steadily to 59.9%; the complex energy-and-maximum read-out with dropout 0.2 reaches 97.5%. Right, mean over time: dropout 0 reaches 99.9%; dropout 0.2 stays between 15.8 and 36.9% in validation and reaches 51.7% on its training batches with dropout on."
   label="Validation within 1% by epoch"
   caption="Every epoch, no smoothing, from the runs' training logs. Solid: validation, with dropout off. Dashed: the dropout-0.2 runs on their own training batches, with dropout on, averaged over each epoch while the weights change. Training batches and validation windows are made the same way but are not the same windows; the like-for-like comparison is the table further down. The dropout-0 runs are still training." %}

## What dropout keeps, and what it does not

Write the dropout factor of one channel as $\xi$: $\xi = 1/(1-p)$ with
probability $1-p$ and $\xi = 0$ with probability $p$. Then

$$
E[\xi] = 1, \qquad {\rm Var}[\xi] = \frac{p}{1-p} = 0.25 \quad (p = 0.2).
$$

For anything linear in the values, $L(v) = b + \sum_i w_i v_i$, linearity
of the average gives $E[L(\xi v)] = L(v)$, whether or not the factors are
independent. For a nonlinear function $f$ of one value,

$$
E[f(\xi v)] = (1-p)\,f\!\left(\frac{v}{1-p}\right) + p\,f(0) ,
$$

which in general is not $f(v)$. For the square it is $1.25\,v^2$; for the
GELU at $v = 1$ it is 0.894, against ${\rm GELU}(1) = 0.841$
([derivation]({{ d | relative_url }}#oct16-dropout-linear)). The scaling
was designed so that "for any hidden unit the expected output (under the
distribution used to drop units at training time) is the same as the actual
output at test time" (Srivastava et al. 2014, section 1): a promise about
each dropped value, which linearity extends to linear functions of them and
to nothing else. Ma et al. call the difference between the average over
dropout patterns and the network with dropout off the inference gap; it is
zero for a linear layer and not in general (ICLR 2017,
[arXiv:1609.08017](https://arxiv.org/abs/1609.08017)). Li et al. show that
dropout changes the variance of the values after it between training and
evaluation, and name the resulting mismatch with a batch normalization,
which stores the variance seen in training, the variance shift (CVPR 2019,
[arXiv:1801.05134](https://arxiv.org/abs/1801.05134)).

## Where our dropouts sit

A linear layer first turns the two detector samples at each time into 64
channels. Each of the four blocks then does: a group norm; the S4D layer,
which convolves each channel with its own kernel as long as the window, adds
a learned multiple of the channel, applies a GELU, then a dropout, then a
linear layer to 128 channels and a gate (GLU) back to 64; a second dropout;
and it adds the block's input back (a residual connection). After the
fourth block the read-out reduces each channel to one number, its mean or
its maximum over time, and a linear layer turns the 64 numbers into the
estimate and its variance
([derivation]({{ d | relative_url }}#oct16-dropout-where)).

The group norms normalize only what enters each block's S4D layer. The
series that the read-out pools is the output of the first linear layer plus
the four blocks' dropped outputs, never normalized. For the mean read-out, the second dropout of the fourth
block reaches the output through linear steps alone (the sum, the mean, the
linear layer), so on average it changes nothing. Every other dropout passes
through a GLU, a later group norm or a later GELU first. For the maximum
read-out the maximum is itself a nonlinear step, so all eight count. The
mean read-out was therefore never protected by the linearity of the mean.

## The maximum adds a bias of its own

For any time series that varies at random, the average of its maximum is at
least the maximum of its average:

$$
E\Big[\max_t y(t)\Big] \;\ge\; \max_t E[y(t)] ,
$$

because the maximum is at least the value at any fixed time, and that stays
true after averaging. This is Jensen's inequality for the maximum, which is
a convex function (Boyd and Vandenberghe, *Convex Optimization*, 2004,
sections 3.1.5 and 3.1.8). The change of the maximum between training and
evaluation is this excess, which is never negative, plus the shift that the
nonlinear steps cause in the series itself, which can have either sign; a
mean over time has only the second part
([derivation]({{ d | relative_url }}#oct16-dropout-max)). The excess is the
average amount by which other times overtake the time that wins on average,
when the pattern changes, so it is large when many times come close to the
winner.

A toy shows its size. Add 64 channels of independent Gaussian values over
1,000 time steps, with channel dropout $p = 0.2$ before the sum, a purely
linear step. The mean over time is unchanged on average, and the average
maximum rises by 11.8%: dropout multiplies the variance of the sum by
$1/(1-p)$, so its standard deviation by close to $1/\sqrt{1-p} = 1.118$, and
the maximum of Gaussian values sits a fixed number of standard deviations
above their mean. When a peak shared by all channels dominates, the time of
the maximum hardly moves and the rise falls to 0.7%
([derivation]({{ d | relative_url }}#oct16-dropout-toy)). Our
network is not this toy; the size in the trained network is measured below.

## The same weights with dropout off and on

On 15 October I took 3,915 clean signal windows made by our training
pipeline (SNR from 8 to 100), loaded checkpoints of the runs, and computed
the estimates with dropout off and with dropout on (the average over three
random seeds, each scored on its own). "Average of 16" first averages the
estimates from 16 dropout patterns and then scores them (Monte Carlo
dropout; Gal and Ghahramani, ICML 2016,
[arXiv:1506.02142](https://arxiv.org/abs/1506.02142)), on the first 512 of
the windows; the dropout-off value on those 512 is in brackets. The pooled
value is the mean of the 64 numbers the final linear layer receives
([method and all numbers]({{ d | relative_url }}#oct16-dropout-same-windows)).

<div markdown="1">

| run, checkpoint | within 1%, dropout off | within 1%, dropout on | average of 16 (off) | pooled value, off / on |
|---|---|---|---|---|
| real maximum, dropout 0.2, epoch 5 (14 October) | 14.7% | 4.6% | | |
| real maximum, dropout 0.2, epoch 30 (14 October) | 0.1% | 31.3% | | 0.905 / 1.184 |
| real maximum, dropout 0.2, epoch 63 | 13.0% | 39.5% | 70.3% (14.3%) | 0.885 / 1.113 |
| real maximum, dropout 0.2, epoch 232 | 8.2% | 59.1% | 87.7% (9.4%) | 0.659 / 0.788 |
| real mean, dropout 0.2, epoch 48 | 35.5% | 51.3% | 86.9% (37.7%) | 0.118 / 0.107 |
| complex energy and maximum, dropout 0.2, epoch 62 | 96.1% | 88.9% | 95.7% (96.3%) | 2.316 / 2.334 |
| real maximum, dropout 0, epoch 29 | 90.0% | 90.0% | 88.1% (88.1%) | 2.014 / 2.014 |

</div>

Each network has its own scale for the pooled values, so compare off with
on within a row. What the table shows:

- **It is the mode, not the data.** The same weights on the same windows
  put 59.1% of the estimates within 1% with dropout on and 8.2% with it
  off, at epoch 232 of the maximum run. The validation collapse is not a
  difference between training and validation data.
- **Both real read-outs learned chirp mass.** The average of 16 dropout
  patterns puts 87.7% (maximum) and 86.9% (mean) of the 512 windows within
  1%, against 9.4% and 37.7% with dropout off. What the networks learned is
  calibrated for dropout on.
- **The pooled values move, in both directions.** With dropout on, the
  maxima are 1.196 times larger at epoch 232, 1.257 at epoch 63 and 1.308
  at epoch 30. The means of the mean run are 0.903 times as large with
  dropout on: a mean has no excess of its own, so this shift comes from the
  nonlinear steps before it.
- **The estimates move.** The dropout-off estimate sits a median of 4.9%
  (maximum, epoch 232), 1.5% (mean, epoch 48) and 0.11% (complex, epoch 62)
  away from the 16-pattern average
  ([derivation]({{ d | relative_url }}#oct16-dropout-offset)): more than the
  1% margin for both real read-outs, far less for the complex one. For the
  maximum run it moved more than 1% for 91% of the windows, and downward for
  70%.
- **With dropout 0 there is nothing to switch.** Off and on agree exactly.

## Why the complex energy-and-maximum read-out survived

The complex network keeps a maximum over time, yet with dropout 0.2 it
reached 97.5% in validation, and its dropout-off estimates sit a median of
only 0.11% from the dropout average. Its code differs from the real
networks in two ways. No dropout acts after the third block, so none acts
directly on the values that the maximum picks from. And right before the
energy sits a group norm, which for every example, in training and in
evaluation alike, rescales each pair of channels to mean 0 and spread 1
over the window (then applies a learned scale and offset). Whatever dropout does to the
overall level and size of a pair is divided out in the same way in both
modes; a group norm stores nothing from training, so the variance shift
cannot mislead it. What dropout does to the shape of the channels over time
still passes through ([derivation]({{ d | relative_url }}#oct16-dropout-energy)).
Measured, its pooled values change by a factor 1.008 between the modes,
against 1.196 for the real maximum and 0.903 for the real mean.

I have not tested which of the two features matters. A further possible
reason, also untested: the energy of a complex filter's output is a smooth
envelope whose peak is set by the signal, so a dropout pattern rarely moves
the time of its maximum, as in the toy with a shared peak, whereas a real
channel that oscillates with the chirp has many nearly equal peaks for a
pattern to choose between.

## When the maximum run collapsed (a hypothesis)

At epoch 5 the maximum network was better with dropout off (14.7%) than on
(4.6%); by epoch 30 the order had flipped (0.1% against 31.3%). My
hypothesis, not tested: early in training the random noise that dropout
adds to each estimate costs more than the offset, so the dropout-off
network does better. The offset stays at several percent while training
makes the dropout-on estimates more precise, and once their errors fall
below the offset, the dropout-off estimates leave the 1% band. It fits the
timing: validation reached its early peak, 10.8%, at epoch 5, when the
accuracy on training batches was 4.3%, and had fallen to 0.44% by epoch 8,
when that accuracy reached 9.6%. The learning rate was still rising then,
which may also play a part. The checkpoints of epochs 6 to 29 were not
kept, so I cannot check this on the same windows. I also have no tested
explanation for the partial recovery of validation after epoch 32.

## Fixes, and what each costs

1. **Dropout 0** (done). It costs no computation and brings both real
   read-outs to 99.9% in validation. It gives up dropout's guard against
   fitting the particular training examples, which matters when a network
   sees a fixed, limited training set (Srivastava et al. 2014). Here every
   epoch draws 50,048 windows from 200,000 waveforms with new sky
   positions, polarization angles and SNRs, for a network of 51,010 learned
   numbers, and I see no sign of it: over the last ten epochs read, the
   accuracy on training batches and in validation agree, 99.72% and 99.73%
   for the maximum run (epochs 276 to 285) and 99.79% and 99.75% for the
   mean run (epochs 232 to 241).
2. **A group norm right before the pooling**, as the complex read-out has.
   It adds one normalization. It removes changes of a pair's overall level
   and size but not of shape, and it hides the overall size of the features
   from the read-out. Not tested on the real read-outs.
3. **Monte Carlo dropout at evaluation.** Keep dropout on and average $K$
   passes: with $K = 16$, 87.7% (maximum, epoch 232) and 86.9% (mean, epoch
   48) of the 512 windows within 1%. It costs $K$ times the computation at
   every evaluation and leaves some randomness in each estimate.
4. **Dropout only after the pooling.** With no dropout inside the blocks
   and one on the 64 pooled values, right before the final linear layer,
   the average output is kept exactly, by linearity, at no cost in
   computation. Not tested.
5. **Penalizing the gap in training.** Ma et al. add to the loss the
   squared difference between the outputs with dropout on and off; in their
   words, "the only additional computational cost comes from the
   deterministic term", one extra pass with dropout off per training step
   (their section 5.2). Not tested.

The status page says which other runs used dropout and are being redone
without it.
