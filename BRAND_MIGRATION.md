# Sandpaper brand migration

AppFinisher AI is now **Sandpaper**.

**Positioning:** Application completion and release readiness.

**Tagline:** AI built it. Sandpaper proves it's ready.

This release changes the customer-facing product name while preserving compatibility-sensitive implementation details:

- The existing repository history remains authoritative.
- The internal `lib/shipguard-engine` module path and its exported TypeScript identifiers remain stable for now.
- Existing stored project and report data remains readable.
- New UI, documentation, exported reports, and product copy should use **Sandpaper**.

Internal legacy identifiers will only move through an explicit, tested migration—not a destructive rename.

Product home: <https://UseSandpaper.com>
