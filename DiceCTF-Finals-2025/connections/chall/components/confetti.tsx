"use client"

import { useEffect, useState } from "react"
import ReactConfetti from "react-confetti"

export default function Confetti() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <ReactConfetti
      width={windowSize.width}
      height={windowSize.height}
      recycle={false}
      numberOfPieces={200}
      gravity={0.2}
      colors={["#f472b6", "#a78bfa", "#60a5fa", "#4ade80", "#facc15"]}
    />
  )
}
