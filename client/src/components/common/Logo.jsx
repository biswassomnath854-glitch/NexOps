import React from 'react'
import { SBLogo, SBMonogram, SBLightLogo, SBDarkLogo } from './SBLogo'

/**
 * Re-export SBLogo as Logo for seamless backward compatibility.
 * All user-facing rendering now uses the SB Pvt. Ltd. brand and Concept 2 Monogram.
 */
export function Logo(props) {
  return <SBLogo {...props} />
}

export { SBLogo, SBMonogram, SBLightLogo, SBDarkLogo }
export default Logo
