export default function ScadMark({ size = 26, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 2.6 28.1 9.3v13.4L16 29.4 3.9 22.7V9.3L16 2.6Z"
        stroke="#e9b14c"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M3.9 9.3 16 16l12.1-6.7" stroke="#e9b14c" strokeWidth="1.2" strokeLinejoin="round" opacity="0.75" />
      <path d="M16 16v13.4" stroke="#e9b14c" strokeWidth="1.2" opacity="0.75" />
      <path d="M9.4 12.9v5.4l6.6 3.6 6.6-3.6v-5.4" stroke="#8d97a5" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}