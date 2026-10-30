---
title: "Clean signals with dropout off: every network reaches about 100% within 1%"
date: 2026-10-16
tags: [s4d, cnn, regression]
summary: >-
  Our S4D regressors failed on clean signals because of dropout, not because
  of S4D or of averaging over time. With dropout off, S4D, aframe's ResNet, a
  dilated CNN and free kernels all put 99.7 to 100% of clean validation events
  within 1% of the true chirp mass. The time-warp table, redone at dropout 0:
  every cell reaches 90.6% or more within 1% (final values added 30 October).
  The stopping rule, links to every run, and open questions from Claude.
---

{%- assign u = '/projects/bns/updates/' -%}
{%- assign d = '/projects/bns/derivations/' -%}

{% include notice-snr-powerlaw.html %}

This update corrects earlier ones. The
[14 October signal-only test]({{ u | append: '2026-10-14-signal-only-test/' | relative_url }})
concluded that a plain S4D is the weaker learner even without noise, and the
[S4D and Project 8 update]({{ u | append: '2026-10-14-s4d-project-8-vs-bns/' | relative_url }})
repeated those numbers. Both used S4D regressors with dropout 0.2 inside every
layer. The numbers were real, but the cause was dropout.

## Dropout off: S4D reads clean chirps

The test is the one of 14 October: the whitened injected waveform alone, no
detector noise, SNR drawn from a power law with index −3 from 4, 4 s windows
at 2048 Hz. The S4D is the small one (64 channels, 32 states, 4 layers). Only
the dropout rate changes between rows of a pair. Best validation fraction of
events within 1 / 2 / 5 / 10% of the true chirp mass:

<div markdown="1">

| network | end of network | dropout | within 1 / 2 / 5 / 10% | run |
|---|---|---|---|---|
| S4D 64 × 32 × 4 | mean over time | 0.2 | 36.9 / 58.3 / 99.8 / 100 | [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_64x32x4) |
| S4D 64 × 32 × 4 | mean over time | 0 | 99.9 / 100 / 100 / 100 | [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_dropout0_64x32x4) |
| S4D 64 × 32 × 4 | maximum over time | 0.2 | 16.0 / 24.0 / 39.0 / 79.5 | [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_max_64x32x4) |
| S4D 64 × 32 × 4 | maximum over time | 0 | 99.9 / 99.9 / 100 / 100 | [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_max_dropout0_64x32x4) |

</div>

Why dropout does this, with the mathematics, a toy model and the measured
mismatch between training and evaluation, is in
[a separate update]({{ u | append: '2026-10-16-why-dropout-broke-our-s4d/' | relative_url }}).
In short: dropout switches parts of the network off at random during training
and not at evaluation, and the scaling that keeps averages right holds only for
quantities linear in the switched values. Our dropout sat before nonlinear
layers, so both endings saw a different network in training than in
evaluation. The maximum was hit hardest.

## The signal-only comparison

The comparison asked for strictly the same task and settings for every
architecture: weight decay 0.01 and the same schedule and data as the
free-kernel run of 14 October, changing only the network. One difference
remains: the CNNs and free kernels used learning rate 10⁻³, while the S4D kept
the learning rates of its earlier runs, 10⁻⁴, and 10⁻³ for the S4D
parameters. Each entry gives the four values at the epoch with the best
within 1%:

<div markdown="1">

| network | what it is | within 1 / 2 / 5 / 10% | run |
|---|---|---|---|
| free kernels | one convolution layer (a CNN with one layer) of 256 learned 4 s kernels, energy, maximum over time | 99.8 / 100 / 100 / 100 | [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_free_kernel) |
| aframe ResNet | a deep CNN: 16 residual blocks of 3-sample convolutions, average over time | 100 / 100 / 100 / 100 | [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_resnet) |
| ResNet, free-kernel ending | the same body, energy and maximum over time instead of the average | 99.9 / 100 / 100 / 100 (epoch 36; training paused) | [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_resnet_energy_max) |
| dilated CNN | 9 residual blocks of 3-sample convolutions spaced 1, 2, 4, …, 256 samples apart (Yu and Koltun, ICLR 2016, [arXiv:1511.07122](https://arxiv.org/abs/1511.07122)), so each output sees the whole 4 s | 100 / 100 / 100 / 100 | [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_dilated_cnn_energy_max) |
| S4D 64 × 32 × 4, maximum | as above, dropout 0 | 99.9 / 99.9 / 100 / 100 | [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_max_dropout0_64x32x4) |

</div>

Without noise, every architecture we tried learns the map from the chirp to
its chirp mass to better than 1% for nearly every event. The clean test
therefore does not separate the architectures; only the noisy test does.
What the S4D layers compute, and what limits them in noise, is in
[What S4D computes]({{ u | append: '2026-10-16-what-s4d-computes/' | relative_url }}).

## The time-warp table, redone at dropout 0

The 15 October warp tests compare four endings of the same small S4D on three
inputs: the merger window as it is, the merger window with its time axis
warped so the leading-order chirp becomes a steady oscillation
([derivation]({{ d | relative_url }}#time-warp)), and the earliest 4 s window
our data allow, ending 25.0 to 25.5 s before the merger
([derivation]({{ d | relative_url }}#oct16-merger-position)), warped and
sampled at 256 Hz. All twelve
runs had dropout 0.2. Since dropout is the bug, the table was redone with
dropout 0 and nothing else changed. Final values (updated 30 October from the
training logs), within 1 / 2 / 5 / 10%, at the epoch with the best within 1%.
"Done" means the stopping rule below ended the run; "crashed" means a crash
ended it first; "epoch limit" means the run was given a fixed limit of 60 or
160 epochs instead of the rule. Runs that crashed or hit a limit may not have
reached their best:

<div markdown="1">

| ending | merger | merger, warped | 25.0 to 25.5 s before merger, warped |
|---|---|---|---|
| real, mean over time | 99.9 / 100 / 100 / 100, best at epoch 235, ran to 244, crashed [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_dropout0_64x32x4) | 94.2 / 99.3 / 100 / 100, best at epoch 108, ran to 110, crashed [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_dropout0_64x32x4_warp_merger) | 100 / 100 / 100 / 100, best at epoch 99, ran to 179, done [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_dropout0_64x32x4_warp_premerger) |
| real, maximum over time | 99.9 / 100 / 100 / 100, best at epoch 285, ran to 289, done [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_max_dropout0_64x32x4) | 98.0 / 99.4 / 100 / 100, best at epoch 121, ran to 149, crashed [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_max_dropout0_64x32x4_warp_merger) | 100 / 100 / 100 / 100, best at epoch 261, ran to 274, crashed [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_max_dropout0_64x32x4_warp_premerger) |
| complex, mean over time | 98.6 / 100 / 100 / 100, best at epoch 57, ran to 59, epoch limit [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_complex_mean_dropout0_64x32x4) | 90.6 / 98.5 / 99.8 / 100, best at epoch 159, ran to 159, epoch limit [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_complex_mean_dropout0_64x32x4_warp_merger) | 100 / 100 / 100 / 100, best at epoch 42, ran to 59, epoch limit [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_complex_mean_dropout0_64x32x4_warp_premerger) |
| complex, energy and maximum | 97.8 / 99.9 / 100 / 100, best at epoch 46, ran to 59, epoch limit [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_complex_energy_max_dropout0_64x32x4) | 95.4 / 99.1 / 99.9 / 100, best at epoch 117, ran to 148, crashed [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_complex_energy_max_dropout0_64x32x4_warp_merger) | 99.7 / 99.9 / 100 / 100, best at epoch 36, ran to 59, epoch limit [log](https://wandb.ai/kyoon-mit-massachusetts-institute-of-technology/CLAUDE-TESTS/runs/sig_only_reg_s4d_complex_energy_max_dropout0_64x32x4_warp_premerger) |

</div>

Every cell reaches 90.6% or more within 1%. In every row the warped merger
window is the lowest (90.6 to 98.0%), against 97.8 to 99.9% for the merger
window as it is and 99.7 to 100% for the warped early window. With dropout 0.2
the complex endings had reached 97.5% (energy and maximum) and 80.2% (mean) on
the merger window.

## Trained until it stops improving

Each table entry is the best a network reaches, not its value at a fixed
epoch. Every run stops early once validation within 1% has not improved for 80
epochs, and never before the end of the learning-rate cycle that contains its
best epoch. Both choices come from our own training histories
([derivation and check]({{ d | relative_url }}#oct16-stopping)). A best
validation value is picked from a noisy series and so is slightly optimistic;
rescoring each best checkpoint on fresh windows would remove that bias
(question 4 below).

## Next

The table is complete (30 October). Our den-reg, the main
S4D model in noise, also used dropout 0.2, so its noisy results are suspect
too (question 2 below).

## Questions from Claude

Claude, the AI model that runs these tests, has these open questions for me.
None of them is decided.

1. **The noisy comparison.** Train the networks of the signal-only comparison
   above on noisy data, with the same settings and two or three seeds each?
   Without noise every network learns the map, so only this test can rank
   them.
2. **The den-reg without dropout.** Rerun our main S4D model in noise with
   dropout 0 and nothing else changed?
3. **The GPU offset.** At half the sample rate, the inverse FFT of our
   one-layer network adds a constant offset to every sample on the GPU, and
   two S4D runs learned to read it
   ([derivation]({{ d | relative_url }}#oct16-s4d-fft-offset)). Fix it in the
   code by making the 512 Hz bin real before the inverse transform, and rerun
   those two runs?
4. **Fresh windows for the final table.** Rescore each run's best checkpoint
   on validation windows it has not seen, so that no entry is picked from a
   noisy series?
5. **Free kernels to a proven plateau.** The signal-only free-kernel run
   stopped at epoch 48, with its best, 99.8%, at epoch 46. Our stopping rule
   would have run it to epoch 126 at least. Resume it?
6. **An unwarped early window.** The early-window column differs from the
   merger columns in three ways at once: its position (ending 25.0 to 25.5 s before merger),
   its sample rate (256 Hz) and its length (1,024 samples). Its result cannot
   yet be credited to the warp. Train the same early window without the warp,
   as a control?
7. **A dilated S4D.** The dilated network in the comparison is a CNN. An S4D
   whose layers work at several sample rates in the same way has not been
   built. Build one and add it?
8. **Training speed.** In one timing, 83.5 to 90.0% of the elapsed time of a
   training batch fell outside the network's training step and the timed data
   preparation, and what fills it was not measured
   ([measurement]({{ d | relative_url }}#oct16-step-time)). Profile it, and if
   reading data is the cost, precompute the training windows?
9. **The 23 September heterodyne test without dropout.** Those denoiser runs
   had dropout 0.2 too
   ([correction]({{ u | append: '2026-09-23-denoiser-scans/' | relative_url }})).
   Rerun the heterodyne comparison with dropout 0?
10. **Chirplet kernels.** Add a network whose kernels are chains of short
    chirps to the noisy comparison
    ([brainstorm]({{ '/projects/bns/brainstorm/' | relative_url }}))? Its
    number of chirplets per kernel and its starting chirps are new choices,
    listed there.
