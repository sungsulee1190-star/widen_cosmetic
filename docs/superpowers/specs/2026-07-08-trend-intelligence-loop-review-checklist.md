# Trend Intelligence Loop Review Checklist

Use this when reviewing implementation changes for the WIDEN trend loop.

## Must Pass

- Recommendations are generated from trend signals, verifications, score rules, SKU data, and ingredient data.
- No recommended product is pinned to the first SKU or to VT 리들샷 100.
- Every trend signal has evidence grade, observed date, freshness days, and source URL or raw observation.
- Every verified recommendation can show score breakdown, missing evidence, and next action.
- A/B grade evidence and confirmed verification are required before `testReady`.
- Japan and Taiwan can be scored separately.
- Existing category filters still change the detail recommendation panel.
- Broken external images still show a fallback.
- Qoo10 competitor buttons do not point to the Qoo10 home page.

## Should Pass

- Adding a new platform only requires a new trend signal, not a new view rewrite.
- Adding a new ingredient only requires ingredient DB data and signal linkage.
- Old signals can be penalized or marked stale.
- Failed products can be logged as rejected or blocked with reasons.
