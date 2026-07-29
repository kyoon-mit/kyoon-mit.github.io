---
layout: page
title: GEANT4
permalink: /projects/geant4/
summary: >-
  Monte Carlo simulation of particle transport and detector response, used to
  connect what a detector records back to what actually passed through it.
---

## What the simulation is for

Every measurement in particle physics is made through a detector that distorts
what it sees. GEANT4 closes that gap: it transports particles through a modelled
detector geometry step by step, sampling the physics processes that occur along
the way — ionization, bremsstrahlung, pair production, multiple scattering,
hadronic interactions — and records the resulting energy deposits. Because the
simulation knows the truth it started from, it is the reference against which
reconstruction is calibrated and understood.

## The work

- **Geometry and materials.** Describing the detector volumes, their materials,
  and their placement precisely enough that the simulated response matches the
  real one.
- **Physics lists.** Choosing and configuring the process sets appropriate to the
  particle types and energy range in play — the choice matters most for hadronic
  showers, where models differ.
- **Shower development and energy deposition.** Studying how electromagnetic and
  hadronic cascades develop through the detector layers, and how much of the
  incident energy is actually sampled.
- **Truth-level validation.** Comparing reconstructed quantities against
  simulation truth to quantify resolution, efficiency, and bias.

<p class="note"><strong>Draft page.</strong> This is a general description of
GEANT4 work — replace it with the specific detector, energy range, and study, and
link any code or write-ups.</p>
