/**
 * Minimal outline icon set (hand-written, no icon-library dependency) used
 * for the service/feature rows across the public site — matches the thin
 * gold line-icon style in the approved screens (HOME.png "Our Services",
 * VISA.png feature row, etc.).
 */
type IconProps = { className?: string };

const base = "size-6";

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? base}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function PlaneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 12.5 21 4l-8.5 18.5-2-8-8-2Z" />
    </Svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </Svg>
  );
}

export function BedIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 18v2M21 18v2M3 13h18M7 9V6a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3" />
    </Svg>
  );
}

export function CarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 16V11l2-5h14l2 5v5M3 16h18M3 16v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2M18 16v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2M7 11h10" />
    </Svg>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </Svg>
  );
}

export function LocationIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21s7-6.1 7-11.5S16.4 3 12 3 5 5.1 5 9.5 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </Svg>
  );
}

export function HeadsetIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1M4 13v4a2 2 0 0 0 2 2h1v-6H5a1 1 0 0 0-1 1Zm16 0v4a2 2 0 0 1-2 2h-1v-6h2a1 1 0 0 1 1 1Zm-3 6h-2a2 2 0 0 1-2-2" />
    </Svg>
  );
}

export function FamilyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="7" r="2.3" />
      <circle cx="16" cy="7" r="2.3" />
      <path d="M2.5 19v-1a4.5 4.5 0 0 1 5-4.5M21.5 19v-1a4.5 4.5 0 0 0-5-4.5" />
      <circle cx="12" cy="12.5" r="2.3" />
      <path d="M7 19v-1a5 5 0 0 1 10 0v1" />
    </Svg>
  );
}

export function HeartHandIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12.5 8.5c0-1.4-1.2-2.5-2.6-2.5-1 0-1.9.6-2.4 1.5-.5-.9-1.4-1.5-2.4-1.5C3.7 6 2.5 7.1 2.5 8.5c0 2.6 3 4.6 5 6.2 2-1.6 5-3.6 5-6.2Z" />
      <path d="M13 16.5h3.3c.7 0 1.4.3 1.9.8l2.3 2.2M13 16.5H10a1.5 1.5 0 0 0 0 3h4.5c.6 0 1.2-.2 1.6-.6l3.4-3" />
    </Svg>
  );
}

export function SuitcaseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <path d="M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18" />
    </Svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 5 5.5v5.7C5 16 8 19.5 12 21c4-1.5 7-5 7-9.8V5.5L12 3Z" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </Svg>
  );
}

export function PassportIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="6" y="3" width="12" height="18" rx="1.5" />
      <circle cx="12" cy="10" r="2.3" />
      <path d="M9 15.5h6" />
    </Svg>
  );
}

export function PhotoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="m3 17 5-5 4 4 3-3 6 6" />
    </Svg>
  );
}

export function TrainIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="3" width="14" height="13" rx="3" />
      <path d="M5 12h14M8 19l-2 2M16 19l2 2M8.5 16 7 19M15.5 16 17 19" />
      <circle cx="9" cy="9" r="1" />
      <circle cx="15" cy="9" r="1" />
    </Svg>
  );
}

export function PaymentIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 9.5h18M6.5 14.5h4" />
    </Svg>
  );
}

export function SizeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 4h6M4 4v6M4 4l6 6M20 20h-6M20 20v-6M20 20l-6-6" />
    </Svg>
  );
}

export function BathroomIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Z" />
      <path d="M6 12V6a2 2 0 0 1 3-1.7M4 19v1.5M18 19v1.5" />
    </Svg>
  );
}

export function DiningIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 2.5v8a2 2 0 0 1-2 2v9M7 2.5v19M5 2.5v6M9 2.5v6M17 2.5c-1.7 0-3 2-3 5s1.3 5 3 5v9M17 2.5v19" />
    </Svg>
  );
}

export function MapPinFilledIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21s7-6.1 7-11.5S16.4 3 12 3 5 5.1 5 9.5 12 21 12 21Z" fill="currentColor" />
    </Svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

export function MountainFlagIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m3 20 6.5-12L14 15l2-3 5 8H3Z" />
      <path d="M13 4v6M13 4l5 2-5 2" />
    </Svg>
  );
}

export function DomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 20h14M6 20v-6a6 6 0 0 1 12 0v6M12 3v3M10.5 4.5h3" />
    </Svg>
  );
}

export function HandshakeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m2 12 4-4 4 2 2-2 4 4-2 2-3-3-3 3-2-2Z" />
      <path d="m8 14 3 3a1.5 1.5 0 0 0 2-2l-3.5-3.5M14 10l4-4 4 4-4 4" />
    </Svg>
  );
}

export function KaabaIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8 12 4l8 4v9l-8 4-8-4Z" />
      <path d="M4 8h16M8 6.2v11.6" fill="currentColor" fillOpacity="0.15" />
    </Svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 5a2 2 0 0 1 2-2Z" />
    </Svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 6.5 8 6 8-6" />
    </Svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" strokeLinecap="round" />
    </Svg>
  );
}

export function WarningTriangleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 10v4M12 17h.01" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 13 4 4L19 7" />
    </Svg>
  );
}

/** Maps visa_documents.icon_key / visa_types.features[].icon_key to a component — unrecognized/unset keys fall back to DocumentIcon. */
export const VISA_ICON_MAP: Record<string, (props: IconProps) => React.ReactElement> = {
  passport: PassportIcon,
  photo: PhotoIcon,
  document: DocumentIcon,
  flight: PlaneIcon,
  hotel: BedIcon,
  shield: ShieldIcon,
  payment: PaymentIcon,
  group: FamilyIcon,
  // Feature-strip-only additions (visa_types.features) — the fixed
  // icon_key set above is specifically for document cards (visa_documents).
  clock: ClockIcon,
  headset: HeadsetIcon,
  heart: HeartHandIcon,
  // About page additions (about_content.core_values / .differentiators).
  dome: DomeIcon,
  "giving-hand": HeartHandIcon,
  family: FamilyIcon,
  kaaba: KaabaIcon,
  handshake: HandshakeIcon,
  eye: EyeIcon,
  "mountain-flag": MountainFlagIcon,
  compass: CompassIcon,
};

export function VisaIcon({ iconKey, className }: { iconKey: string | null | undefined; className?: string }) {
  const Icon = (iconKey && VISA_ICON_MAP[iconKey]) || DocumentIcon;
  return <Icon className={className} />;
}

/** Same lookup as VisaIcon, under a neutral name — used outside the Visa section (e.g. About page's core_values/differentiators icon_key fields). */
export const IconByKey = VisaIcon;
