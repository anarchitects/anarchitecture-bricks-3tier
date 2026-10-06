# @anarchitects/newsletter-ts

Unreleased package scaffold for [epic #428](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/428).

## Features

This package establishes the Newsletter ts build and entry-point structure.
It exports no business API yet. Subsequent issues implement the accepted
[ADR-0010](../../../docs/adr/0010-define-newsletter-domain-boundaries-and-ports.md).

## Installation

Do not install or publish this scaffold independently. Newsletter packages await
one coordinated release after #429–#438 are merged and epic acceptance is complete.

## Usage

There is no runtime usage yet. Do not depend on this scaffold in consumer apps.

## Entry points

Root entry point only. DTOs and models are introduced by #431.
All current entry points are intentionally empty; they expose no placeholder models,
services or components that later implementations would need to preserve.

## Development notes

Run `yarn nx run newsletter-ts:build` and
`yarn nx run newsletter-ts:lint` from the workspace root.
Business tests and their test target will be added with the implementation.

The root carries `domain:newsletter`, `tech:ts` and
`type:contracts` tags. Layers inside one publishable
project are enforced by path-aware ESLint rules rather than separate Nx projects.
Newsletter depends only on its own domain and compatible Common platform bricks;
Blog composition belongs to the host application.
