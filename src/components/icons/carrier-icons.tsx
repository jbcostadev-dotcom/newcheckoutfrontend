import { cn } from "@/lib/utils";

interface CarrierIconProps {
  className?: string;
}

export function CorreiosIcon({ className }: CarrierIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6", className)}
    >
      <rect x="6" y="14" width="36" height="24" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <path d="M6 22H42" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="16" cy="34" r="3" fill="currentColor" />
      <circle cx="32" cy="34" r="3" fill="currentColor" />
      <path d="M13 18L18 10H30L35 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SedexIcon({ className }: CarrierIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6", className)}
    >
      <rect x="5" y="13" width="38" height="26" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <path d="M5 21H43" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="14" cy="34" r="3" fill="currentColor" />
      <circle cx="34" cy="34" r="3" fill="currentColor" />
      <path d="M28 17L32 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function JadlogIcon({ className }: CarrierIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6", className)}
    >
      <path
        d="M8 32C8 24 14 18 24 18C34 18 40 24 40 32"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M24 18V12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="14" cy="36" r="3" fill="currentColor" />
      <circle cx="34" cy="36" r="3" fill="currentColor" />
      <path d="M11 36H37" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

export function LoggiIcon({ className }: CarrierIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6", className)}
    >
      <path
        d="M10 30C10 22 16 16 24 16C32 16 38 22 38 30"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M24 16V10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="32" r="4" fill="currentColor" />
      <path d="M24 28V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function FullIcon({ className }: CarrierIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6", className)}
    >
      <rect x="6" y="14" width="36" height="22" rx="2" stroke="currentColor" strokeWidth="2.5" />
      <path d="M6 22H42" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="14" cy="32" r="3" fill="currentColor" />
      <circle cx="34" cy="32" r="3" fill="currentColor" />
      <path d="M16 14V10H32V14" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}
