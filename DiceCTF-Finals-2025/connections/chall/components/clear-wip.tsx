"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function ClearWip({ shouldClear }: { shouldClear: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (shouldClear) {
      localStorage.removeItem('connections-wip')
      
      // Clean up URL by removing the clearWip and saved parameters
      const id = searchParams.get('id')
      if (id) {
        router.replace(`/play?id=${id}`)
      }
    }
  }, [shouldClear, router, searchParams])

  return null
}