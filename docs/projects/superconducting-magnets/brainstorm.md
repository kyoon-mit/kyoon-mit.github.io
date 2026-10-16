---
layout: project
project: magnets
title: Brainstorm
permalink: /projects/superconducting-magnets/brainstorm/
eyebrow: Ideas and tests
summary: >-
  Ideas, whether they have been tested, and where the result is. Checked items
  have a dated update behind them.
---

{%- assign u = '/projects/superconducting-magnets/updates/' -%}

## Done

<ul class="checklist">
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Reproduce the analytic runaway surface.</b> Same shape as the reference figures; the values depend strongly on the transition sharpness n. <a href="{{ u | append: '2026-10-01-reproducing-the-baseline/' | relative_url }}">1 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Reproduce the GRU margin estimator.</b> Matches once the loss weights every ramp step equally. <a href="{{ u | append: '2026-10-01-reproducing-the-baseline/' | relative_url }}">1 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Ramps that do not reveal I*.</b> Error grows several-fold. <a href="{{ u | append: '2026-10-01-ramps-that-hide-the-answer/' | relative_url }}">1 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>More data or more training?</b> Four times more ramps recovers I*; more epochs barely helps; the margin output stays poor. <a href="{{ u | append: '2026-10-01-ramps-that-hide-the-answer/' | relative_url }}">1 Oct</a></span></li>
</ul>

## To try

<ul class="checklist">
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Margin from the predicted I*,</b> 1 − I/I*, instead of a separate margin output.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>A stability ratio as input:</b> how fast heating rises with temperature, against the cooling slope, both estimated along the ramp. It approaches 1 at runaway.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Current, not time, as the axis,</b> so step counting is impossible by construction.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Voltage against the cold power law:</b> the local slope d log V / d log I, and the residual after removing the cold curve and the inductive part.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Dimensionless inputs:</b> I/Ic, V over the criterion voltage, (T − T0)/(Tc − T0).</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Frame the estimator as an inverse calculation:</b> back-calculate hidden coil parameters from measured quench and ramp data, the way a no-insulation coil's turn-to-turn resistance is obtained from its measured decay time, R<sub>c</sub> = L/τ (<a href="https://doi.org/10.1088/0953-2048/26/3/035012">Wang et al. 2013</a>). <a href="{{ u | append: '2026-10-16-two-kinds-of-coil/' | relative_url }}">16 Oct</a></span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>A separate model for no-insulation coils,</b> with a radial current path between turns (inductance in parallel with R<sub>c</sub>), since the insulated-coil model does not apply. <a href="{{ u | append: '2026-10-16-two-kinds-of-coil/' | relative_url }}">16 Oct</a></span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Other encoders:</b> a state space model, or contrastive embeddings that carry uncertainty.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Grid resolution study</b> for the spatial model.</span></li>
</ul>
