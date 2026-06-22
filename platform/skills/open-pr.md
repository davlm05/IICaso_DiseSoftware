# Skill: branch + PR conventions

`/release-feature` performs these steps after all quality gates pass:

1. Create branch `feature/<feature-id>`.
2. Stage all changes and commit: `feat: <title>` (body references the feature id + release notes).
3. If a git remote exists: push and open a PR with `gh pr create` against `main`, using the generated
   `platform/specs/<id>/RELEASE_NOTES.md` as the body.
4. If no remote / `gh` is unavailable: stop at the local branch + commit and report that the PR step was
   skipped (degraded, non-fatal).

## Requirements
- `gh` authenticated (`GH_TOKEN` / `gh auth login`) for PR creation.
- Release notes are generated from the manifest + `templates/release-notes.md`.
