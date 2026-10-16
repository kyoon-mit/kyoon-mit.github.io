---
title: Two kinds of REBCO coil
date: 2026-10-16
summary: >-
  Insulated and no-insulation coils route current differently, so a digital
  twin needs a different model for each. Both can be approached as an inverse
  problem: infer the hidden parameters from measured data.
---

Everything so far has modeled a single tape. A real magnet is a coil, and
REBCO coils are built in two ways.

- **Insulated turns.** Each turn is electrically insulated from its
  neighbors, so the current follows the winding. The models used so far
  assume this.
- **No insulation between turns**
  ([Hahn et al. 2011](https://doi.org/10.1109/TASC.2010.2093492)). When the
  current changes, part of it crosses radially from turn to turn. To first
  order the coil acts like its inductance L in parallel with a turn-to-turn
  resistance R<sub>c</sub>, with time constant τ = L/R<sub>c</sub>
  ([Wang et al. 2013](https://doi.org/10.1088/0953-2048/26/3/035012)). How the
  current splits depends on L, R<sub>c</sub> and the ramp rate.

**What it means for this project.** The learning step of a digital twin can
be framed as an inverse calculation: measure how the magnet responds, then
work back to the parameters that cannot be measured directly. Wang et al. do
a simple version of this, obtaining R<sub>c</sub> from the measured decay of
the field after a sudden discharge. The same idea applies to both designs,
but each needs its own forward model of where the current goes.

Added to the [brainstorm]({{ '/projects/superconducting-magnets/brainstorm/' | relative_url }}).
