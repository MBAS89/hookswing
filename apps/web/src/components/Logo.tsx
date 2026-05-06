interface LogoProps {
  className?: string;
}

export default function Logo({ className = "w-8 h-8" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield / Vault background */}
      <path
        d="M50 5 L88 20 L88 55 C88 76 50 95 50 95 C50 95 12 76 12 55 L12 20 Z"
        fill="#10b981"
        stroke="#059669"
        strokeWidth="3"
      />
      {/* Inner shield detail */}
      <path
        d="M50 14 L78 26 L78 53 C78 69 50 84 50 84 C50 84 22 69 22 53 L22 26 Z"
        fill="#059669"
        opacity="0.3"
      />
      {/* Webhook hook symbol */}
      <path
        d="M38 38 C38 30 44 24 52 24 C60 24 66 30 66 38"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="52" cy="38" r="5" fill="white" />
      {/* Stem down */}
      <path
        d="M52 43 L52 55"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Arrow pointing right - representing forward/replay */}
      <path
        d="M52 55 L64 55 L60 50 M64 55 L60 60"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Three dots representing incoming webhooks */}
      <circle cx="35" cy="62" r="3" fill="white" opacity="0.9" />
      <circle cx="45" cy="62" r="3" fill="white" opacity="0.7" />
      <circle cx="55" cy="62" r="3" fill="white" opacity="0.5" />
    </svg>
  );
}
