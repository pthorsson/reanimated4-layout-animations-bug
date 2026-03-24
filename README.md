# reanimated4-layout-animations-bug

Minimal reproduction for a bug in React Native Reanimated 4 where `Animated.View` components with `exiting` layout animations get stuck on screen after unmounting. See `BUG_REPORT.md` for full details.

## Running the app

Android only — this bug has not been tested on iOS.

**Prerequisites:** Android Studio with an emulator set up, or a physical Android device connected via USB with developer mode enabled.

1. Install dependencies

   ```bash
   npm install
   ```

2. Run on Android

   ```bash
   npm run android
   ```

## Reproducing the bug

1. Tap **Start** — items begin cycling in and out with zoom animations
2. Wait for the automatic spike (fires every 1s, shown by the countdown)
3. Observe that one or more items remain stuck on screen even though they are no longer in the React tree

## Tweaking spike settings

The spike is what stresses the UI thread to trigger the bug. The right values depend on the device — too low and the bug won't appear, too high and the app may crash or freeze.

Adjust these constants at the top of `src/App.tsx`:

```ts
const SPIKE_COUNT = 30; // Number of animated views mounted in each spike
const SPIKE_INTERVAL_MS = 1000; // How often the spike fires (ms)
```

If you can't reproduce it, try increasing `SPIKE_COUNT` and/or decreasing `SPIKE_INTERVAL_MS`. If the app becomes unresponsive, lower it.
