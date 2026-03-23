'use client'

import { useEffect, useRef } from 'react'
import { recordProfileView } from '@/actions/profile-views'

export function ProfileViewTracker({ profileId }: { profileId: string }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    recordProfileView(profileId)
  }, [profileId])

  return null
}
