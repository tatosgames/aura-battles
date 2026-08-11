# Vendor integration

The template is fully local by default. `PlatformAdapter` provides local audio, no-op analytics, and an empty `VendorAdapter`; it sends no request and contains no credentials, SDK URLs, game IDs, or production identifiers.

To add a portal/vendor, implement `VendorAdapter` in an application-owned module and inject it when building the platform. Use `VendorLifecycle`: call `init()` during boot, `loadingFinished()` once after the local runtime is ready, and `playerInteraction()` from a real pointer/keyboard event. That last method is the only path that can start gameplay, preventing autoplay lifecycle calls from React effects. Stop gameplay on scene end, visibility suspension, and unmount. Vendor errors are caught; the local game must remain functional.

Keep vendor APIs at `src/app/platform`. They may observe lifecycle or optional measures, but must not access Rapier, mutate game state, alter the fixed timestep, or become a runtime requirement for local development/testing.
