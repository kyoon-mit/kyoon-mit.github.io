---
layout: project
project: magnets
title: Definitions
permalink: /projects/superconducting-magnets/definitions/
eyebrow: Glossary
summary: >-
  The terms used on the superconducting-magnet pages, in plain language, each
  with a source. On every other page of this section, the first appearance of
  a term links here; resting the pointer on it for a second shows the short
  definition.
---

{%- assign order = "Superconductors|Runaway and protection|Coils|Simulation|Machine learning|Statistics|This project" | split: "|" -%}

{% for g in order %}
{%- assign entries = site.data.magnet_glossary | where: "group", g | sort_natural: "term" -%}
<section class="glossary__group">
<h2 id="{{ g | slugify }}">{{ g }}</h2>
<dl class="glossary">
{%- for t in entries %}
<dt id="{{ t.id }}">{{ t.term }}{% if t.also %} <span class="glossary__also">({{ t.also | join: ", " }})</span>{% endif %}</dt>
<dd>
{{ t.def | default: t.short | markdownify }}
<div class="glossary__source">Source: {{ t.source | markdownify | remove: "<p>" | remove: "</p>" | strip }}</div>
</dd>
{%- endfor %}
</dl>
</section>
{% endfor %}
