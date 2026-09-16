import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Coordinates = { latitude: number; longitude: number };
export type JourneyStatus =
  | 'idle'
  | 'active'
  | 'missed'
  | 'escalated'
  | 'safe'
  | 'ended';
export type LocationStatus =
  | 'not-requested'
  | 'acquiring'
  | 'active'
  | 'unavailable';
export type WellnessMood = 'great' | 'good' | 'okay' | 'anxious' | 'low' | 'unsafe';

export type DemoJourney = {
  destination: string;
  expectedArrival: string;
  startedAt: string;
  contactIds: string[];
  status: JourneyStatus;
  locationStatus: LocationStatus;
  coordinates: Coordinates | null;
  lastCheckInAt: string | null;
};

export type WellnessCheckin = {
  id: string;
  mood: WellnessMood;
  energy: number;
  stress: number;
  note: string;
  createdAt: string;
};

export type SafetyPlan = {
  trustedPeople: string;
  safePlaces: string;
  codeWord: string;
  ifFollowed: string;
  firstContact: string;
  emergencyNumbers: string;
  notes: string;
};

export type Incident = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category: string;
  notes: string;
  attachmentName: string;
};

type HavenDemoContextValue = {
  demoMode: boolean;
  disguiseMode: boolean;
  exitToStudyDashboard: () => void;
  returnToHaven: () => void;
  journey: DemoJourney | null;
  startJourney: (input: {
    destination: string;
    durationMinutes: number;
    contactIds: string[];
  }) => Promise<void>;
  markJourneySafe: () => void;
  endJourney: () => void;
  demoMissedCheckIn: () => void;
  escalateJourney: () => void;
  requestLocation: () => Promise<Coordinates | null>;
  wellness: WellnessCheckin[];
  addWellnessCheckin: (input: Omit<WellnessCheckin, 'id' | 'createdAt'>) => void;
  safetyPlan: SafetyPlan;
  saveSafetyPlan: (plan: SafetyPlan) => void;
  incidents: Incident[];
  saveIncident: (incident: Incident) => void;
  deleteIncident: (id: string) => void;
};

const defaultSafetyPlan: SafetyPlan = {
  trustedPeople: '',
  safePlaces: '',
  codeWord: '',
  ifFollowed: '',
  firstContact: '',
  emergencyNumbers: '',
  notes: '',
};

const emptyJourney = (): DemoJourney | null => null;

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored<T>(key: string, value: T) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

function getPosition(): Promise<Coordinates | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 },
    );
  });
}

const HavenDemoContext = createContext<HavenDemoContextValue | null>(null);

export function HavenDemoProvider({ children }: { children: ReactNode }) {
  const demoMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('demo') === 'true';
  const [disguiseMode, setDisguiseMode] = useState(false);
  const [journey, setJourney] = useState<DemoJourney | null>(() =>
    readStored('haven-demo-journey', emptyJourney()),
  );
  const [wellness, setWellness] = useState<WellnessCheckin[]>(() =>
    readStored('haven-wellness-checkins', []),
  );
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlan>(() =>
    readStored('haven-safety-plan', defaultSafetyPlan),
  );
  const [incidents, setIncidents] = useState<Incident[]>(() =>
    readStored('haven-incidents', []),
  );

  const persistJourney = useCallback((next: DemoJourney | null) => {
    setJourney(next);
    writeStored('haven-demo-journey', next);
  }, []);

  const requestLocation = useCallback(async () => {
    const coordinates = await getPosition();
    return coordinates;
  }, []);

  const startJourney = useCallback(
    async ({
      destination,
      durationMinutes,
      contactIds,
    }: {
      destination: string;
      durationMinutes: number;
      contactIds: string[];
    }) => {
      const coordinates = await requestLocation();
      const startedAt = new Date();
      const next: DemoJourney = {
        destination,
        expectedArrival: new Date(
          startedAt.getTime() + durationMinutes * 60_000,
        ).toISOString(),
        startedAt: startedAt.toISOString(),
        contactIds,
        status: 'active',
        locationStatus: coordinates ? 'active' : 'unavailable',
        coordinates,
        lastCheckInAt: null,
      };
      persistJourney(next);
    },
    [persistJourney, requestLocation],
  );

  useEffect(() => {
    if (!journey || journey.status !== 'active') return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const next = {
          ...journey,
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          locationStatus: 'active' as const,
        };
        persistJourney(next);
      },
      () => {
        persistJourney({ ...journey, locationStatus: 'unavailable' });
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [journey, persistJourney]);

  const markJourneySafe = useCallback(() => {
    if (journey) {
      persistJourney({ ...journey, status: 'safe', lastCheckInAt: new Date().toISOString() });
    }
  }, [journey, persistJourney]);

  const endJourney = useCallback(() => {
    if (journey) persistJourney({ ...journey, status: 'ended' });
  }, [journey, persistJourney]);

  const demoMissedCheckIn = useCallback(() => {
    if (demoMode && journey) persistJourney({ ...journey, status: 'missed' });
  }, [demoMode, journey, persistJourney]);

  const escalateJourney = useCallback(() => {
    if (journey) persistJourney({ ...journey, status: 'escalated' });
  }, [journey, persistJourney]);

  const addWellnessCheckin = useCallback(
    (input: Omit<WellnessCheckin, 'id' | 'createdAt'>) => {
      const next = [
        { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
        ...wellness,
      ];
      setWellness(next);
      writeStored('haven-wellness-checkins', next);
    },
    [wellness],
  );

  const savePlan = useCallback((plan: SafetyPlan) => {
    setSafetyPlan(plan);
    writeStored('haven-safety-plan', plan);
  }, []);

  const saveIncident = useCallback(
    (incident: Incident) => {
      const next = [incident, ...incidents.filter((item) => item.id !== incident.id)];
      setIncidents(next);
      writeStored('haven-incidents', next);
    },
    [incidents],
  );

  const deleteIncident = useCallback(
    (id: string) => {
      const next = incidents.filter((item) => item.id !== id);
      setIncidents(next);
      writeStored('haven-incidents', next);
    },
    [incidents],
  );

  useEffect(() => {
    let lastEscape = 0;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const now = Date.now();
      if (now - lastEscape < 650) setDisguiseMode(true);
      lastEscape = now;
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = useMemo<HavenDemoContextValue>(
    () => ({
      demoMode,
      disguiseMode,
      exitToStudyDashboard: () => setDisguiseMode(true),
      returnToHaven: () => setDisguiseMode(false),
      journey,
      startJourney,
      markJourneySafe,
      endJourney,
      demoMissedCheckIn,
      escalateJourney,
      requestLocation,
      wellness,
      addWellnessCheckin,
      safetyPlan,
      saveSafetyPlan: savePlan,
      incidents,
      saveIncident,
      deleteIncident,
    }),
    [
      addWellnessCheckin,
      demoMissedCheckIn,
      demoMode,
      disguiseMode,
      endJourney,
      escalateJourney,
      incidents,
      journey,
      markJourneySafe,
      requestLocation,
      safetyPlan,
      saveIncident,
      savePlan,
      startJourney,
      wellness,
      deleteIncident,
    ],
  );

  return <HavenDemoContext.Provider value={value}>{children}</HavenDemoContext.Provider>;
}

export function useHavenDemo() {
  const value = useContext(HavenDemoContext);
  if (!value) throw new Error('useHavenDemo must be used within HavenDemoProvider');
  return value;
}