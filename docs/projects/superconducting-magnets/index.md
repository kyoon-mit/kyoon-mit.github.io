---
layout: project
project: magnets
title: Superconducting magnet control
permalink: /projects/superconducting-magnets/
eyebrow: Current project
summary: >-
  Estimating, from the sensors a protection system can read, how close a
  high-temperature superconducting tape is to thermal runaway, and where.
next_page: /projects/superconducting-magnets/background/
next_title: Background, the physics in a few paragraphs
---

## Goal

Learned models that read voltage taps, current and a few thermometers on an
HTS tape stack and report, for each part of the tape, the distance to thermal
runaway with an uncertainty. Later, a controller uses that estimate to run
the current closer to the limit without losing the magnet.

I work on this in a collaboration building a digital twin of an HTS tape
stack. My part is the encoder that reads the sensor streams, and how the data
is represented for it.

## Timeline

<ol class="timeline">
  <li class="timeline__item">
    <span class="timeline__meta"><span class="timeline__kind">Done · Oct 2026</span></span>
    <span class="timeline__title">Reproduce the single-tape baseline</span>
    <span class="timeline__where">An analytic runaway model and a GRU estimator. Found that the training ramps reveal the answer. <a href="{{ '/projects/superconducting-magnets/updates/' | relative_url }}">Updates</a></span>
  </li>
  <li class="timeline__item timeline__item--pending">
    <span class="timeline__meta"><span class="timeline__kind timeline__kind--pending">Next</span></span>
    <span class="timeline__title">A simple spatial model: heat along the tape</span>
    <span class="timeline__where">With a study of how fine the grid along the tape must be.</span>
  </li>
  <li class="timeline__item timeline__item--pending">
    <span class="timeline__meta"><span class="timeline__kind timeline__kind--pending">Then</span></span>
    <span class="timeline__title">Add current sharing, field changes, AC loss and Ic damage</span>
    <span class="timeline__where">Each added and checked one at a time.</span>
  </li>
  <li class="timeline__item timeline__item--pending">
    <span class="timeline__meta"><span class="timeline__kind timeline__kind--pending">First milestone</span></span>
    <span class="timeline__title">A fast surrogate trained on finite-element runs, validated against them</span>
    <span class="timeline__where">Validation only, no control yet.</span>
  </li>
  <li class="timeline__item timeline__item--pending">
    <span class="timeline__meta"><span class="timeline__kind timeline__kind--pending">Then</span></span>
    <span class="timeline__title">Runaway probability for every cell, with uncertainty</span>
    <span class="timeline__where">The runaway current of each cell can change in time, so it is estimated from the current state.</span>
  </li>
  <li class="timeline__item timeline__item--pending">
    <span class="timeline__meta"><span class="timeline__kind timeline__kind--pending">Later</span></span>
    <span class="timeline__title">Reinforcement-learning control of the current</span>
    <span class="timeline__where">Ramp, hold, reduce or dump, trained on the surrogate.</span>
  </li>
</ol>

<p class="note"><strong>Status.</strong> Research in progress on simulated
data. Results here are internal and qualitative.</p>
