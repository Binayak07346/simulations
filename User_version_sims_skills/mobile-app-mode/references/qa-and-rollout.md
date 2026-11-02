# QA and rollout playbook (how 363 live sims were converted without touching desktop)

## 0. Measure first
- Run `probe.mjs` on a sample of every page family; for a whole fleet, run it in a loop and keep the JSON.
- The BEFORE numbers justify the work. Typical figures for desktop-first sims on an 844×390 landscape phone:
  - the header wraps to 95–130 px;
  - the drawing gets about 50% of the screen;
  - most sims have no slider on screen;
  - some clip Play/Reset off the right edge;
  - explanation sheets show about 45 px of content.
- Tablets in landscape (≥ 1180×820) are usually fine already. The docked panel is a polish, not a rescue.

## 1. Pilot and sign-off (do not skip)
- Pick 3–5 sims, one per family plus the densest one (a lab with many floating panels).
- Convert them and show them in `preview/index.html`:
  - phone with app rails;
  - phone without (browser);
  - tablet.
- Iterate the **layer** until the owner signs off. Typical requests were:
  - top-card buttons evenly spread and not touching the card edge;
  - one rail per side, not two side by side;
  - no permanent pill when the drawer already has the tab.
- Only then go wide.

## 2. Fetch what is deployed
- Download every deployed object with its ETag/VersionId (S3: `get_object`; keep `ContentType` and encryption).
  This is the input, and also your backup.
- Compare it with the repo copy (md5). Report differences; never assume the repo is what's live.

## 3. Convert in bulk with a proof
- `bulk_apply.py <dir> --out converted/ --manifest m.json`.
- Every output is asserted to be its input plus only the app-mode block(s), inserted right before the last
  `</body>`. Scripts can contain `</body>` inside strings, so it is always the LAST match.

## 4. Gate everything, then triage
- `app_mode_check.mjs` per sim:
  - A, bytes;
  - B, desktop inert at 1440 and 1100 (layout signature equal to the input; a sim that varies between loads by
    itself is "noisy", not failed);
  - C, touch phone 608×348;
  - D, touch tablet 1184×800.
- **Verify the verifier** on known-broken builds before trusting a PASS:
  - the input without the layer must fail C/D;
  - a layer with its guard removed must fail B.
- **Parallelise:**
  - split by family into separate processes or agents (≤ 3 pages each);
  - re-run every `page.goto` timeout at concurrency 1 before calling it a failure (machine load, not the sim);
  - each agent tests its fixes on its own copy of the layer;
  - merge the fixes into ONE layer, bump `VERSION`, rebuild and re-gate all.
- **Gate false positives seen in practice:**
  - a "lost" header control that is invisible on desktop too;
  - "no sliders" on button-only sims;
  - Play locked by design until a prediction is made;
  - drawer caught mid-slide under load;
  - single-canvas coverage on multi-canvas sims (measure the hero instead).
- **Real defects the gate could NOT see:** read them from screenshots.
  - read-out chip covering the drawing;
  - plots pushed below the phone's bottom edge;
  - read-outs using an unknown class (no chip);
  - unreadable moved buttons;
  - a lab sidebar collapsing to an icon strip;
  - floating panels covering the whole bench.
  - Review screenshots of a broad sample, not just the flagged ones.

## 5. Deploy surgically
1. Re-check that each deployed object still has the fetched ETag. Stop if any changed.
2. Back up all objects to a dated folder with a manifest (key, ETag, VersionId). Keep the bucket versioned.
3. **Canary:** push one object, check S3 ETag == md5 of the converted file, fetch the served page and find the layer.
4. **Push the rest** with a conditional write (`IfMatch=<fetched ETag>`), the same `ContentType` and the same
   encryption.
5. **Verify every key:** S3 == converted, and the served page contains `id="fermi-app-mode"`.
6. **Smoke test the real URLs headless:**
   - touch phone means `__fermiAppMode` is set and `html.fapp`;
   - desktop means neither.

Rollback is putting the backup objects back (or restoring the VersionIds).

## 6. Keep the source of truth in sync
- Repo copies: insert the layer **in place** (`bulk_apply.py --in-place` on the repo files), prove output ==
  deployed object (md5), then commit. Never copy deployed files over the repo: the repo may hold newer uncommitted
  work.
- Pipelines: make the layer the last build step, after the existing gates (which keep seeing the pre-step file),
  then gate it and record the result. Delivery or deploy refuses files without it. `app_mode.py --check` before
  any deploy.
- Gates that emulate touch (`isMobile`/`hasTouch`) must run on the pre-step file or with `?app=0`.

## 7. Afterwards
- New sims get the layer from the pipeline. Sims built by hand run `app_mode.py` + the gate before going live.
- Upgrading the layer means: edit the source, bump `VERSION`, regression-compare old vs new on real sims, then
  re-run `bulk_apply.py --in-place` and redeploy with the same playbook.
