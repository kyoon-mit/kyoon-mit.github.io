---
title: Learning thermal runaway of a simulated REBCO tape with a recurrent neural network
date: 2026-10-21
math: true
summary: >-
  A recurrent network reading four simulated measurements of a REBCO tape
  estimates its runaway current to 3.9% before runaway and warns in 97 of 100
  test ramps, at a median remaining margin of 0.06.
---

## Abstract

Protecting a REBCO magnet requires knowing how far the operating current is
from thermal runaway. The runaway current $I^*$ depends on the cooling of the
conductor, which is not measured during operation. We trained a gated
recurrent unit (GRU) network on simulated current ramps of a single
stabilized REBCO tape. Its only inputs were the bath temperature, the
transport current, the tape voltage and the tape surface temperature. The
tape conditions and the ramp procedure were drawn independently, so that
only the physics of the tape carried information about $I^*$. On 100 test
ramps, the network estimated $I^*$ with a median relative error of 3.9% (95%
confidence interval 2.0 to 7.3%) from readings up to $0.8\,I^*$, and the
remaining margin $(I^*-I)/I^*$ with a mean absolute error of 0.048 (0.043 to
0.053). Its margin estimate fell below 5% before runaway in 97 of 100 ramps
(91.5 to 99.4%), at a median true margin of 0.060. A 100 µV voltage threshold
on the same ramps triggered at a median true margin of 0.49. The margin error
is largest, and of the unsafe sign, between 0.66 and 0.86 $I^*$.

## Introduction

High-temperature superconductors such as REBCO carry large currents at 20 to
77 K and make compact high-field magnets possible. A REBCO conductor is a thin
superconducting film on a metal tape, with copper and steel layers alongside
that carry current when the film becomes resistive. A magnet is protected by
detecting a fault and removing its stored energy before the conductor is
damaged.

Most protection systems trigger on a voltage threshold. In REBCO the resistive
region spreads slowly, so the voltage stays small while a local region heats.
Marchevsky and Prestemon [1] proposed protection based instead on a thermal
runaway criterion. For a given bath temperature and cooling there is a
largest current $I^*$ at which Joule heating can still be balanced by heat
removal; above it, the temperature rises without bound (Appendix A).
Machine-learning methods have been used to detect quench precursors in
superconducting magnets, for example from acoustic sensors [2].

The runaway current cannot be used directly, because it depends on the
cooling, which changes with the mounting and the condition of the magnet and
is not measured. Estimating $I^*$ during operation requires inferring it from
the signals that are measured.

Here we test whether a recurrent neural network, reading measured signals one
at a time during a current ramp, can estimate $I^*$ and the remaining margin
of a simulated REBCO tape. We find that it estimates $I^*$ to a few percent
before runaway and warns in time in 97 of 100 test ramps, but that its margin
estimate is biased high between 0.66 and 0.86 $I^*$.

## Methods

### Code base

The simulation and network were adapted from the quench_detector code base
developed in our collaboration (private repository), which implements the
heat-balance model of Ref. [1] and GRU estimators. We used its tape physics
without change: the critical current, the current sharing with the
stabilizer, the Joule heating and the tape voltage. We rewrote the ramp
generator, reimplemented the equilibrium and runaway solvers so that the
cooling may depend on temperature, and rewrote the training loop so that each
ramp carries equal weight and the $I^*$ loss is applied at every reading. For
constant cooling, the reimplemented solver reproduced the original $I^*$
exactly on 20 random tape conditions. The network architecture and optimizer
settings are those of the original.

### Simulated tape

The tape was 1 m long and 4 mm wide, with a 50 µm copper layer (residual
resistance ratio 24) and a 50 µm stainless-steel layer as stabilizer. The
critical current followed $I_c(T) = I_{c0}\,[1-(T/T_c)^{1.7}]$ with
$I_{c0} = 500$ A and $T_c = 85$ K, and the superconductor obeyed a power law
with index $n = 20$. Heat was removed to the bath at temperature $T_0$ through
a 10 mm path of thermal conductivity $\lambda$, independent of temperature.
For each $(T_0, \lambda)$ we computed $I^*$ and the corresponding temperature
$T^*$ from the heat balance (Appendix A). The model treats the tape as a
single point in steady state, with no sensor noise.

### Measured signals

At each current $I$ of a ramp we recorded four quantities: the bath
temperature $T_0$; the transport current $I$; the tape voltage $V$, the
voltage between the two ends of the tape; and the surface temperature $T$,
the steady temperature at which heating and cooling balance at that current.
Fig. 1 shows $V$ and $T - T_0$ for one ramp.

{% include figure.html src="/assets/img/magnets/2026-10-21/signals_one_ramp.png" alt="Simulated tape voltage on a log scale and surface temperature rise against current over runaway current, for one ramp" caption="Fig. 1. Simulated voltage (left, log scale) and surface temperature above the bath (right) along one ramp, plotted against I/I*. Bath 64 K, λ = 48.1 W m⁻¹ K⁻¹, I* = 299 A." %}

### Data set

Each ramp combined two independent random draws. The tape conditions were
$T_0$ uniform in 5 to 75 K and $\lambda$ uniform in 20 to 200 W m⁻¹ K⁻¹,
redrawn until $I^*$ existed and exceeded 20 A. The ramp procedure was a start
current $I_0$ uniform in 0 to 20 A and a current step $\Delta I$ uniform in
1 to 5 A. The ramp recorded the currents $I_k = I_0 + k\,\Delta I$ for all
$I_k < I^*$. We generated 2000 training ramps, with 556,484 readings in total
(28 to 1118 per ramp, median 227) and $I^*$ from 146 to 1325 A (median
689 A), and 100 test ramps from separate random seeds.

To confirm that the ramp procedure carried no information on $I^*$, we fitted
$\ln I^*$ from $(I_0, \Delta I)$ with gradient-boosted regression trees on the
training ramps. On the test ramps the coefficient of determination was
$R^2 = -0.14$. For comparison, a procedure that starts each ramp at
$0.3\,I^*$ gives $R^2 = 0.9995$.

### Network and training

The network was a two-layer GRU [3] with 64 hidden units and dropout 0.1
(Appendix B). The four signals were standardized to zero mean and unit
variance. After each reading, linear or two-layer output heads gave the
margin, the probability that the margin is below 0.05, $\ln I^*$, $T^*$ and
the adiabatic time from runaway to 300 K. The loss was the sum of the
squared margin error, the cross entropy of the margin-below-0.05
probability, the squared error in $\ln I^*$, and 0.3 times the squared error
in the logarithm of the adiabatic time; $T^*$ had zero weight. The margin,
probability and $\ln I^*$ terms were averaged over the readings of each ramp
and then over ramps. We used AdamW with learning rate $10^{-3}$, batches of
64 ramps and 20% of the training ramps for validation, with the learning
rate halved after 10 epochs without improvement. Training ran for the full
200 epochs, 7.5 s each on 16 CPU threads, and the model with the lowest
validation loss was kept.

### Evaluation

The margin error is the estimated minus the true margin, so a positive error
overstates the remaining room. We report its mean absolute value per ramp,
averaged over ramps. The $I^*$ error is the relative error of the estimate at
the last reading with $I \le 0.8\,I^*$, and also at the final reading. A ramp
counts as warned when the estimated margin falls below 0.05 at any reading.
Uncertainties are 95% intervals from 10,000 bootstrap resamples of the test
ramps [4], or Clopper–Pearson intervals for counts [5].

## Results

### The runaway current is estimated to a few percent before runaway

The median relative error of $I^*$ was 3.9% (2.0 to 7.3%) from readings up to
$0.8\,I^*$, and 2.8% (2.2 to 3.2%) from complete ramps. When the $I^*$ loss
was applied only at the final reading of each ramp, the error from complete
ramps was 0.49% (0.37 to 0.57%), but from readings up to $0.8\,I^*$ it was
73.3% (70.7 to 75.2%). Since every ramp ends just below $I^*$, the final
current already locates $I^*$, and an estimate trained only there does not
generalize to earlier readings.

### The margin error is small early and late and positive between 0.66 and 0.86 I*

The mean absolute margin error was 0.048 (0.043 to 0.053), and 95% of all
readings had an absolute error below 0.119. On the ramp of Fig. 1 the
estimate exceeded the true margin at 88% of the readings and crossed 0.05 at
$0.94\,I^*$ (Fig. 2). Over the 100 test ramps (Fig. 3), the median error
stayed between −0.03 and +0.01 below $0.6\,I^*$, and was positive between 0.66
and 0.86 $I^*$. Between 0.7 and 0.8 $I^*$ the mean error was +0.046, and the
error was positive in 84% of the ramps. Above $0.95\,I^*$ the central 90% of
errors lay between −0.04 and +0.06. The margin computed from the $I^*$ estimate,
$1 - I/\hat I^*$, had the same mean absolute error, 0.048.

<div class="plot-pair">
{% include figure.html src="/assets/img/magnets/2026-10-21/margin_one_ramp.png" alt="True and estimated margin against current over runaway current for one ramp" caption="Fig. 2. True margin (gray), the network's margin output (dashed) and the margin computed from its I* estimate (dotted), for the ramp of Fig. 1, with I₀ = 10 A and ΔI = 2 A. This ramp is not in the training or test sets." %}
{% include figure.html src="/assets/img/magnets/2026-10-21/margin_error_bands.png" alt="Quantile bands of margin error against current over runaway current for 100 test ramps" caption="Fig. 3. Estimated minus true margin over 100 test ramps: median, 25 to 75%, and 5 to 95% of ramps. Positive values overstate the remaining room." %}
</div>

### The estimate warns before runaway in 97 of 100 ramps

The estimated margin fell below 0.05 before runaway in 97 of 100 test ramps
(91.5 to 99.4%). At that reading the median true margin was 0.060 (0.047 to
0.066), and the smallest was 0.017. In the remaining three ramps the estimate
stayed above 0.05 up to the final reading. On the same ramps, the tape
voltage first exceeded 100 µV at a median true margin of 0.49 (0.46 to 0.51),
where the network's margin error had a median of −0.024 (−0.049 to +0.010).

| Quantity, 100 test ramps | Value | 95% interval |
|---|---|---|
| $I^*$ error, readings up to $0.8\,I^*$ (median) | 3.9% | 2.0 to 7.3% |
| $I^*$ error, complete ramp (median) | 2.8% | 2.2 to 3.2% |
| Margin error, absolute (mean over ramps) | 0.048 | 0.043 to 0.053 |
| Ramps warned before runaway | 97 / 100 | 91.5 to 99.4% |
| True margin at warning (median) | 0.060 | 0.047 to 0.066 |
| True margin when $V$ first exceeds 100 µV (median) | 0.49 | 0.46 to 0.51 |

<p class="note">Table I. Summary of the test results.</p>

## Discussion

A GRU reading four measured signals estimates the runaway current of a
simulated REBCO tape to a few percent before runaway, and warns at a median
remaining margin of 0.06. A 100 µV threshold on the same signals triggers
with half the current range still available, at a margin of 0.49.

The positive margin error between 0.66 and 0.86 $I^*$ is the main
shortcoming, since it overstates the room left in the range where a
decision is made. It is not caused by weak signals: at $0.7\,I^*$ the median
voltage was 80 mV and the median surface temperature was 0.49 K above the
bath. A candidate cause is the input scaling. The voltage spans more than
100 orders of magnitude over the training set, from $10^{-110}$ V to 5.6 V,
and linear standardization maps nearly all readings below a millivolt to the
same value. A logarithmic voltage input would test this.

The study has several limitations. The tape is a single point in steady
state, so the ramp rate, the time dependence and the spread of the resistive
region are absent. The signals carry no noise. The cooling is constant in
temperature, the conductor parameters are fixed, and the result rests on one
training run. Extensions in the order of their cost are a logarithmic
voltage input, temperature-dependent cooling, sensor noise, varied $n$ and
$I_{c0}$, an estimate with an uncertainty, and spatially resolved
simulations.

## Conclusion

On simulated ramps in which only the tape physics carries information about
the runaway current, a GRU estimates that current to 3.9% from readings up to
80% of it and warns before runaway in 97 of 100 cases, at a median remaining
margin of 0.06 compared with 0.49 for a 100 µV threshold. Its margin estimate
is biased high between 0.66 and 0.86 $I^*$.

## References

1. M. Marchevsky and S. Prestemon, Thermal runaway criterion as a basis for
   the protection of high-temperature superconductor magnets,
   [Supercond. Sci. Technol. **37** (2024)](https://doi.org/10.1088/1361-6668/ad20fe).
2. D. Hoang, C. Boffo, N. Tran, S. Krave, S. Kazi, S. Stoynev and
   V. Marinozzi, Intelliquench: an adaptive machine learning system for
   detection of superconducting magnet quenches,
   [IEEE Trans. Appl. Supercond. **31**, 1 (2021)](https://doi.org/10.1109/TASC.2021.3058229).
3. K. Cho, B. van Merriënboer, C. Gulcehre, D. Bahdanau, F. Bougares,
   H. Schwenk and Y. Bengio, Learning phrase representations using RNN
   encoder–decoder for statistical machine translation,
   [arXiv:1406.1078](https://arxiv.org/abs/1406.1078) (2014).
4. B. Efron, Bootstrap methods: another look at the jackknife,
   [Ann. Statist. **7**, 1 (1979)](https://doi.org/10.1214/aos/1176344552).
5. C. J. Clopper and E. S. Pearson, The use of confidence or fiducial limits
   illustrated in the case of the binomial,
   [Biometrika **26**, 404 (1934)](https://doi.org/10.1093/biomet/26.4.404).

## Appendix A: Thermal runaway in a stabilized REBCO tape

A superconductor carries current without loss below its critical current
$I_c$, which falls as the temperature rises. Near $I_c$ the electric field
grows steeply with current. Over the full tape length the voltage across the
superconducting layer is

$$V = U_0 \left(\frac{I_s}{I_c(T)}\right)^{n},$$

where $I_s$ is the current in the superconducting layer,
$U_0 = 10^{-4}$ V is the criterion voltage (1 µV/cm over 1 m) and $n$ sets the
sharpness of the transition. The stabilizer, of resistance $R_{st}(T)$, is in
parallel with the superconducting layer, so the transport current divides
until both carry the same voltage:

$$U_0 \left(\frac{I_s}{I_c(T)}\right)^{n} = (I - I_s)\,R_{st}(T).$$

The Joule heat is $Q_{in}(I, T) = I\,V$. Heat flows to the bath through a path
of conductivity $\lambda$, width $w$ on both faces, length $L$ and depth $d$:

$$Q_{out}(T) = \lambda\,\frac{2wL}{d}\,(T - T_0).$$

In steady state $Q_{in} = Q_{out}$. For each temperature $T$ between $T_0$ and
$T_c$ this fixes the current $I_{eq}(T)$ at which the tape would sit at $T$.
$I_{eq}(T)$ first rises with $T$, because cooling grows with $T - T_0$, and
then falls, because as $I_c(T)$ decreases a smaller current already produces
the heat that the cooling can remove. Its
maximum is the runaway current $I^*$, reached at $T^*$. Below $I^*$ the
equation has a stable solution, the lower crossing, which is the surface
temperature we record. Above $I^*$ it has none, and the temperature rises
until the tape is damaged or the current is removed [1]. We evaluated
$I_{eq}$ at 150 temperatures and took the first interior maximum.

## Appendix B: The gated recurrent unit

A recurrent network reads a sequence one element at a time and keeps an
internal state $h_t$, a vector that summarizes the readings so far. In a GRU
[3] the state is updated from the new input $x_t$, here the four standardized
signals, by

$$
\begin{aligned}
z_t &= \sigma(W_z x_t + U_z h_{t-1} + b_z),\\
r_t &= \sigma(W_r x_t + U_r h_{t-1} + b_r),\\
\tilde h_t &= \tanh\!\big(W_h x_t + U_h (r_t \odot h_{t-1}) + b_h\big),\\
h_t &= z_t \odot h_{t-1} + (1 - z_t) \odot \tilde h_t,
\end{aligned}
$$

where $\sigma$ is the logistic function and $\odot$ the elementwise product.
The update gate $z_t$ decides how much of the old state to keep, and the
reset gate $r_t$ how much of it enters the new candidate $\tilde h_t$. The
matrices $W$, $U$ and vectors $b$ are learned. In a two-layer GRU the state
of the first layer is the input of the second. Each output head is a
function of the second-layer state $h_t$ alone, so every estimate at reading
$t$ uses only readings 1 to $t$.
