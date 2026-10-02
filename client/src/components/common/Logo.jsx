import React from 'react'
import { SBLogo, SBMonogram, SBLightLogo, SBDarkLogo } from './SBLogo'

/**
 * Re-export SBLogo as Logo for seamless backward compatibility.
 * All user-facing rendering now uses the official provided SB Pvt. Ltd. logo image.
 */
export function Logo(props) {
  return <SBLogo {...props} />
}

export { SBLogo, SBMonogram, SBLightLogo, SBDarkLogo }
export default Logo
