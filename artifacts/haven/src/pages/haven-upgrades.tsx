import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileText,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Navigation,
  Pencil,
  Phone,
  Plus,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UsersRound,
  X,
  Zap,
} from 'lucide-react';
import {
  useListSupportResources,
  useListTrustedContacts,
  useSendCompanionMessage,
} from '@workspace/api-client-react';
import {
  type Incident,
  type SafetyPlan,
  type WellnessMood,
  useHavenDemo,
} from '@/features/haven-demo';

function UButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'soft' | 'quiet' | 'danger';
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-md',
    soft: 'bg-secondary text-secondary-foreground hover:brightness-[.98]',
    quiet: 'border border-border bg-transparent text-foreground hover:bg-muted',
    danger: 'bg-destructive text-destructive-foreground hover:brightness-95',
  };
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function UCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[24px] border border-border bg-card shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function UEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">
      {children}
    </p>
  );
}

function UField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-normal outline-none transition focus:border-primary"
        {...props}
      />
    </label>
  );
}

function UTextarea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <textarea
        className="mt-2 min-h-24 w-full resize-y rounded-xl border border-input bg-background p-3 text-sm font-normal outline-none transition focus:border-primary"
        {...props}
      />
    </label>
  );
}

function PageIntro({
  eyebrow,
  title,
  detail,
  action,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <UEyebrow>{eyebrow}</UEyebrow>
        <h1 className="mt-2 font-display text-5xl leading-[.95] tracking-tight text-primary md:text-6xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
      {action}
    </div>
  );
}

function BackLink({ href = '/safety', children = 'Back to safety' }: { href?: string; children?: React.ReactNode }) {
  return (
    <Link href={href} className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-primary">
      <ArrowLeft size={15} />
      {children}
    </Link>
  );
}

function JourneyStatus({
  status,
}: {
  status: 'active' | 'missed' | 'escalated' | 'safe' | 'ended';
}) {
  const copy = {
    active: ['Journey active', 'Keep this screen open while you travel.', 'bg-secondary text-primary'],
    missed: ['Check-in missed', 'Take a moment to confirm you are okay.', 'bg-[#e9cfc0] text-primary'],
    escalated: ['Safety warning', 'Your next safety choices are ready.', 'bg-destructive text-destructive-foreground'],
    safe: ['Arrived safely', 'Your journey has been checked in.', 'bg-[#cfddd6] text-primary'],
    ended: ['Journey ended', 'No sharing is active from this session.', 'bg-muted text-foreground'],
  } as const;
  const [title, detail, color] = copy[status];
  return (
    <div className={`rounded-2xl p-4 ${color}`}>
      <div className="flex items-center gap-3">
        <span className={`size-2.5 rounded-full ${status === 'active' ? 'animate-pulse bg-primary' : 'bg-accent'}`} />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs opacity-70">{detail}</p>
        </div>
      </div>
    </div>
  );
}

export function JourneyGuardian() {
  const { journey, startJourney, markJourneySafe, endJourney, demoMissedCheckIn, escalateJourney, demoMode } =
    useHavenDemo();
  const contacts = useListTrustedContacts();
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('30');
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const elapsed = journey
    ? Math.max(0, Math.floor((now - new Date(journey.startedAt).getTime()) / 1000))
    : 0;
  const remaining = journey
    ? Math.max(0, Math.floor((new Date(journey.expectedArrival).getTime() - now) / 1000))
    : 0;
  const locationLabel = journey?.coordinates
    ? `${journey.coordinates.latitude.toFixed(5)}, ${journey.coordinates.longitude.toFixed(5)}`
    : journey?.locationStatus === 'unavailable'
      ? 'Location unavailable'
      : 'Waiting for permission';

  if (!journey || ['safe', 'ended'].includes(journey.status)) {
    return (
      <div className="mx-auto max-w-3xl animate-rise">
        <BackLink />
        <PageIntro
          eyebrow="journey guardian"
          title="Make the way home feel lighter."
          detail="Start a timed journey, choose who should be close, and keep this page open while you travel. Haven only uses location while this page remains active and permission is granted."
        />
        <UCard className="p-6 md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <UField
              label="Destination"
              placeholder="A place, neighborhood, or campus building"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              data-testid="input-guardian-destination"
            />
            <UField
              label="Expected duration (minutes)"
              type="number"
              min="1"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              data-testid="input-guardian-duration"
            />
          </div>
          <div className="mt-6 border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <div>
                <UEyebrow>trusted circle</UEyebrow>
                <h2 className="mt-2 font-display text-3xl">Who should know?</h2>
              </div>
              <UsersRound className="text-accent" />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(contacts.data ?? []).map((contact) => {
                const checked = contactIds.includes(contact.id);
                return (
                  <label
                    key={contact.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-sm transition ${
                      checked ? 'border-primary bg-secondary/50' : 'border-border bg-background'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setContactIds((current) =>
                          checked
                            ? current.filter((id) => id !== contact.id)
                            : [...current, contact.id],
                        )
                      }
                    />
                    <span className="flex-1">
                      <span className="block font-semibold">{contact.name}</span>
                      <span className="text-xs text-muted-foreground">{contact.relationship}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
            <UButton
              className="w-full sm:w-auto"
              disabled={!destination.trim() || !Number(duration)}
              onClick={() =>
                void startJourney({
                  destination: destination.trim(),
                  durationMinutes: Number(duration),
                  contactIds,
                })
              }
              data-testid="button-start-guardian"
            >
              <Navigation size={16} />
              Start Journey Guardian
            </UButton>
            <p className="text-xs leading-5 text-muted-foreground">
              Your browser will ask for location permission. A denied permission keeps the journey usable,
              but coordinates will remain unavailable.
            </p>
          </div>
        </UCard>
      </div>
    );
  }

  const selectedContacts = (contacts.data ?? []).filter((contact) =>
    journey.contactIds.includes(contact.id),
  );
  const status = journey.status === 'active' ? 'active' : journey.status;
  const mapsUrl = journey.coordinates
    ? `https://www.google.com/maps?q=${journey.coordinates.latitude},${journey.coordinates.longitude}`
    : null;

  return (
    <div className="mx-auto max-w-4xl animate-rise">
      <BackLink />
      <PageIntro
        eyebrow="live journey guardian"
        title={journey.destination}
        detail="Keep this page open for live browser location updates. Haven cannot continue tracking after the browser or operating system stops allowing access."
        action={
          <Link
            href="/emergency"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-destructive px-4 text-sm font-semibold text-destructive-foreground"
          >
            <Zap size={16} />
            SOS
          </Link>
        }
      />
      <JourneyStatus status={status} />
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <UCard className={`p-6 md:p-8 ${journey.status === 'escalated' ? 'border-destructive' : ''}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-muted/55 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock3 size={15} />
                <span className="text-xs font-semibold uppercase tracking-wider">elapsed</span>
              </div>
              <p className="mt-3 font-display text-4xl text-primary">
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/55 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock3 size={15} />
                <span className="text-xs font-semibold uppercase tracking-wider">check-in due</span>
              </div>
              <p className="mt-3 font-display text-4xl text-primary">
                {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 text-accent" size={18} />
              <div className="flex-1">
                <p className="text-sm font-semibold">Current location</p>
                <p className="mt-1 font-mono-ui text-xs text-muted-foreground">{locationLabel}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {journey.locationStatus === 'active'
                    ? 'Location sharing is active for this open journey.'
                    : 'No coordinates have been acquired. You can continue without them.'}
                </p>
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-border p-2 text-primary"
                  aria-label="Open current location in Google Maps"
                >
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          </div>
          {(journey.status === 'missed' || journey.status === 'escalated') && (
            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <ShieldAlert size={17} />
                Safety attention needed
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your check-in is not confirmed. Review your trusted circle or open SOS if you need immediate help.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <UButton onClick={markJourneySafe} variant="soft">
                  <Check size={16} />
                  I’m Safe
                </UButton>
                <Link
                  href="/emergency"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-destructive px-4 text-sm font-semibold text-destructive-foreground"
                >
                  <Zap size={16} />
                  Open SOS
                </Link>
              </div>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {journey.status === 'active' && (
              <UButton className="flex-1" onClick={markJourneySafe} data-testid="button-guardian-safe">
                <Check size={17} />
                I’m Safe
              </UButton>
            )}
            <UButton
              variant="quiet"
              className="flex-1"
              onClick={endJourney}
              data-testid="button-end-journey"
            >
              End Journey
            </UButton>
          </div>
        </UCard>
        <UCard className="p-6">
          <UEyebrow>chosen circle</UEyebrow>
          <h2 className="mt-2 font-display text-3xl">Close by.</h2>
          <div className="mt-5 space-y-2">
            {selectedContacts.length ? (
              selectedContacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 rounded-2xl bg-muted/55 p-3">
                  <span className="grid size-9 place-items-center rounded-full bg-primary text-sm text-primary-foreground">
                    {contact.name.slice(0, 1)}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{contact.name}</span>
                    <span className="text-xs text-muted-foreground">{contact.relationship}</span>
                  </span>
                  <a href={`tel:${contact.phone}`} aria-label={`Call ${contact.name}`} className="rounded-full bg-card p-2 text-primary">
                    <Phone size={15} />
                  </a>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-muted/55 p-4 text-sm leading-6 text-muted-foreground">
                No contacts were selected. Your journey still works on this screen.
              </p>
            )}
          </div>
          {demoMode && journey.status === 'active' && (
            <button
              className="mt-6 w-full rounded-2xl border border-dashed border-accent/60 bg-secondary/35 p-3 text-left text-xs font-semibold text-primary"
              onClick={demoMissedCheckIn}
              data-testid="button-demo-missed-checkin"
            >
              Demo control · simulate missed check-in
            </button>
          )}
          {demoMode && journey.status === 'missed' && (
            <button
              className="mt-3 w-full rounded-2xl bg-destructive p-3 text-left text-xs font-semibold text-destructive-foreground"
              onClick={escalateJourney}
              data-testid="button-demo-escalate"
            >
              Demo control · trigger escalation
            </button>
          )}
        </UCard>
      </div>
    </div>
  );
}

export function SmartEmergency() {
  const { requestLocation, journey } = useHavenDemo();
  const contacts = useListTrustedContacts();
  const [phase, setPhase] = useState<'ready' | 'holding' | 'activated'>('ready');
  const [countdown, setCountdown] = useState(3);
  const [coordinates, setCoordinates] = useState(journey?.coordinates ?? null);
  const [activatedAt, setActivatedAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  const clearTimer = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
  };

  useEffect(() => clearTimer, []);

  const activate = () => {
    clearTimer();
    setPhase('activated');
    setActivatedAt(new Date().toISOString());
    void requestLocation().then(setCoordinates);
  };

  const beginHold = () => {
    if (phase === 'activated') return;
    setPhase('holding');
    setCountdown(3);
    timer.current = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          activate();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const mapsUrl = coordinates
    ? `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`
    : null;
  const timestamp = activatedAt ? new Date(activatedAt).toLocaleString() : 'just now';
  const emergencyMessage = `I may need help. This is my current location: ${
    mapsUrl ?? 'Location unavailable'
  }. Haven SOS activated at ${timestamp}.`;

  const copyMessage = async () => {
    await navigator.clipboard?.writeText(emergencyMessage);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const shareMessage = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Haven SOS', text: emergencyMessage, url: mapsUrl ?? undefined });
    } else {
      await copyMessage();
    }
  };

  return (
    <div className="mx-auto max-w-3xl animate-rise">
      <BackLink href="/" children="Back to Haven" />
      <UCard className={`overflow-hidden ${phase === 'activated' ? 'border-destructive/50' : ''}`}>
        <div className={`p-7 md:p-12 ${phase === 'activated' ? 'bg-[#ead0c4] text-primary' : 'bg-primary text-primary-foreground'}`}>
          <div className="flex items-center justify-between">
            <span className={`grid size-14 place-items-center rounded-[20px] ${phase === 'activated' ? 'bg-[#f5e4dc]' : 'bg-secondary text-primary'}`}>
              <Zap size={25} />
            </span>
            <span className="font-mono-ui text-[10px] uppercase tracking-[.2em] opacity-60">
              {phase === 'activated' ? 'SOS activated' : 'smart SOS'}
            </span>
          </div>
          <h1 className="mt-10 font-display text-6xl leading-[.88] md:text-8xl">
            {phase === 'activated' ? <>You are<br /><i>not alone.</i></> : <>Make room<br /><i>for help.</i></>}
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-6 opacity-70">
            Haven prepares choices for you. It does not dispatch emergency services or notify contacts automatically.
          </p>
        </div>
        <div className="p-7 md:p-10">
          {phase !== 'activated' ? (
            <div className="text-center">
              <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
                Press and hold the button for three seconds. Releasing early cancels activation.
              </p>
              <button
                className={`mx-auto mt-7 grid size-44 place-items-center rounded-full border-8 text-center font-display text-3xl transition ${
                  phase === 'holding'
                    ? 'border-accent bg-secondary text-primary scale-105'
                    : 'border-primary/15 bg-muted text-primary'
                }`}
                onPointerDown={beginHold}
                onPointerUp={clearTimer}
                onPointerLeave={clearTimer}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') beginHold();
                }}
                onKeyUp={clearTimer}
                aria-label="Hold for three seconds to activate SOS"
                data-testid="button-hold-sos"
              >
                {phase === 'holding' ? countdown : 'Hold'}
                <span className="block text-xs font-sans font-semibold">for SOS</span>
              </button>
              <p className="mt-5 font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                {phase === 'holding' ? `${countdown} · keep holding` : 'hold to activate'}
              </p>
              <a href="tel:112" className="mt-8 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-primary">
                <Phone size={15} />
                Call local emergency services
              </a>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl bg-secondary/55 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 text-primary" size={18} />
                  <div>
                    <p className="text-sm font-semibold">Emergency message prepared</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {coordinates ? 'Location acquired for this session.' : 'Location unavailable — message is still ready to share.'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4 text-sm leading-6">
                {emergencyMessage}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <UButton onClick={() => void copyMessage()} variant="soft">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy message'}
                </UButton>
                <UButton onClick={() => void shareMessage()} variant="soft">
                  <ExternalLink size={16} />
                  {navigator.share ? 'Share' : 'Copy to share'}
                </UButton>
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-primary">
                    <MapPin size={16} />
                    Open Maps
                  </a>
                )}
                <a href="tel:112" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-primary">
                  <Phone size={16} />
                  Call emergency services
                </a>
              </div>
              <div>
                <UEyebrow>trusted contacts</UEyebrow>
                <div className="mt-3 space-y-2">
                  {(contacts.data ?? []).map((contact) => (
                    <a key={contact.id} href={`tel:${contact.phone}`} className="flex items-center gap-3 rounded-2xl bg-muted/55 p-3">
                      <span className="grid size-9 place-items-center rounded-full bg-primary text-sm text-primary-foreground">{contact.name.slice(0, 1)}</span>
                      <span className="flex-1 text-sm font-semibold">{contact.name}</span>
                      <Phone size={15} className="text-primary" />
                    </a>
                  ))}
                </div>
              </div>
              <button className="text-sm font-semibold text-muted-foreground underline underline-offset-4" onClick={() => { clearTimer(); setPhase('ready'); }}>
                Reset SOS screen
              </button>
            </div>
          )}
        </div>
      </UCard>
      <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">No SMS sent · No contact notified · No background tracking.</p>
    </div>
  );
}

const quickPrompts = [
  'I feel unsafe',
  'I’m walking alone',
  'I’m anxious',
  'Someone is following me',
  'I need someone to talk to',
  'Help me make a safety plan',
];

export function EnhancedSupport() {
  const resources = useListSupportResources();
  const send = useSendCompanionMessage();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<Array<{ id: string; role: 'user' | 'companion'; content: string; safetyLevel?: string }>>([
    {
      id: 'welcome',
      role: 'companion',
      content: 'I can help you slow down, think through a next step, or open a safety tool. I am not a therapist, crisis service, or substitute for local emergency support.',
    },
  ]);
  const isSafety = (content: string) => /unsafe|following|emergency|walking alone|hurt myself/i.test(content);
  const responseFor = (content: string) =>
    /following|unsafe|emergency/i.test(content)
      ? 'Your immediate safety comes first. Move toward other people or a well-lit place if you can. You can open SOS, start Journey Guardian, or call someone you trust now.'
      : /anxious|overwhelmed/i.test(content)
        ? 'Let’s make the next minute smaller. Notice what you can see, where your feet are, and one person or place that could make this feel easier.'
        : 'I’m here with you. We can talk through what happened or choose one practical next step together.';

  const submit = (content = message) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setMessage('');
    const userMessage = { id: `${Date.now()}-u`, role: 'user' as const, content: trimmed };
    const companionMessage = { id: `${Date.now()}-p`, role: 'companion' as const, content: responseFor(trimmed), safetyLevel: isSafety(trimmed) ? 'prioritize_help' : 'normal' };
    setChat((current) => [...current, userMessage, companionMessage]);
    send.mutate({ data: { content: trimmed } });
  };

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="support without pressure"
        title="You do not have to hold it alone."
        detail="A private reflection space with direct paths to the safety tools you may need. Haven Companion is not professional care or emergency response."
        action={<Link href="/emergency" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-destructive px-4 text-sm font-semibold text-destructive-foreground"><Zap size={16} />I need urgent help</Link>}
      />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {quickPrompts.map((prompt) => (
          <button key={prompt} onClick={() => submit(prompt)} className="whitespace-nowrap rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-primary hover:bg-muted" data-testid={`button-prompt-${prompt.toLowerCase().replaceAll(' ', '-')}`}>
            {prompt}
          </button>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <UCard className="flex min-h-[560px] flex-col overflow-hidden">
          <div className="border-b border-border bg-[#cfddd6] p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#e5eee9] text-primary"><Sparkles size={20} /></span>
              <div><UEyebrow>haven companion</UEyebrow><h2 className="mt-1 font-display text-2xl text-primary">A calm second voice.</h2></div>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-auto p-5">
            {chat.map((item) => (
              <div key={item.id} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === 'user' ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-muted text-foreground'}`}>{item.content}</div>
              </div>
            ))}
            {chat.at(-1)?.safetyLevel === 'prioritize_help' && (
              <div className="rounded-2xl border border-destructive/25 bg-destructive/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-destructive">Safety options</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <UButton variant="danger" onClick={() => setLocation('/emergency')}><Zap size={15} />Start SOS</UButton>
                  <UButton variant="soft" onClick={() => setLocation('/journey-guardian')}><Navigation size={15} />Journey Guardian</UButton>
                  <UButton variant="soft" onClick={() => setLocation('/safety')}><UsersRound size={15} />Trusted Circle</UButton>
                  <UButton variant="soft" onClick={() => setLocation('/support')}><HeartHandshake size={15} />Resources</UButton>
                </div>
              </div>
            )}
          </div>
          <form className="flex gap-2 border-t border-border p-4" onSubmit={(event) => { event.preventDefault(); submit(); }}>
            <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write what is here…" className="h-11 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-primary" data-testid="input-companion-message" />
            <UButton className="size-11 shrink-0 p-0" disabled={send.isPending}><ArrowRight size={17} /></UButton>
          </form>
        </UCard>
        <UCard className="p-6">
          <div className="flex items-center justify-between"><div><UEyebrow>resource directory</UEyebrow><h2 className="mt-2 font-display text-3xl">Practical next steps.</h2></div><HeartHandshake className="text-accent" /></div>
          <div className="mt-5 space-y-3">
            {(resources.data ?? []).map((resource) => (
              <div key={resource.id} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{resource.name}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{resource.description}</p></div><span className="rounded-full bg-secondary/60 px-2 py-1 font-mono-ui text-[9px] uppercase tracking-wider text-primary">{resource.isDemo ? 'Demo' : resource.category}</span></div>
                <div className="mt-3 flex gap-3 text-xs font-semibold text-primary">{resource.phone && <a href={`tel:${resource.phone}`}><Phone size={13} className="mr-1 inline" />Call</a>}{resource.website && <a href={resource.website} target="_blank" rel="noreferrer"><ExternalLink size={13} className="mr-1 inline" />Website</a>}</div>
              </div>
            ))}
          </div>
        </UCard>
      </div>
    </div>
  );
}

export function WellnessInsights() {
  const { wellness, addWellnessCheckin } = useHavenDemo();
  const [, setLocation] = useLocation();
  const [mood, setMood] = useState<WellnessMood | null>(null);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [note, setNote] = useState('');
  const moods: Array<[WellnessMood, string]> = [
    ['great', 'Great'], ['good', 'Good'], ['okay', 'Okay'], ['anxious', 'Anxious'], ['low', 'Low'], ['unsafe', 'Unsafe'],
  ];
  const submit = () => {
    if (!mood) return;
    addWellnessCheckin({ mood, energy, stress, note });
    setNote('');
  };
  const unsafe = mood === 'unsafe';
  const averageStress = wellness.length
    ? (wellness.reduce((total, item) => total + item.stress, 0) / wellness.length).toFixed(1)
    : '—';
  return (
    <div className="animate-rise">
      <PageIntro eyebrow="wellness check-in" title="How are you feeling right now?" detail="A quick check-in can help you notice what you need. Haven does not diagnose or label mental-health conditions." />
      <div className="grid gap-5 lg:grid-cols-[1fr_.85fr]">
        <UCard className="p-6 md:p-8">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {moods.map(([value, label]) => (
              <button key={value} onClick={() => setMood(value)} className={`rounded-2xl border p-4 text-left text-sm font-semibold transition ${mood === value ? 'border-primary bg-secondary' : 'border-border bg-background hover:bg-muted'}`} data-testid={`button-wellness-${value}`}>
                <span className="block text-lg">{label}</span>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">{value === 'unsafe' ? 'safety first' : 'how it feels'}</span>
              </button>
            ))}
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">Energy <input type="range" min="1" max="5" value={energy} onChange={(event) => setEnergy(Number(event.target.value))} className="mt-4 w-full accent-primary" /><span className="mt-1 block text-xs font-normal text-muted-foreground">{energy} / 5</span></label>
            <label className="text-sm font-semibold">Stress <input type="range" min="1" max="5" value={stress} onChange={(event) => setStress(Number(event.target.value))} className="mt-4 w-full accent-primary" /><span className="mt-1 block text-xs font-normal text-muted-foreground">{stress} / 5</span></label>
          </div>
          <UTextarea label="A short note (optional)" value={note} onChange={(event) => setNote(event.target.value)} placeholder="What would help you feel more supported?" />
          <UButton className="mt-5 w-full sm:w-auto" disabled={!mood} onClick={submit} data-testid="button-save-wellness"><Check size={16} />Save check-in</UButton>
          {unsafe && (
            <div className="mt-5 rounded-2xl border border-destructive/25 bg-destructive/10 p-4">
              <p className="text-sm font-semibold text-destructive">You do not have to handle this alone.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <UButton variant="danger" onClick={() => setLocation('/emergency')}><Zap size={15} />SOS</UButton>
                <UButton variant="soft" onClick={() => setLocation('/safety')}><UsersRound size={15} />Trusted Circle</UButton>
                <UButton variant="soft" onClick={() => setLocation('/support')}><MessageCircle size={15} />Companion</UButton>
              </div>
            </div>
          )}
        </UCard>
        <UCard className="p-6">
          <UEyebrow>your recent rhythm</UEyebrow>
          <h2 className="mt-2 font-display text-3xl">Small signals.</h2>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-secondary/55 p-3"><span className="font-display text-3xl text-primary">{wellness.length}</span><span className="mt-1 block text-xs text-muted-foreground">check-ins</span></div>
            <div className="rounded-2xl bg-muted/70 p-3"><span className="font-display text-3xl text-primary">{averageStress}</span><span className="mt-1 block text-xs text-muted-foreground">avg stress</span></div>
            <div className="rounded-2xl bg-[#e9cfc0] p-3"><span className="font-display text-3xl text-primary">{wellness[0]?.mood ?? '—'}</span><span className="mt-1 block text-xs text-muted-foreground">recent mood</span></div>
          </div>
          <div className="mt-6 space-y-2">
            {wellness.slice(0, 5).map((item) => <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-muted/45 p-3"><span className="size-2 rounded-full bg-accent" /><span className="flex-1 text-sm font-semibold capitalize">{item.mood}</span><span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span></div>)}
            {!wellness.length && <p className="rounded-2xl bg-muted/45 p-4 text-sm leading-6 text-muted-foreground">Your check-in history will appear here after your first note.</p>}
          </div>
        </UCard>
      </div>
    </div>
  );
}

export function SafetyPlanPage() {
  const { safetyPlan, saveSafetyPlan } = useHavenDemo();
  const [form, setForm] = useState<SafetyPlan>(safetyPlan);
  const [saved, setSaved] = useState(false);
  const update = (key: keyof SafetyPlan, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const copy = async () => {
    await navigator.clipboard?.writeText(Object.entries(form).map(([key, value]) => `${key}: ${value}`).join('\n'));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };
  return (
    <div className="mx-auto max-w-4xl animate-rise">
      <BackLink />
      <PageIntro eyebrow="personal safety plan" title="My Safety Plan." detail="A practical page to keep close during a stressful moment. This is private browser storage in the demo and is not encrypted." action={<UButton variant="soft" onClick={() => window.print()}><Printer size={15} />Print</UButton>} />
      <UCard className="p-6 md:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <UTextarea label="Who are your trusted people?" value={form.trustedPeople} onChange={(event) => update('trustedPeople', event.target.value)} />
          <UTextarea label="Places you consider safe" value={form.safePlaces} onChange={(event) => update('safePlaces', event.target.value)} />
          <UField label="Emergency code word" value={form.codeWord} onChange={(event) => update('codeWord', event.target.value)} />
          <UField label="Who should be contacted first?" value={form.firstContact} onChange={(event) => update('firstContact', event.target.value)} />
          <UTextarea label="What should you do if you feel followed?" value={form.ifFollowed} onChange={(event) => update('ifFollowed', event.target.value)} />
          <UTextarea label="Important emergency numbers" value={form.emergencyNumbers} onChange={(event) => update('emergencyNumbers', event.target.value)} placeholder="Only add numbers you have verified locally." />
        </div>
        <div className="mt-5"><UTextarea label="Anything to remember during a stressful situation" value={form.notes} onChange={(event) => update('notes', event.target.value)} /></div>
        <div className="mt-6 flex flex-wrap gap-2">
          <UButton onClick={() => { saveSafetyPlan(form); setSaved(true); window.setTimeout(() => setSaved(false), 1600); }}><Check size={16} />{saved ? 'Saved locally' : 'Save plan'}</UButton>
          <UButton variant="soft" onClick={() => void copy()}><Copy size={15} />Copy plan</UButton>
          <Link href="/emergency" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-primary"><Zap size={15} />Keep SOS close</Link>
        </div>
      </UCard>
    </div>
  );
}

const emptyIncident: Incident = { id: '', title: '', date: new Date().toISOString().slice(0, 10), time: '', location: '', description: '', category: 'Safety concern', notes: '', attachmentName: '' };

export function IncidentVaultPage() {
  const { incidents, saveIncident, deleteIncident } = useHavenDemo();
  const [form, setForm] = useState<Incident>(emptyIncident);
  const [open, setOpen] = useState(false);
  const edit = (incident: Incident) => { setForm(incident); setOpen(true); };
  const update = (key: keyof Incident, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => { saveIncident({ ...form, id: form.id || crypto.randomUUID() }); setForm(emptyIncident); setOpen(false); };
  return (
    <div className="mx-auto max-w-4xl animate-rise">
      <PageIntro eyebrow="private incident vault" title="Keep a clear record." detail="A personal record is not a police report or legal filing. This demo stores incident details in this browser and does not claim encryption." action={<UButton onClick={() => { setForm(emptyIncident); setOpen(true); }}><Plus size={16} />Add incident</UButton>} />
      <UCard className="mb-5 border-secondary/60 bg-secondary/25 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-primary"><FileText size={16} />Private record, not an automatic report.</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Only add information you are comfortable keeping in this browser. You can print a clean report for your own records.</p></UCard>
      <div className="space-y-4">
        {incidents.length ? incidents.map((incident) => (
          <UCard key={incident.id} className="p-5">
            <div className="flex items-start gap-4">
              <span className="mt-1 size-3 rounded-full bg-accent" />
              <div className="flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><UEyebrow>{incident.category} · {incident.date}</UEyebrow><h2 className="mt-2 font-display text-3xl text-primary">{incident.title}</h2></div><div className="flex gap-1"><button className="rounded-full p-2 hover:bg-muted" onClick={() => edit(incident)} aria-label={`Edit ${incident.title}`}><Pencil size={15} /></button><button className="rounded-full p-2 text-destructive hover:bg-destructive/10" onClick={() => { if (window.confirm('Delete this incident record?')) deleteIncident(incident.id); }} aria-label={`Delete ${incident.title}`}><Trash2 size={15} /></button></div></div><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{incident.description}</p>{incident.location && <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={13} />{incident.location}</p>}<button onClick={() => window.print()} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary"><Printer size={13} />Print report</button></div>
            </div>
          </UCard>
        )) : <UCard className="p-10 text-center"><FileText className="mx-auto text-accent" size={26} /><h2 className="mt-4 font-display text-3xl">Nothing recorded yet.</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">If you decide to keep a record, you can add one without creating a police report.</p><UButton className="mt-5" onClick={() => setOpen(true)}><Plus size={16} />Add an incident</UButton></UCard>}
      </div>
      {open && <div className="fixed inset-0 z-50 grid place-items-center bg-primary/25 p-4 backdrop-blur-sm"><div className="max-h-[90dvh] w-full max-w-2xl overflow-auto rounded-[26px] border border-border bg-card p-6 shadow-lg"><div className="flex items-center justify-between"><h2 className="font-display text-3xl text-primary">{form.id ? 'Edit incident' : 'New incident record'}</h2><button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-muted"><X size={18} /></button></div><div className="mt-6 grid gap-4 md:grid-cols-2"><UField label="Title" value={form.title} onChange={(event) => update('title', event.target.value)} required /><UField label="Category" value={form.category} onChange={(event) => update('category', event.target.value)} /><UField label="Date" type="date" value={form.date} onChange={(event) => update('date', event.target.value)} /><UField label="Time" type="time" value={form.time} onChange={(event) => update('time', event.target.value)} /><UField label="Location (optional)" value={form.location} onChange={(event) => update('location', event.target.value)} /><label className="block text-sm font-semibold">Attachment (optional)<input type="file" accept="image/*,.pdf,.txt" className="mt-2 block w-full text-xs" onChange={(event) => update('attachmentName', event.target.files?.[0]?.name ?? '')} /></label></div><div className="mt-4 space-y-4"><UTextarea label="Description" value={form.description} onChange={(event) => update('description', event.target.value)} required /><UTextarea label="Notes (optional)" value={form.notes} onChange={(event) => update('notes', event.target.value)} /></div><div className="mt-6 flex justify-end gap-2"><UButton variant="quiet" onClick={() => setOpen(false)}>Cancel</UButton><UButton disabled={!form.title.trim() || !form.description.trim()} onClick={save}><Check size={16} />Save record</UButton></div></div></div>}
    </div>
  );
}

export function QuickExitButton() {
  const { exitToStudyDashboard } = useHavenDemo();
  return (
    <button
      onClick={exitToStudyDashboard}
      className="rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
      title="Quick exit"
      data-testid="button-quick-exit"
    >
      <span className="hidden sm:inline">Quick </span>Exit
    </button>
  );
}

export function DemoControls() {
  const { demoMode, journey, demoMissedCheckIn, escalateJourney, exitToStudyDashboard } = useHavenDemo();
  const [open, setOpen] = useState(false);
  if (!demoMode) return null;
  return (
    <div className="fixed bottom-20 right-4 z-30 md:bottom-6">
      {open && (
        <div className="mb-2 w-64 rounded-2xl border border-accent/40 bg-card p-4 shadow-lg">
          <UEyebrow>demo controls</UEyebrow>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Simulated actions are clearly marked and stay local to this browser.</p>
          <div className="mt-3 space-y-2">
            <button disabled={!journey || journey.status !== 'active'} onClick={demoMissedCheckIn} className="w-full rounded-xl bg-muted p-2 text-left text-xs font-semibold disabled:opacity-40">Simulate missed check-in</button>
            <button disabled={!journey || journey.status !== 'missed'} onClick={escalateJourney} className="w-full rounded-xl bg-muted p-2 text-left text-xs font-semibold disabled:opacity-40">Trigger escalation</button>
            <button onClick={exitToStudyDashboard} className="w-full rounded-xl bg-secondary p-2 text-left text-xs font-semibold">Show Quick Exit screen</button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen((value) => !value)} className="rounded-full border border-accent/40 bg-secondary px-3 py-2 text-xs font-bold text-primary shadow-sm" data-testid="button-demo-controls">
        {open ? 'Close demo' : 'Demo mode'}
      </button>
    </div>
  );
}

export function StudyDashboard() {
  const { returnToHaven } = useHavenDemo();
  const [clicks, setClicks] = useState(0);
  const reset = () => window.setTimeout(() => setClicks(0), 900);
  return (
    <div className="min-h-[100dvh] bg-[#eef2f3] p-5 text-[#263840] md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between border-b border-[#cbd7da] pb-5">
          <button
            className="text-left"
            onClick={() => { const next = clicks + 1; setClicks(next); if (next >= 3) returnToHaven(); reset(); }}
            aria-label="Study Dashboard"
          >
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#6f8187]">Campus workspace</p>
            <h1 className="mt-1 text-2xl font-bold">Study Dashboard</h1>
          </button>
          <div className="rounded-full bg-white px-3 py-2 text-xs font-semibold shadow-sm">Wednesday · Sep 16</div>
        </div>
        <div className="grid gap-5 py-8 lg:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8"><p className="text-xs font-bold uppercase tracking-wider text-[#6f8187]">today’s classes</p><div className="mt-5 space-y-3">{[['09:00', 'Human Computer Interaction', 'Room 204'], ['11:30', 'PBL Studio', 'Innovation Lab'], ['15:00', 'Research Methods', 'Online']].map(([time, title, room]) => <div key={time} className="flex items-center gap-4 rounded-2xl bg-[#f4f7f7] p-4"><span className="w-12 text-sm font-bold text-[#6f8187]">{time}</span><div><p className="font-semibold">{title}</p><p className="mt-1 text-xs text-[#6f8187]">{room}</p></div></div>)}</div></section>
          <section className="rounded-3xl bg-[#dce8eb] p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-[#6f8187]">study timer</p><p className="mt-8 text-6xl font-bold tracking-tight">24:18</p><p className="mt-2 text-sm text-[#587078]">Focus session in progress</p><button className="mt-8 rounded-full bg-[#263840] px-4 py-2.5 text-sm font-semibold text-white" onClick={() => window.alert('Study timer paused for this demo.')}>Pause timer</button></section>
        </div>
        <div className="grid gap-5 md:grid-cols-3"><section className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-[#6f8187]">assignments</p><h2 className="mt-4 text-2xl font-bold">PBL demo deck</h2><p className="mt-2 text-sm text-[#6f8187]">Due tomorrow · 4 slides left</p></section><section className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-[#6f8187]">notes</p><h2 className="mt-4 text-2xl font-bold">Research ideas</h2><p className="mt-2 text-sm text-[#6f8187]">Remember to ask about the field study.</p></section><section className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-[#6f8187]">upcoming</p><h2 className="mt-4 text-2xl font-bold">Project review</h2><p className="mt-2 text-sm text-[#6f8187]">Friday · 10:30 AM</p></section></div>
        <p className="mt-10 text-center text-xs text-[#6f8187]">Study Dashboard · Double-press Escape to return to your previous screen</p>
      </div>
    </div>
  );
}