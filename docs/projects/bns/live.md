---
layout: project
title: Live runs
permalink: /projects/bns/live/
eyebrow: In progress
summary: >-
  The runs training right now, their latest validation numbers, and the newest
  reference-event figure from each. Refreshed by hand from the training
  machine, so it lags by hours, not seconds.
---

{%- assign live = site.data.bns_live -%}

<p class="note"><strong>Last refreshed {{ live.updated }}.</strong> Validation
numbers move from epoch to epoch and are not results. Each figure shows two
fixed reference events: a loud one on top and a quiet one below. Grey is
the noisy input, black the true signal, red the denoised output.</p>

{% for r in live.runs %}
## {{ r.title }}

<p><span class="status status--{{ r.state }}">{{ r.state }}</span> ·
started {{ r.started }} · epoch {{ r.epoch }} of {{ r.max_epochs }} ·
<a href="{{ r.update | relative_url }}">context</a></p>

{%- if r.metrics.size > 0 %}
<div class="table-scroll">
<table>
  <thead><tr>{% for m in r.metrics %}<th>{{ m.label }}</th>{% endfor %}</tr></thead>
  <tbody><tr>{% for m in r.metrics %}<td>{{ m.value }}</td>{% endfor %}</tr></tbody>
</table>
</div>
{%- endif %}

<p>{{ r.note }}</p>

{%- if r.figure %}
{% capture cap %}Reference events at epoch {{ r.figure.epoch }}.{% endcapture %}
{% include figure.html src=r.figure.src alt=r.title caption=cap %}
{%- endif %}
{% endfor %}

## Refreshing this page

On the training machine, from the site repository:

```
uv run --script tools/bns_live.py
```

The script reads each run's summary from Weights and Biases, trims its newest
reference-event figure, and rewrites `docs/_data/bns_live.yml`. Commit and push
to publish. Runs are listed in the `RUNS` table at the top of the script.
