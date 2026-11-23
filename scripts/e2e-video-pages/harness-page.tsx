'use client'
// TEMPORARY e2e harness (not committed): renders the studio without the signed-in shell.
import dynamic from 'next/dynamic'
const VideoPagesStudio = dynamic(() => import('@/src/apps/video-pages/VideoPagesStudio'), { ssr: false })
export default function Harness() {
  return <div style={{ height: '100vh', background: '#050505' }}><VideoPagesStudio /></div>
}
