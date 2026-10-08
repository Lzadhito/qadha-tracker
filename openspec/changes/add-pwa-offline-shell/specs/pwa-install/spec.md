# Spec Delta

## Purpose

Lets users install Qadha Tracker to their device home screen or desktop and launch it as a standalone app with its own name, icon, and theme.

## ADDED Requirements

### Requirement: Installable manifest
The app SHALL publish a web app manifest with a name, short name, standalone display mode, start URL, scope, theme and background colours, and PNG icons at 192x192 and 512x512 plus a maskable 512x512 icon.

#### Scenario: Browser offers install
- **WHEN** a user visits the deployed app over HTTPS in a browser that supports installation
- **THEN** the browser considers the app installable and offers an install action

#### Scenario: Launch as standalone
- **WHEN** the user opens the installed app from the home screen
- **THEN** it opens without browser chrome, using the manifest theme colour and the app icon

### Requirement: iOS home screen icon
The app SHALL declare an `apple-touch-icon` so that adding it to the iOS home screen shows the app icon rather than a page screenshot.

#### Scenario: Add to Home Screen on iOS
- **WHEN** a user adds the app to the iOS home screen
- **THEN** the home screen shows the app icon and the short name
