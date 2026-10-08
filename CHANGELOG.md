# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-10-08

User stories: code-corhuila/barber-saas-docs#9, code-corhuila/barber-saas-docs#59

### Added

- deploy: serve the built remote for the shell
- shell: copy the shell contract, the four view states and the shared styles
- loyalty: type the rule, the cards, the history and the coupons of the contract
- loyalty: call loyalty-api through the shell's http client
- loyalty: say the card's progress and validate the program form
- ui: send a client to their card and staff to the barbershop's cards
- ui: show a client's card, progress and coupons at the barbershop they chose
- ui: list the barbershop's cards and the ones ready to redeem
- ui: give a sticker and redeem the reward from a card
- ui: let the owner set the loyalty program

### Fixed

- build: expose the loyalty routes, not finance's

### Documentation

- readme: point the header to Barber Saas and barber-saas-docs
- readme: explain the screens, their calls and how to start the remote

### Tests

- ci: install, test and build the remote on every pull request

### Maintenance

- build: ignore dependencies, build output, env files and keys
- github: track the story environment on the board
- build: add the angular 21 and ionic 8 remote with native federation on port 4306

[2.0.0]: https://github.com/code-corhuila/barber-saas-loyalty-app/releases/tag/v2.0.0
