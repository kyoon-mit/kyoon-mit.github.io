---
title: Ramps that hide the answer
date: 2026-10-01 18:00:00
summary: >-
  The training ramps revealed I*. With ramps that do not, I* is recovered
  with more data, but the margin estimate stays too optimistic.
---

In the simulated ramps the current started at 30% of I* and rose by 0.5% of
I* per step. Every ramp therefore took the same number of steps, the margin
was a fixed function of the step number, and the first current reading gave
I* directly. A model could score well by counting steps.

I rebuilt the ramps: a random starting current, a random end between 70% and
100% of I*, and readings at random currents in between, with the same number
of readings per ramp.

- With the same amount of training data, the I* and margin errors grew
  several-fold.
- With four times more ramps, the I* error came back close to the original
  level. More training epochs alone helped much less.
- The margin estimate stayed poor and too optimistic, even where the I*
  estimate on the same ramp was good. Computing the margin from the
  predicted I* may fix this.

<div class="plot-pair">
{% include figure.html src="/assets/img/magnets/2026-10-01/margin_original_ramps.png" alt="GRU margin estimate on the original ramps" caption="Original ramps." %}
{% include figure.html src="/assets/img/magnets/2026-10-01/margin_random_ramps.png" alt="GRU margin estimate on random-current ramps" caption="Random-current ramps, four times more training data." %}
</div>
