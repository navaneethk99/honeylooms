'use client'

import { SVG3D } from '@/lib/SVG3D'
import { useEffect, useState } from 'react'

import styles from './index.module.css'

const honeycombSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M226.941 141.855L242.668 114.617H274.12L289.846 141.855L274.12 169.094H242.668L226.941 141.855Z" fill="#D9A322"/>
<path d="M332.853 327.36L348.579 300.121H380.031L395.757 327.36L380.031 354.598H348.579L332.853 327.36Z" fill="#D9A322"/>
<path d="M279.575 355.602L295.301 328.364H326.753L342.48 355.602L326.753 382.841H295.301L279.575 355.602Z" fill="#D9A322"/>
<path d="M226.941 388.338L242.668 361.1H274.12L289.846 388.338L274.12 415.577H242.668L226.941 388.338Z" fill="#D9A322"/>
<path d="M174.308 356.886L190.034 329.648H221.486L237.212 356.886L221.486 384.125H190.034L174.308 356.886Z" fill="#D9A322"/>
<path d="M226.941 327.36L242.668 300.121H274.12L289.846 327.36L274.12 354.598H242.668L226.941 327.36Z" fill="#D9A322"/>
<path d="M279.575 295.907L295.301 268.668H326.753L342.48 295.907L326.753 323.145H295.301L279.575 295.907Z" fill="#D9A322"/>
<path d="M332.853 264.455L348.579 237.217H380.031L395.757 264.455L380.031 291.693H348.579L332.853 264.455Z" fill="#D9A322"/>
<path d="M330.925 203.477L346.651 176.238H378.103L393.829 203.477L378.103 230.715H346.651L330.925 203.477Z" fill="#D9A322"/>
<path d="M279.575 234.928L295.301 207.69H326.753L342.48 234.928L326.753 262.167H295.301L279.575 234.928Z" fill="#D9A322"/>
<path d="M226.941 264.455L242.668 237.217H274.12L289.846 264.455L274.12 291.693H242.668L226.941 264.455Z" fill="#D9A322"/>
<path d="M174.308 295.907L190.034 268.668H221.486L237.212 295.907L221.486 323.145H190.034L174.308 295.907Z" fill="#D9A322"/>
<path d="M121.031 325.434L136.757 298.195H168.21L183.936 325.434L168.21 352.672H136.757L121.031 325.434Z" fill="#D9A322"/>
<path d="M279.575 173.308L295.301 146.069H326.753L342.48 173.308L326.753 200.546H295.301L279.575 173.308Z" fill="#D9A322"/>
<path d="M226.941 203.477L242.668 176.238H274.12L289.846 203.477L274.12 230.715H242.668L226.941 203.477Z" fill="#D9A322"/>
<path d="M174.308 234.928L190.034 207.69H221.486L237.212 234.928L221.486 262.167H190.034L174.308 234.928Z" fill="#D9A322"/>
<path d="M121.031 264.455L136.757 237.217H168.21L183.936 264.455L168.21 291.693H136.757L121.031 264.455Z" fill="#D9A322"/>
<path d="M121.031 203.477L136.757 176.238H168.21L183.936 203.477L168.21 230.715H136.757L121.031 203.477Z" fill="#D9A322"/>
<path d="M174.308 173.308L190.034 146.069H221.486L237.212 173.308L221.486 200.546H190.034L174.308 173.308Z" fill="#D9A322"/>
<path d="M154.731 101.096L185.862 140.572H176.876C167.996 129.339 150.045 106.488 149.275 104.947C131.164 92.7516 118.786 75.4208 118.144 73.4952C111.725 62.5832 121.674 60.0157 122.637 60.0157C133.934 59.2454 148.74 87.0817 154.731 101.096Z" fill="#D9A322"/>
<path d="M131.585 69.8238C126.45 63.6617 123.454 64.4748 122.598 65.6515C114.575 68.6255 139.929 92.2896 141.213 93.2525C147.953 97.7456 146.027 93.5734 146.027 92.6106C143.138 83.6242 132.226 70.7866 131.585 69.8238Z" fill="white"/>
<path d="M393.511 452.205C382.214 436.03 352.645 395.613 339.272 377.426L336.384 383.524C352.217 403.315 385.809 444.76 393.511 452.205Z" fill="#D9A322"/>
</svg>`

type HomepageModelProps = {
  className?: string
}

export function HomepageModel({ className = '' }: HomepageModelProps) {
  const [scrollRotation, setScrollRotation] = useState(0)

  useEffect(() => {
    const updateRotation = () => setScrollRotation(Math.min(window.scrollY * 0.02, 10))

    updateRotation()
    window.addEventListener('scroll', updateRotation, { passive: true })

    return () => window.removeEventListener('scroll', updateRotation)
  }, [])

  return (
    <div
      aria-label="Interactive 3D object. Drag to rotate."
      className={`${styles.viewer} ${className}`}
      role="img"
    >
      <div
        className={styles.scrollRotation}
        style={{ transform: `perspective(600px) rotateX(${scrollRotation}deg)` }}
      >
        <SVG3D
          animate="float"
          color="#d9a322"
          depth={0.5}
          introTo={{ opacity: 1, zoom: 20 }}
          orbitStrength={0.35}
          shadow={false}
          smoothness={0.6}
          svg={honeycombSvg}
          zoom={20}
        />
      </div>
    </div>
  )
}
