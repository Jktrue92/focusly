export function DaylaneMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 25V7h7c7.5 0 12 3.6 12 9s-4.5 9-12 9H7Z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 13h1.5c3.8 0 5.5 1.2 5.5 3s-1.7 3-5.5 3H13"
        stroke="currentColor"
        strokeOpacity=".65"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
