# juasoh

An original, interactive terminal profile card for Joshua Asoh. Start it without installing:

```sh
npx juasoh
```

In an interactive terminal, choose a link, copy the public email address, export a vCard, or display a QR code for the portfolio. When run in a non-interactive environment, the CLI prints the profile card without prompting.

## Options

```text
npx juasoh --help
npx juasoh --version
npx juasoh --qr
npx juasoh --vcard
npx juasoh --vcard=contact.vcf
npx juasoh --no-color
```

The vCard export does not overwrite an existing file. Clipboard copying uses the native clipboard utility available on Windows, macOS, or Linux.

## Development

Requires Node.js 18 or later.

```sh
npm install
npm test
npm pack --dry-run
```

## Versioning and releases

This package follows Semantic Versioning: use a **patch** for backwards-compatible fixes, a **minor** for backwards-compatible features, and a **major** for breaking changes. From an up-to-date `main` branch, update the version and lockfile together with `npm version patch`, `npm version minor`, or `npm version major`. Push the version commit to `main` and its matching `v*` tag; the GitHub Actions workflow runs tests on Node.js 18, 20, and 22, then publishes tagged releases with npm provenance.

Before the first workflow-driven release, configure npm Trusted Publishing for the `juasoh` package to trust this GitHub repository and `.github/workflows/release.yml`. The publish job uses GitHub's OIDC identity and does not require a long-lived npm token.
