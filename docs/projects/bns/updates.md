---
layout: project
title: Updates
permalink: /projects/bns/updates/
eyebrow: Research log
summary: >-
  Dated snapshots of the work in progress. Pick a month from the calendar, or
  browse the index below it.
redirect_from:
  - /bns/chirp_mass_progress/
---

{%- assign ups = site.updates | where: "project", "bns" | sort: "date" | reverse -%}
{%- assign years = ups | group_by_exp: "u", "u.date | date: '%Y'" -%}
{%- assign MONTHS = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec" | split: "," -%}

<section class="cal" aria-label="Updates by month">
  <p class="cal__legend">{{ ups | size }} update{% if ups.size != 1 %}s{% endif %} · filled months link to that month's entries</p>
  {%- for year in years -%}
    <div class="cal__row">
      <span class="cal__year">{{ year.name }}</span>
      <div class="cal__months">
        {%- for m in (1..12) -%}
          {%- assign mm = m | prepend: '0' | slice: -2, 2 -%}
          {%- assign mi = m | minus: 1 -%}
          {%- assign label = MONTHS[mi] -%}
          {%- assign n = 0 -%}
          {%- for u in year.items -%}
            {%- assign um = u.date | date: '%m' -%}
            {%- if um == mm -%}{%- assign n = n | plus: 1 -%}{%- endif -%}
          {%- endfor -%}
          {%- if n > 0 -%}
            <a class="cal__cell cal__cell--has" href="#y{{ year.name }}m{{ mm }}"
               title="{{ label }} {{ year.name }} — {{ n }} update{% if n != 1 %}s{% endif %}">
              <abbr>{{ label }}</abbr><span class="cal__n">{{ n }}</span>
            </a>
          {%- else -%}
            <span class="cal__cell cal__cell--empty" aria-hidden="true"><abbr>{{ label }}</abbr></span>
          {%- endif -%}
        {%- endfor -%}
      </div>
    </div>
  {%- endfor -%}
</section>

<div class="tree">
  {%- for year in years -%}
    {%- assign months = year.items | group_by_exp: "u", "u.date | date: '%B'" -%}
    <details class="tree__year" {% if forloop.first %}open{% endif %}>
      <summary>{{ year.name }}<span class="tree__count">{{ year.items | size }} entr{% if year.items.size == 1 %}y{% else %}ies{% endif %}</span></summary>
      {%- for month in months -%}
        {%- assign mm = month.items.first.date | date: '%m' -%}
        <details class="tree__month" id="y{{ year.name }}m{{ mm }}" open>
          <summary>{{ month.name }}<span class="tree__count">{{ month.items | size }}</span></summary>
          <ul class="tree__list">
            {%- for u in month.items -%}
              <li class="tree__item">
                <a class="tree__link" href="{{ u.url | relative_url }}">
                  <span class="tree__meta">
                    <span class="tree__title">{{ u.title }}</span>
                    <time class="tree__date" datetime="{{ u.date | date_to_xmlschema }}">{{ u.date | date: "%b %-d, %Y" }}</time>
                  </span>
                  {%- if u.summary %}<span class="tree__summary">{{ u.summary }}</span>{% endif -%}
                </a>
              </li>
            {%- endfor -%}
          </ul>
        </details>
      {%- endfor -%}
    </details>
  {%- endfor -%}
</div>

<script>
  // Calendar cells link to a month inside a <details> that may be collapsed.
  // Some browsers auto-expand on fragment navigation; this makes it uniform.
  (function () {
    function reveal() {
      var id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      var el = document.getElementById(id);
      if (!el) return;
      for (var n = el; n; n = n.parentElement) {
        if (n.tagName === 'DETAILS') n.open = true;
      }
      el.scrollIntoView({ block: 'start' });
    }
    window.addEventListener('hashchange', reveal);
    if (location.hash) reveal();
  })();
</script>
