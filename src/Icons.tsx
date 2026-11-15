import type { ReactNode } from 'react'

function Svg({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const IconHome = () => (
  <Svg>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9.5h13V10" />
    <path d="M10 19.5v-5h4v5" />
  </Svg>
)

export const IconDumbbell = () => (
  <Svg>
    <path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11" />
  </Svg>
)

export const IconRun = () => (
  <Svg>
    <circle cx="14.5" cy="4.5" r="1.8" />
    <path d="m7 10.5 3.5-2.5 3 1.5 1.5 3 3 1" />
    <path d="m10.5 8-1 5 3.5 2.5V21" />
    <path d="M9.2 14.5 7.5 17H4" />
  </Svg>
)

export const IconFood = () => (
  <Svg>
    <path d="M6 3v7a2 2 0 0 0 2 2v9M4 3v5M8 3v5" />
    <path d="M17 21v-7h-2.5V7.5C14.500 5 15.800 3.300 17 3v18" />
  </Svg>
)

export const IconChart = () => (
  <Svg>
    <path d="M3.5 20.5h17" />
    <path d="m4.500 15 4.500-4.500 3.500 3 6.500-7.500" />
    <path d="M15.500 6h3.500v3.500" />
  </Svg>
)

export const IconDrop = ({ size = 18 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M12 3.500c3 3.700 5.500 6.700 5.500 10a5.500 5.500 0 0 1-11 0c0-3.300 2.500-6.300 5.500-10Z" />
  </Svg>
)

export const IconTimer = ({ size = 18 }: { size?: number }) => (
  <Svg size={size}>
    <circle cx="12" cy="13.500" r="7" />
    <path d="M12 9.500v4l2.500 1.500M9.500 3h5" />
  </Svg>
)

export const IconCheck = ({ size = 14 }: { size?: number }) => (
  <Svg size={size}>
    <path d="m5 12.500 4.500 4.500L19 7.500" />
  </Svg>
)
