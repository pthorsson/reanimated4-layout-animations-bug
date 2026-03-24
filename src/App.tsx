import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DevSettings,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  ZoomIn,
  ZoomOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// UI thread spike settings
// To create the optimal conditions for the bug to appear these differs from device to device
const SPIKE_COUNT = 30;
const SPIKE_INTERVAL_MS = 1000;

const ITEM_LOOP_INTERVAL_MS = 50;
const ITEM_COUNT = 12;

const COLORS = [
  '#FF6B6B',
  '#FFD93D',
  '#6BCB77',
  '#4D96FF',
  '#C77DFF',
  '#FF9F45',
  '#00C9A7',
  '#F72585',
  '#4CC9F0',
  '#7209B7',
];

// Mounts briefly then unmounts itself — used to create a one-shot animation spike
function SpikeNode({ index, onDone }: { index: number; onDone: () => void }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 200 + (index % 8) * 50 }),
      -1,
      true
    );
    const t = setTimeout(onDone, 32); // unmount after ~2 frames
    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: 0.15 + progress.value * 0.1,
    transform: [{ scale: 0.95 + progress.value * 0.1 }],
  }));

  return <Animated.View style={[styles.stressNode, style]} />;
}

export const App: React.FC = () => {
  const [visibleIds, setVisibleIds] = useState<Set<number>>(() => new Set());
  const [running, setRunning] = useState(false);
  const [spikeIds, setSpikeIds] = useState<number[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const spikeCounterRef = useRef(0);
  const spikeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cursorRef = useRef(0);

  const mountNext = useCallback(() => {
    const id = cursorRef.current;
    cursorRef.current = (cursorRef.current + 1) % ITEM_COUNT;

    setVisibleIds((prev) => new Set(prev).add(id));

    const t = setTimeout(() => {
      setVisibleIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 100);
    timeoutsRef.current.push(t);
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(mountNext, ITEM_LOOP_INTERVAL_MS);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mountNext]);

  const fireSpike = useCallback(() => {
    const ids = Array.from(
      { length: SPIKE_COUNT },
      () => spikeCounterRef.current++
    );
    setSpikeIds((prev) => [...prev, ...ids]);
    setCountdown(SPIKE_INTERVAL_MS / 1000);
  }, []);

  // Auto-spike every 2s with countdown
  useEffect(() => {
    if (!running) {
      if (spikeIntervalRef.current) clearInterval(spikeIntervalRef.current);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
      spikeIntervalRef.current = null;
      countdownIntervalRef.current = null;
      setCountdown(null);
      return;
    }

    setCountdown(SPIKE_INTERVAL_MS / 1000);
    spikeIntervalRef.current = setInterval(fireSpike, SPIKE_INTERVAL_MS);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((c) =>
        c !== null && c > 1 ? c - 1 : SPIKE_INTERVAL_MS / 1000
      );
    }, 1000);

    return () => {
      if (spikeIntervalRef.current) clearInterval(spikeIntervalRef.current);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, [running, fireSpike]);

  const removeSpikeId = useCallback((id: number) => {
    setSpikeIds((prev) => prev.filter((x) => x !== id));
  }, []);

  return (
    <View style={styles.root}>
      {/* Spike nodes — mount briefly then self-remove to create a UI thread burst */}
      <View style={styles.stressContainer} pointerEvents="none">
        {spikeIds.map((id) => (
          <SpikeNode key={id} index={id} onDone={() => removeSpikeId(id)} />
        ))}
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>
          Reanimated 4 — Layout Animation Stress Test
        </Text>
        <Text style={styles.hint}>
          Bug: items may remain visible after unmounting (ghost views)
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={[styles.btn, styles.btnStart, running && styles.btnDisabled]}
          onPress={() => setRunning(true)}
          disabled={running}
        >
          <Text style={styles.btnText}>Start</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, styles.btnStop, !running && styles.btnDisabled]}
          onPress={() => setRunning(false)}
          disabled={!running}
        >
          <Text style={styles.btnText}>Stop</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, styles.btnReload]}
          onPress={() => DevSettings.reload()}
        >
          <Text style={styles.btnText}>Reload UI</Text>
        </Pressable>
      </View>

      <Text style={styles.spikeLabel}>
        {countdown !== null ? `Next spike in ${countdown}s` : 'Stopped'}
      </Text>

      <ScrollView contentContainerStyle={styles.grid}>
        {Array.from({ length: ITEM_COUNT }, (_, i) => {
          const isVisible = visibleIds.has(i);
          const color = COLORS[i % COLORS.length];
          return (
            <View key={i} style={styles.slot}>
              <View style={styles.slotPlaceholder}>
                <Text style={styles.slotIndex}>{i}</Text>
              </View>
              {isVisible && (
                <Animated.View
                  style={[styles.itemFill, { backgroundColor: color }]}
                  entering={ZoomIn}
                  exiting={ZoomOut}
                >
                  <Text style={styles.itemText}>{i}</Text>
                </Animated.View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 60,
  },
  stressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 1,
    overflow: 'hidden',
  },
  stressNode: {
    width: 4,
    height: 4,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  hint: {
    color: '#FF6B6B',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  spikeLabel: {
    color: '#FF9F45',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  btn: {
    paddingHorizontal: 24,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnStart: { backgroundColor: '#6BCB77' },
  btnStop: { backgroundColor: '#FF6B6B' },
  btnReload: { backgroundColor: '#4D96FF' },
  btnDisabled: { opacity: 0.35 },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    paddingBottom: 40,
  },
  slot: {
    width: 64,
    height: 64,
  },
  slotPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotIndex: {
    color: '#444',
    fontSize: 13,
    fontWeight: '600',
  },
  itemFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
