# Fixtures

This directory contains fixture generators, templates, tests, and build
artifacts used by the drafts.

## Generate Fixtures

Run from repo root:

```sh
make fixtures
```

Generated files are written to `fixtures/build/`.

## Artifact Policy

- Machine artifacts are unwrapped files in `fixtures/build/` used by
  JavaScript generators/tests.
- Document artifacts are files imported by draft markdown. These are
  usually line-wrapped (`.wrapped`) when needed for readability in the
  drafts.
- `fixtures/build-manifest.json` defines the complete expected build
  artifact set.
- `fixtures/build-doc-manifest.json` defines expected draft-facing build
  artifacts referenced by `draft-ietf-jose-*.md`.

### Output Decision Table

Use this rule when adding new fixture outputs:

| Usage | Emit unwrapped | Emit wrapped |
|---|---|---|
| JS/tests only | Yes | No |
| Draft markdown only | Optional (if useful), but not required | Yes |
| Both JS/tests and drafts | Yes | Yes (if used in draft) |

### Examples

- Machine-only: `su-es256-issuer-proof.json`
- Draft-only (formatted): `su-es256-issuer-compact.jwp.wrapped`
- Both forms:
  - `su-es256-issuer-compact.jwp`
  - `su-es256-issuer-compact.jwp.wrapped`

## Validation

Run from repo root:

```sh
npm run check:fixtures:artifacts
npm run check:fixtures:docs
npm run lint:fixtures
npm test
```

Or use:

```sh
make verify-fixtures
```

To refresh manifests after intentional fixture/include changes:

```sh
make update-fixtures-manifests
```
