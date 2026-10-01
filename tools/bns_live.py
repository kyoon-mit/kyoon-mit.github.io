# /// script
# requires-python = ">=3.10"
# dependencies = ["wandb", "pyyaml", "pillow"]
# ///
"""Refresh the BNS live-runs page from Weights and Biases and local run dirs.

Writes docs/_data/bns_live.yml and copies a trimmed copy of each run's newest
reference-event figure into docs/assets/img/bns/live/.

    uv run --script tools/bns_live.py

Add or retire runs in RUNS below.
"""

from datetime import datetime
from pathlib import Path

import wandb
import yaml
from PIL import Image

SITE = Path(__file__).resolve().parents[1] / "docs"
RUNROOT = Path("/home/kyoon/SSM-BNS/aframe/dev/runs")

BNS_METRICS = [
    ("val/rho", "overlap rho", "{:.3f}"),
    ("val/within_2pct_chirp_mass", "within 2%", "{:.1%}"),
    ("val/within_5pct_chirp_mass", "within 5%", "{:.1%}"),
    ("val/r2_chirp_mass", "R² chirp mass", "{:.3f}"),
    ("val/r2_mass_ratio", "R² mass ratio", "{:.3f}"),
]
P8_METRICS = [
    ("val/rho", "overlap rho", "{:.3f}"),
    ("val/rmse_energy_eV", "RMSE (eV)", "{:.2f}"),
    ("val/r2_energy_eV", "R² energy", "{:.3f}"),
    ("val/within_2eV_energy_eV", "within 2 eV", "{:.1%}"),
]

RUNS = [
    dict(
        key="bns_recipe",
        title="BNS: Project 8 recipe, 128/6, chirp mass + mass ratio",
        project="DENOISER-SCAN",
        run="den_reg_sched_alpha_0.5_floor_1e-2_c_rho_5_lambda_amp_3_powerlaw_m2_snr_d128_n6_mc_q_rep4_smooth20_wp0.96_ddp",
        figures="claude_tests/{run}/reference_events",
        rows=(10, [0, 4]),
        max_epochs=800,
        metrics=BNS_METRICS,
        update="/projects/bns/updates/2026-10-01-recipe-on-bns/",
        note="Validates on a power law with index −2, the baseline on −3, so the two rows are not directly comparable. The shared power-law test set is.",
    ),
    dict(
        key="bns_baseline",
        title="BNS: joint model baseline, 128/4, chirp mass",
        project="DENOISER-SCAN",
        run="den_reg_sched_alpha_0.5_floor_1e-2_c_rho_5_lambda_amp_3_powerlaw_snr_d128",
        figures="claude_tests/{run}/reference_events",
        rows=(10, [0, 4]),
        max_epochs=2000,
        metrics=BNS_METRICS,
        update="/projects/bns/updates/2026-09-29-den-reg-and-project-8/",
        note="Power-law SNR (index −3). The run the new recipe is compared against.",
    ),
    dict(
        key="p8_size",
        title="Project 8: model size, 128/6, stored cavity noise",
        project="PROJECT8-DEN-REG",
        run="p8_den_reg_sched_alpha_0.5_floor_1e-1_c_rho_5_lambda_amp_1_61us_403MHz_d128_n6",
        figures="project8/{run}/denoiser_evolution",
        rows=(8, [0, 4]),
        max_epochs=1000,
        metrics=P8_METRICS,
        update="/projects/bns/updates/2026-09-29-den-reg-and-project-8/",
        note="Regressor switched on at epoch 200, full weight at 400.",
    ),
    dict(
        key="p8_noise",
        title="Project 8: fresh Gaussian noise every step, each signal ×5",
        project="PROJECT8-DEN-REG",
        run="p8_den_reg_sched_alpha_0.5_floor_1e-1_c_rho_5_lambda_amp_1_20.3us_403MHz_gauss_resample_x5",
        figures="project8/{run}/denoiser_evolution",
        rows=(8, [0, 4]),
        max_epochs=200,
        metrics=P8_METRICS,
        update="/projects/bns/updates/2026-09-29-den-reg-and-project-8/",
        note="Regressor ramped in over epochs 40 to 80.",
    ),
]

TITLE_PX = 40  # matplotlib suptitle band above the first row


def trim(src: Path, dst: Path, n_rows: int, keep: list[int], width: int = 1000):
    """Keep selected rows of a stacked reference-event figure."""
    im = Image.open(src).convert("RGB")
    row = (im.height - TITLE_PX) / n_rows
    parts = [im.crop((0, 0, im.width, TITLE_PX))]
    for r in keep:
        top = int(TITLE_PX + r * row)
        parts.append(im.crop((0, top, im.width, int(top + row))))
    out = Image.new("RGB", (im.width, sum(p.height for p in parts)), "white")
    y = 0
    for p in parts:
        out.paste(p, (0, y))
        y += p.height
    out = out.resize((width, round(out.height * width / out.width)), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, optimize=True)


def main():
    api = wandb.Api()
    entity = api.default_entity
    rows = []
    for spec in RUNS:
        run = api.run(f"{entity}/{spec['project']}/{spec['run']}")
        summary = run.summary
        metrics = []
        for key, label, fmt in spec["metrics"]:
            value = summary.get(key)
            if isinstance(value, (int, float)):
                metrics.append({"label": label, "value": fmt.format(value)})
        figure = None
        figdir = RUNROOT / spec["figures"].format(run=spec["run"])
        pngs = sorted(figdir.glob("epoch_*.png"))
        if pngs:
            n_rows, keep = spec["rows"]
            dst = SITE / "assets/img/bns/live" / f"{spec['key']}.png"
            trim(pngs[-1], dst, n_rows, keep)
            figure = {
                "src": f"/assets/img/bns/live/{spec['key']}.png",
                "epoch": int(pngs[-1].stem.split("_")[1]),
            }
        rows.append(
            {
                "key": spec["key"],
                "title": spec["title"],
                "state": run.state,
                "started": run.created_at[:10],
                "epoch": summary.get("epoch"),
                "max_epochs": spec["max_epochs"],
                "metrics": metrics,
                "figure": figure,
                "update": spec["update"],
                "note": spec["note"],
            }
        )
        print(f"{spec['key']}: {run.state}, epoch {summary.get('epoch')}")

    data = {"updated": datetime.now().astimezone().strftime("%-d %B %Y, %H:%M %Z"), "runs": rows}
    out = SITE / "_data/bns_live.yml"
    out.write_text(yaml.safe_dump(data, sort_keys=False, allow_unicode=True))
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
