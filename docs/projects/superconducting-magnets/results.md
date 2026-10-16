---
layout: project
project: magnets
title: Results
permalink: /projects/superconducting-magnets/results/
eyebrow: Figures
summary: Figures from the work so far. Internal results on a simplified single-tape model.
---

## Runaway current from the analytic model

I* over bath temperature T0 and cooling λ, for a bare tape and a tape with a
copper and steel stabilizer. Gray means no runaway point exists.

{% include figure.html src="/assets/img/magnets/2026-10-01/analytic_surface_no_stabilizer.png" alt="Analytic runaway current over bath temperature and cooling, bare REBCO tape" caption="Bare tape. I* falls with bath temperature and depends only weakly on cooling." %}

{% include figure.html src="/assets/img/magnets/2026-10-01/analytic_surface_stabilizer.png" alt="Analytic runaway current over bath temperature and cooling, REBCO tape with stabilizer" caption="With stabilizer. Cooling matters much more, and at high bath temperature runaway disappears." %}

## Margin estimate, with and without the ramp shortcut

<div class="plot-pair">
{% include figure.html src="/assets/img/magnets/2026-10-01/margin_original_ramps.png" alt="GRU margin estimate tracking the true margin on a ramp built in fractions of I*" caption="Original ramps, built in fixed fractions of I*. The estimate tracks the true margin." %}
{% include figure.html src="/assets/img/magnets/2026-10-01/margin_random_ramps.png" alt="GRU margin estimate staying above the true margin on a random-current ramp" caption="Random-current ramps that hide I*. The estimate stays too optimistic." %}
</div>
