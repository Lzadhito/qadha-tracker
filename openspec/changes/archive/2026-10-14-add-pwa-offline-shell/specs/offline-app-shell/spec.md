# Spec Delta

## Purpose

Keeps the app usable without a network by serving the application shell from a local cache, while staying current across deploys and leaving data traffic to the existing local-first outbox.

## ADDED Requirements

### Requirement: Offline launch
After the app has been loaded once online, the system SHALL start and render its UI with no network connection.

#### Scenario: Cold start offline
- **WHEN** a user who has previously loaded the app opens it with no network
- **THEN** the app shell loads and renders instead of a browser offline error

#### Scenario: Deep link offline
- **WHEN** a user opens a known in-app route directly (for example by reloading it) while offline
- **THEN** the app shell loads and the client router renders that route

### Requirement: Local logging works offline
While offline, the system SHALL let the user record a log through the existing outbox, and SHALL sync it once Supabase is reachable again.

#### Scenario: Log offline then reconnect
- **WHEN** an offline user logs a prayer and the network later returns
- **THEN** the log remains visible while offline and is delivered to the server after reconnect

### Requirement: Data traffic is never served from the shell cache
The service worker SHALL NOT cache or answer Supabase or other API requests; they go to the network and fail normally when offline.

#### Scenario: API request while online
- **WHEN** the app calls Supabase while online
- **THEN** the request reaches the network and returns live data, not a cached response

### Requirement: Updates reach users
When a new deploy is available, the system SHALL notify the user and apply the new version on their confirmation, and SHALL NOT keep serving an old shell indefinitely.

#### Scenario: New version available
- **WHEN** a new build has been deployed and the user has the app open or reopens it online
- **THEN** the user is told an update is available and can reload to switch to it

#### Scenario: No broken chunks after deploy
- **WHEN** the user reloads after updating
- **THEN** all scripts and styles load from the new build with no missing-asset errors

### Requirement: Service worker is always revalidated
The hosting configuration SHALL serve the service worker script so that browsers check for a new copy on each load.

#### Scenario: Worker file freshness
- **WHEN** a browser requests the service worker script
- **THEN** the response forbids long-term caching so a new deploy is detected
