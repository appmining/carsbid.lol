import type { SocialPlatform } from "@/lib/types";

export function SocialIcon({
  platform,
  className = "w-4 h-4",
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  switch (platform) {
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
          <path
            d="M14 3v10.6a2.9 2.9 0 1 1-2.4-2.85"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 3c.4 2.4 2.1 4.1 4.5 4.4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
          <path
            d="M5 4.5 19 19.5M19 4.5 5 19.5"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M10.5 9.5v5l4.4-2.5-4.4-2.5Z" fill="currentColor" />
        </svg>
      );
    case "website":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M3.5 12h17M12 3.5c2.2 2.3 3.3 5.2 3.3 8.5s-1.1 6.2-3.3 8.5c-2.2-2.3-3.3-5.2-3.3-8.5S9.8 5.8 12 3.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
          <path
            d="M9.5 14.5 14.5 9.5M8 12.7l-2 2a3 3 0 0 0 4.2 4.2l2-2M16 11.3l2-2A3 3 0 0 0 13.8 5.1l-2 2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}
