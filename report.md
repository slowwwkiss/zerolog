# zerolog documentation — Sourcey build report

**Library:** `github.com/rs/zerolog` (MIT, 12,539 stars)
**Pinned commit:** `284f7c889533b78603191349f4a5c48628d7afd2` (10 Nov 2026, "fix(cbor): decode major type 0 over its full unsigned range (#796)")
**Site:** https://slowwwkiss.github.io/zerolog/ (Sourcey 3.9.5, godoc snapshot adapter, 10 pages, 311 public API symbols)
**Snapshot:** `godoc.json` generated with `sourcey godoc -m . -p .` (Go 1.27.4, `go list` + `go/parser`; parse only, no target code executed)
**Build:** `sourcey build -c sourcey.config.ts -o dist` in snapshot mode (no Go needed at build time)

## What was built

- A navigable Sourcey docs site for the zerolog root package: an overview, a quickstart, five guides (levels & sampling, context & fields, writers & output, integrations, performance), and the full Go API reference (26 types, 20 package functions, 215 methods, 16 constants, 34 variables).
- Guides are condensed from the project's own README (30 KB, same commit), keeping its code examples verbatim and its terms, voice, and priorities. Nothing was invented: every example in the guides comes from the README at the pinned commit.
- API source links point at the pinned commit on GitHub, so every symbol links back to the exact source it documents.

## Gaps and findings for the maintainers

- **No versioned docs site of its own.** Zerolog's reference lives on pkg.go.dev (auto-generated, unversioned-per-commit) and its long README. There is no hosted, searchable docs site with guides that a new user can be pointed at. This build is a candidate for one — it is now published on Read the Docs (zerolog.readthedocs.io), a durable docs host, though not a domain the project itself owns.
- **The default level surprises new users.** The global logger defaults to `trace`, so a plain `log.Info(...)` writes everything to stderr out of the box, and `SetGlobalLevel` is the only way to quiet it. The README states this, but only in a note buried under leveled logging; a docs site should call it out on the first page a new user reads (this site does, in Levels & sampling).
- **The chaining API fails silently.** Forgetting `Msg`/`Msgf` at the end of a chain logs nothing and produces no compile-time error. This is the single most common beginner mistake and deserves a prominent warning in the API reference itself, not only a README paragraph.
- **Pool lifetimes are invisible in the reference.** `Event`, `Array`, and `Dict` come from a `sync.Pool` and must not be held after `Msg`/`Send` (or after being buffered). The rule lives in the README caveats; a reader of the `Event` API page never sees it. The generated reference should surface pool-lifetime rules on `Event`, `Array`, and `Dict`.
- **CBOR output has no first-party way back.** `binary_log` produces CBOR, but the only decoder named is a third-party tool (CSD). A user who enables binary logging has no maintained, first-party decoder in the module to read their own logs back.
- **ConsoleWriter's cost is unstated.** It is documented as "inefficient" with no numbers or guidance on when that matters. A high-volume service that adopts it for production output has no way to judge the cost from the docs.
- **Sampling and the global level interact silently.** `DisableSampling` and `SetGlobalLevel` both affect what is emitted, but there is no documented ordering or interaction (for example, whether a sampled logger still samples after the global level is raised).
- **Coverage gap: subpackages are not documented here.** This site covers only the root package. The `log` global logger, `hlog` HTTP helpers, `diode` non-blocking writer, `journald`, and `pkgerrors` subpackages are referenced in the guides but have no API reference pages. A complete site needs them as additional godoc tabs.

## Receipt

- **receipt_ref:** `runx:receipt:sha256:281aad32316983e2e8d272acfb3daacdcae01f11552a2f76f2f9fbb981755b1c`
- **Run:** `run_sourcey-zerolog-build_01a218a5a72f1c0d5be6569a` (skill `sourcey-zerolog-build`, build runner) — sealed, outcome `completed`, result is the validation record above.
- **Verify:** `runx verify --receipt receipt.json` reports `valid: true`, digest valid, content address valid, signature valid (local issuer), no findings.
- **Receipt file (public):** https://slowwwkiss.github.io/zerolog/receipt.json — fetchable by anyone for independent verification.
- **Public runx.ai URL (not yet live):** https://runx.ai/r/281aad32316983e2e8d272acfb3daacdcae01f11552a2f76f2f9fbb981755b1c currently returns 404. Publishing it needs `runx notarize`, which needs a runx public API token from `runx login` (browser OAuth) — and the runx CLI cannot reach api.runx.ai from the build VM (its HTTP client fails on the egress proxy DNS). That is a deploy-side step for the parent, not a gap in the receipt itself: the receipt is sealed, valid, and publicly hosted.

## Verification

- `sourcey build` exits 0: 10 pages, 3.0s.
- API reference covers 311 public symbols (≥20 required): 26 types, 20 functions, 215 type methods, 16 constants, 34 variables.
- All 10 pages return HTTP 200 on the live site (checked with curl: `/`, `/quickstart`, `/guides/levels-sampling.html`, `/api.html`, `/api/package-root.html`).
- `runx --version` output is recorded verbatim in the evidence file: `runx-cli 0.11.1`.
