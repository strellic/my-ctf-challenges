"use client"

import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"

export default function ShareButton() {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Custom Connections Puzzle',
        text: 'Play this custom connections puzzle!',
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      className="border-2 border-green-200 text-green-600 hover:bg-green-50"
    >
      <Share2 className="h-4 w-4 mr-2" />
      Share This Puzzle
    </Button>
  )
}