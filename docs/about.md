---
layout: page
title: About
permalink: /about/
summary: >-
  Physics and machine learning — gravitational-wave inference, collider searches,
  and detector simulation.
---

I work on problems where a physical signal has to be pulled out of noisy
instrumental data, and increasingly on the machine learning methods that make
that extraction cheap enough to do at scale.

My current focus is gravitational-wave inference: using deep state space models
to estimate binary neutron star parameters directly from detector strain, where
the signal is long, faint, and expensive to analyse with template-based methods.
Before that I worked on collider physics — searches for rare Higgs boson decays
that probe couplings the standard measurements cannot reach — and on GEANT4
detector simulation.

<p class="note"><strong>To fill in:</strong> current position and group,
education, and anything else you want here. I have deliberately left out
biographical claims I could not verify from the repository.</p>

## Elsewhere

- [Curriculum vitae]({{ site.links.cv | relative_url }})
- [Google Scholar]({{ site.links.scholar }})
- [GitHub]({{ site.links.github }})
- <{{ site.email }}>

## Research

{% for p in site.data.projects.current %}{% if p.url %}- **Current** — [{{ p.title }}]({{ p.url | relative_url }})
{% endif %}{% endfor %}{% for p in site.data.projects.past %}{% if p.url %}- **Past** — [{{ p.title }}]({{ p.url | relative_url }})
{% endif %}{% endfor %}
