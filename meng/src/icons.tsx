import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const baseProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const createIcon =
  (paths: JSX.Element[], size = 24) =>
  (props: IconProps) => {
    const { size: customSize, ...rest } = props
    const finalSize = customSize ?? size
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={finalSize}
        height={finalSize}
        viewBox="0 0 24 24"
        {...baseProps}
        {...rest}
      >
        {paths}
      </svg>
    )
  }

export const IconMenu = createIcon([
  <path key="1" d="M4 7h16" />,
  <path key="2" d="M4 12h16" />,
  <path key="3" d="M4 17h16" />,
])

export const IconX = createIcon([<path key="1" d="m6 6 12 12" />, <path key="2" d="m6 18 12-12" />])

export const IconPhone = createIcon([
  <path
    key="1"
    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.1 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.6 12.6 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.6 12.6 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"
  />,
])

export const IconMapPin = createIcon([
  <path key="1" d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z" />,
  <circle key="2" cx="12" cy="11" r="2.5" />,
])

export const IconClock = createIcon([
  <circle key="1" cx="12" cy="12" r="9" />,
  <path key="2" d="M12 7v5l3 2" />,
])

export const IconMountain = createIcon([<path key="1" d="m8 3 4 8 5-5 5 13H0L8 3Z" />])

export const IconWaves = createIcon([
  <path key="1" d="M2 12c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0" />,
  <path key="2" d="M2 18c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0" />,
  <path key="3" d="M2 6c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0" />,
])
