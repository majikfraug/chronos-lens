import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { useGameStore } from '../state/gameStore';

export type LocationTrackingStatus = 'requesting' | 'granted' | 'denied' | 'error';

/**
 * Requests foreground location permission and streams the player's real
 * position into the game store. Field map (brief §2.1) requires this to be
 * live and continuous while the app is open — no simulated movement in v1.
 */
export function useLocationTracking(): LocationTrackingStatus {
  const [status, setStatus] = useState<LocationTrackingStatus>('requesting');
  const recordMovement = useGameStore((s) => s.recordMovement);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    async function start() {
      const { status: permission } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (permission !== 'granted') {
        setStatus('denied');
        return;
      }
      setStatus('granted');

      try {
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 2000,
            distanceInterval: 5,
          },
          (loc) => {
            void recordMovement(
              {
                lat: loc.coords.latitude,
                lon: loc.coords.longitude,
              },
              // meters/second; null or negative when the fix has no speed
              loc.coords.speed != null && loc.coords.speed >= 0 ? loc.coords.speed : undefined
            );
          }
        );
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void start();
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [recordMovement]);

  return status;
}
