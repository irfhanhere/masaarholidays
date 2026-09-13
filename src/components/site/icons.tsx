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

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 13 4 4L19 7" />
    </Svg>
  );
}
