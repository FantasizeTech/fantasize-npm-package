# Org

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is almost ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/nx-api/node?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Finish your CI setup

[Click here to finish setting up your workspace!](https://cloud.nx.app/connect/2ru4jSxKSP)

## Run tasks

To run the dev server for your app, use:

```sh
npx nx serve fantasize-npm-package
```

To create a production bundle:

```sh
npx nx build fantasize-npm-package
```

To see all available targets to run for a project, run:

```sh
npx nx show project fantasize-npm-package
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

````sh
# Fantasize Monorepo

Node 20+ Nx workspace containing publishable packages and CI workflows.

## Packages

- `@fantasizetech/fantasize-rtc-client` — WebRTC signaling client (browser/DOM)
	- Path: `packages/fantasize-rtc-client`
	- Build: `npx nx run @fantasizetech/fantasize-rtc-client:build`

- `@fantasizetech/fantasize-rtc-server` — WebRTC signaling server (Node)
	- Path: `packages/fantasize-rtc-server`
	- Build: `npx nx run @fantasizetech/fantasize-rtc-server:build`

- `@fantasizetech/fantasize-inventory-management` — Flexible inventory toolkit for React
	- Path: `packages/fantasize-inventory-management`
	- Build: `npx nx run @fantasizetech/fantasize-inventory-management:build`
	- Docs: see `packages/fantasize-inventory-management/README.md`

> Note on npm scope: CI is configured with npm scope `@fantasize-tech`. Current package.json names use `@fantasizetech`. Align scopes before publishing (rename package names or update CI scope).

## Dev Quickstart

- List projects and targets:
	```sh
	npx nx show projects
	npx nx show project @fantasizetech/fantasize-rtc-client
	```

- Build all:
	```sh
	npx nx run-many -t build
	```

- Graph:
	```sh
	npx nx graph
	```

## Publishing (CI)

GitHub Actions publish each package to npm when you push a matching tag:

- RTC Client: tag `fantasize-rtc-client-v<version>`
- RTC Server: tag `fantasize-rtc-server-v<version>`
- Inventory: tag `fantasize-inventory-management-v<version>`

Example:
```sh
git tag fantasize-rtc-client-v0.1.0
git push origin fantasize-rtc-client-v0.1.0
````

Requirements:

- Repo secret `AC_NPM` set to an npm token with publish rights
- Org/scope exists on npm and your token can publish to it

Workflows live in `.github/workflows/` and run:

1. `npm ci` 2) `nx build <package>` 3) `npm publish --access public`

## Local Publishing (optional)

```sh
npm login
cd packages/fantasize-inventory-management
npm publish --access public
```

Adjust the path for other packages accordingly.

## Requirements

- Node `>=20`
- npm 9+

## Useful Nx Links

- Nx tasks: https://nx.dev/features/run-tasks
- Releases with Nx: https://nx.dev/features/manage-releases
- CI with Nx: https://nx.dev/ci/intro/ci-with-nx
