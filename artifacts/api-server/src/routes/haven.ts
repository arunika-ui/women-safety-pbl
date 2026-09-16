import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  CreateJournalEntryBody,
  CreateSafetyCheckinBody,
  CreateTrustedContactBody,
  CreateJourneyBody,
  DeleteJournalEntryParams,
  DeleteTrustedContactParams,
  SendCompanionMessageBody,
  UpdateJournalEntryBody,
  UpdateJournalEntryParams,
  UpdateJourneyStatusBody,
  UpdateJourneyStatusParams,
} from "@workspace/api-zod";

type Mood = "calm" | "happy" | "anxious" | "sad" | "angry" | "overwhelmed" | "numb";
type JourneyStatus = "active" | "arrived" | "overdue" | "cancelled";
type SharingStatus = "active" | "paused" | "unavailable";

type JournalEntry = {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

type TrustedContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  isEmergencyContact: boolean;
};

type Journey = {
  id: string;
  destination: string;
  expectedArrival: string;
  startedAt: string;
  status: JourneyStatus;
  sharingStatus: SharingStatus;
  contactIds: string[];
};

type SupportResource = {
  id: string;
  category: "emergency" | "professional" | "legal" | "safety";
  name: string;
  description: string;
  phone: string | null;
  website: string | null;
  verifiedAt: string;
  isDemo: boolean;
};

type SafetyCheckin = {
  id: string;
  dueAt: string;
  status: "pending" | "safe" | "need_more_time" | "get_help";
};

type ChatMessage = {
  id: string;
  role: "user" | "companion" | "system";
  content: string;
  createdAt: string;
  safetyLevel: "normal" | "prioritize_help" | "crisis";
};

const now = () => new Date().toISOString();

const contacts: TrustedContact[] = [
  {
    id: "contact-maya",
    name: "Maya Patel",
    relationship: "Sister",
    phone: "+91 98 7654 3210",
    email: "maya@example.com",
    isEmergencyContact: true,
  },
  {
    id: "contact-nina",
    name: "Nina Shah",
    relationship: "Friend",
    phone: "+91 98 1234 5678",
    email: null,
    isEmergencyContact: true,
  },
  {
    id: "contact-rohan",
    name: "Rohan Mehta",
    relationship: "Partner",
    phone: "+91 99 1122 3344",
    email: null,
    isEmergencyContact: false,
  },
];

const journalEntries: JournalEntry[] = [
  {
    id: "journal-quiet-win",
    title: "A quiet win",
    content:
      "I took the long way home and noticed how much calmer I felt after leaving some space in the day.",
    mood: "calm",
    tags: ["reflection", "routine"],
    isFavorite: true,
    createdAt: "2026-09-15T18:40:00.000Z",
    updatedAt: "2026-09-15T18:40:00.000Z",
  },
  {
    id: "journal-boundaries",
    title: "Boundaries are information",
    content:
      "I do not need to explain every no. Paying attention to that feeling is enough information for now.",
    mood: "happy",
    tags: ["boundaries"],
    isFavorite: false,
    createdAt: "2026-09-13T17:15:00.000Z",
    updatedAt: "2026-09-13T17:15:00.000Z",
  },
];

let journeys: Journey[] = [];
let checkins: SafetyCheckin[] = [];

const resources: SupportResource[] = [
  {
    id: "resource-companion",
    category: "professional",
    name: "Haven Companion",
    description:
      "A private AI space for reflection and emotional support. It is not a replacement for professional mental-health care.",
    phone: null,
    website: null,
    verifiedAt: "2026-09-16",
    isDemo: false,
  },
  {
    id: "resource-directory-demo",
    category: "professional",
    name: "Verified provider directory",
    description:
      "Provider matching becomes available when a verified regional directory is connected. This placeholder does not represent a real therapist.",
    phone: null,
    website: null,
    verifiedAt: "2026-09-16",
    isDemo: true,
  },
  {
    id: "resource-safety-basics",
    category: "safety",
    name: "Digital safety basics",
    description:
      "Review account security, location privacy, device safety, suspicious links, and preserving evidence.",
    phone: null,
    website: null,
    verifiedAt: "2026-09-16",
    isDemo: false,
  },
  {
    id: "resource-emergency-config",
    category: "emergency",
    name: "Local emergency resources",
    description:
      "Emergency numbers are shown only after a verified country and region resource database is connected.",
    phone: null,
    website: null,
    verifiedAt: "2026-09-16",
    isDemo: true,
  },
  {
    id: "resource-legal-demo",
    category: "legal",
    name: "Legal resource directory",
    description:
      "A verified legal support directory can be connected for your region. No legal provider is represented here.",
    phone: null,
    website: null,
    verifiedAt: "2026-09-16",
    isDemo: true,
  },
];

function getJourney() {
  return journeys.find((journey) => journey.status === "active") ?? journeys[0] ?? null;
}

function getActivity() {
  return [
    {
      id: "activity-checkin",
      type: "checkin" as const,
      title: "Safety check-in",
      detail: "You checked in safely yesterday",
      createdAt: "2026-09-15T20:00:00.000Z",
    },
    {
      id: "activity-journal",
      type: "journal" as const,
      title: "Journal entry",
      detail: "A quiet win",
      createdAt: "2026-09-15T18:40:00.000Z",
    },
    {
      id: "activity-support",
      type: "support" as const,
      title: "Haven Companion",
      detail: "A private conversation space is ready",
      createdAt: "2026-09-14T12:30:00.000Z",
    },
  ];
}

function getCompanionResponse(content: string): ChatMessage {
  const normalized = content.toLowerCase();
  const immediateDanger =
    normalized.includes("not safe") ||
    normalized.includes("in danger") ||
    normalized.includes("hurt me") ||
    normalized.includes("harming myself") ||
    normalized.includes("kill myself");

  if (immediateDanger) {
    return {
      id: randomUUID(),
      role: "companion",
      content:
        "I’m really glad you told me. If you are in immediate danger, please call your local emergency service now or move toward a person and place that feels safer. You can also open Haven’s emergency screen to share your location with a trusted contact. I can stay with you while you decide your next small step.",
      createdAt: now(),
      safetyLevel: normalized.includes("kill myself") || normalized.includes("harming myself")
        ? "crisis"
        : "prioritize_help",
    };
  }

  if (normalized.includes("anxious") || normalized.includes("overwhelmed")) {
    return {
      id: randomUUID(),
      role: "companion",
      content:
        "That sounds like a lot to hold at once. Try naming three things you can see, then one thing that would make the next ten minutes feel a little easier. You do not have to solve the whole situation right now.",
      createdAt: now(),
      safetyLevel: "normal",
    };
  }

  return {
    id: randomUUID(),
    role: "companion",
    content:
      "I’m here with you. You can share as much or as little as feels right. Would it help to talk through what happened, notice how it felt in your body, or think about one practical next step?",
    createdAt: now(),
    safetyLevel: "normal",
  };
}

const router: IRouter = Router();

router.get("/haven/dashboard", (_req, res) => {
  res.json({
    firstName: "Arunika",
    trustedContactCount: contacts.length,
    currentMood: null,
    recentActivity: getActivity(),
    journey: getJourney(),
  });
});

router.get("/haven/journal", (_req, res) => {
  res.json(journalEntries);
});

router.post("/haven/journal", (req, res) => {
  const parsed = CreateJournalEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the journal entry details." });
    return;
  }
  const timestamp = now();
  const entry: JournalEntry = {
    id: randomUUID(),
    title: parsed.data.title,
    content: parsed.data.content,
    mood: parsed.data.mood,
    tags: parsed.data.tags ?? [],
    isFavorite: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  journalEntries.unshift(entry);
  res.status(201).json(entry);
});

router.patch("/haven/journal/:id", (req, res) => {
  const params = UpdateJournalEntryParams.safeParse(req.params);
  const body = UpdateJournalEntryBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Please check the journal entry details." });
    return;
  }
  const entry = journalEntries.find((item) => item.id === params.data.id);
  if (!entry) {
    res.status(404).json({ error: "Journal entry not found." });
    return;
  }
  Object.assign(entry, body.data, { updatedAt: now() });
  res.json(entry);
});

router.delete("/haven/journal/:id", (req, res) => {
  const parsed = DeleteJournalEntryParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid journal entry." });
    return;
  }
  const index = journalEntries.findIndex((item) => item.id === parsed.data.id);
  if (index === -1) {
    res.status(404).json({ error: "Journal entry not found." });
    return;
  }
  journalEntries.splice(index, 1);
  res.status(204).send();
});

router.get("/haven/contacts", (_req, res) => {
  res.json(contacts);
});

router.post("/haven/contacts", (req, res) => {
  const parsed = CreateTrustedContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the trusted contact details." });
    return;
  }
  const contact: TrustedContact = {
    id: randomUUID(),
    name: parsed.data.name,
    relationship: parsed.data.relationship,
    phone: parsed.data.phone,
    email: parsed.data.email ?? null,
    isEmergencyContact: parsed.data.isEmergencyContact ?? false,
  };
  contacts.push(contact);
  res.status(201).json(contact);
});

router.delete("/haven/contacts/:id", (req, res) => {
  const parsed = DeleteTrustedContactParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid trusted contact." });
    return;
  }
  const index = contacts.findIndex((item) => item.id === parsed.data.id);
  if (index === -1) {
    res.status(404).json({ error: "Trusted contact not found." });
    return;
  }
  contacts.splice(index, 1);
  res.status(204).send();
});

router.get("/haven/journeys", (_req, res) => {
  res.json(journeys);
});

router.post("/haven/journeys", (req, res) => {
  const parsed = CreateJourneyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check your journey details." });
    return;
  }
  const journey: Journey = {
    id: randomUUID(),
    destination: parsed.data.destination,
    expectedArrival: parsed.data.expectedArrival.toISOString(),
    startedAt: now(),
    status: "active",
    sharingStatus: "unavailable",
    contactIds: parsed.data.contactIds,
  };
  journeys = [journey, ...journeys.filter((item) => item.status !== "active")];
  res.status(201).json(journey);
});

router.patch("/haven/journeys/:id/status", (req, res) => {
  const params = UpdateJourneyStatusParams.safeParse(req.params);
  const body = UpdateJourneyStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid journey status." });
    return;
  }
  const journey = journeys.find((item) => item.id === params.data.id);
  if (!journey) {
    res.status(404).json({ error: "Journey not found." });
    return;
  }
  journey.status = body.data.status;
  res.json(journey);
});

router.get("/haven/resources", (_req, res) => {
  res.json(resources);
});

router.post("/haven/checkins", (req, res) => {
  const parsed = CreateSafetyCheckinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please choose a valid check-in duration." });
    return;
  }
  const checkin: SafetyCheckin = {
    id: randomUUID(),
    dueAt: new Date(Date.now() + parsed.data.durationMinutes * 60_000).toISOString(),
    status: "pending",
  };
  checkins = [checkin, ...checkins];
  res.status(201).json(checkin);
});

router.post("/haven/chat", (req, res) => {
  const parsed = SendCompanionMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please write a message first." });
    return;
  }
  res.json(getCompanionResponse(parsed.data.content));
});

export default router;