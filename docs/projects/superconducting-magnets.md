---
layout: page
title: Superconducting magnet control
permalink: /projects/superconducting-magnets/
summary: >-
  Machine-learning estimates of how close a high-temperature superconducting
  tape is to thermal runaway, from the sensors a protection system can read.
---

## The problem

High-temperature superconductors such as REBCO can carry large currents at
20 to 77 K, which makes compact high-field magnets possible for fusion and
future colliders. They are also hard to protect. When part of the tape heats
up, the resistive region spreads very slowly, so a hot spot can grow in one
place while the voltage across the magnet still looks normal. Protection
systems that wait for a voltage threshold therefore react late, or dump the
current far earlier than needed.

A more useful quantity is the distance to thermal runaway. For a given bath
temperature and cooling, there is a largest current I* at which the heat made
by the current can still be balanced by cooling. Above it, the temperature
climbs without limit. The margin (I* − I)/I* says how much headroom is left.
The difficulty is that I* depends on things a magnet cannot measure directly,
such as the cooling and the local critical current along the tape.

## What I am working on

I joined a collaboration building a digital twin of an HTS tape stack: fast
learned models that stand in for detailed simulations, and an estimator that
turns sparse sensor readings (voltage taps, current, a few thermometers) into
an estimate of the margin, with an uncertainty. My part is the encoder that
reads the sensor streams, and how the data should be represented for it.

## First results

My first step was to reproduce the existing baseline: an analytic runaway
model for a single tape, and a recurrent network (GRU) trained on simulated
current ramps to predict I* and the margin.

- The analytic model and the GRU reproduced closely once I matched the
  training settings.
- In the simulated ramps, the current was raised in fixed fractions of I*
  itself, so the step number and the first current reading already contained
  the answer. A model could predict the margin by counting steps, without
  learning the physics.
- When I rebuilt the ramps so they no longer reveal I*, the error grew
  several-fold. With about four times more training ramps, the I* estimate
  recovered to close to the original level, but the step-by-step margin
  estimate stayed poor and too optimistic.

These are internal results on a simplified single-tape model.

## Next

- Represent the inputs in forms where the physics is simple: current rather
  than time as the axis, voltage relative to the expected cold
  superconducting curve, and dimensionless units.
- Move from a single lumped tape to spatially resolved models, so the
  estimate says where along the tape the risk is, not only how large it is.
- Train on higher-fidelity finite-element simulations, then validate
  against them.
