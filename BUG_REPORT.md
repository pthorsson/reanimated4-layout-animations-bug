# [Reanimated 4][Android] Animated.View with exiting animation gets stuck on screen on unmount

## Description

When using `entering`/`exiting` layout animations on `Animated.View` components, the component can get stuck on screen even after it has been removed from the React tree. The view remains visible indefinitely and cannot be cleared without reloading the app.

This seems to happen when layout animations are running while the UI thread is under heavy or spiky load.

(Video goes here)

## Expected behavior

When an `Animated.View` with an `exiting` animation is unmounted, the exit animation plays and the view is removed from the screen.

## Actual behavior

The view gets stuck mid-animation or fully visible on screen after unmounting. It never disappears. A full app reload is required to clear it.

## Reproduction

Minimal reproduce repo: https://github.com/pthorsson/reanimated4-layout-animations-bug

The repo renders a fixed grid of slots where each slot conditionally mounts an `Animated.View` with `entering={ZoomIn}` and `exiting={ZoomOut}`. Items cycle through mount → unmount every 100ms. Every second, a spike of 30 additional short-lived animated views is mounted and immediately unmounted to stress the UI thread.

**Steps:**

1. Clone the repo and run on an affected device
2. Tap **Start** — items begin cycling in and out with zoom animations
3. Wait for the automatic spike (fires every 1s, shown by the countdown)
4. Observe that one or more items remain stuck on screen after the spike, even though they are no longer in the React tree

> **Note:** The `SPIKE_COUNT` and `SPIKE_INTERVAL_MS` constants in `src/App.tsx` may need to be tweaked per device to create a sufficient spike without crashing.

## Environment

- **react-native-reanimated:** ~4.1.1 (also observed on Expo 55 with RN 0.83.2)
- **React Native:** 0.81.5 (Fabric)
- **Expo:** ~54.0.33
- **Platform:** Android (not tested on iOS)

> When running Reanimated 3 on Fabric we have not observed this behavior.

## Tested on device and emulators

| Device                               | Android Version | Managed to reproduce                |
| ------------------------------------ | --------------- | ----------------------------------- |
| Galaxy Tab Active4 Pro 5G (SM-T636B) | 15              | Yes (most frequent)                 |
| Pixel 7a                             | 16              | Yes                                 |
| Galaxy Tab S9+ (SM-X810)             | 15              | No                                  |
| Android Studio Emulator              | 15              | Yes                                 |
| Expo Snack Emulator                  | 16              | No (tried multiple Android devices) |
