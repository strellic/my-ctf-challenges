"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

type ConnectionsGridProps = {
  connections: {
    groups: {
      category: string
      words: string[]
      color: string
    }[]
  }
  words?: string[]
  selectedIndices?: number[]
  onSelectWord?: (index: number) => void
  preview?: boolean
  solvedGroups?: {
    words: string[]
    category: string
    color: string
  }[]
}

export function ConnectionsGrid({
  connections,
  words: propWords,
  selectedIndices = [],
  onSelectWord,
  preview = false,
  solvedGroups = [],
}: ConnectionsGridProps) {
  const [words, setWords] = useState<string[]>([])

  useEffect(() => {
    if (propWords) {
      setWords(propWords)
    } else if (connections.groups.length > 0) {
      // Flatten all words from all groups
      const allWords = connections.groups.flatMap((group) => group.words)
      setWords(allWords)
    }
  }, [connections, propWords])

  // Check if a word is in any solved group
  const getWordStatus = (word: string, index: number) => {
    // If in preview mode, just show placeholder
    if (preview) {
      return { inSolvedGroup: false, color: "" }
    }

    // Check if this word is in any solved group
    for (const group of solvedGroups) {
      if (group.words.includes(word)) {
        return { inSolvedGroup: true, color: group.color }
      }
    }

    // Check if this word is currently selected
    const isSelected = selectedIndices.includes(index)

    return { inSolvedGroup: false, isSelected }
  }

  if (words.length === 0) {
    return (
      <div className="grid aspect-square grid-cols-4 gap-3">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-center rounded-lg border-2 border-dashed border-purple-200 bg-white p-4 text-center text-sm shadow-md"
          >
            {preview ? "?" : ""}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid aspect-square grid-cols-4 gap-3">
      {words.map((word, index) => {
        const { inSolvedGroup, isSelected, color } = getWordStatus(word, index)

        // If this word is in a solved group, show it with the group color
        if (inSolvedGroup) {
          return (
            <div
              key={index}
              className={cn(
                "flex items-center justify-center rounded-lg p-4 text-center font-medium shadow-md transition-all duration-300",
                color || "bg-muted",
              )}
            >
              {word}
            </div>
          )
        }

        return (
          <button
            key={index}
            className={cn(
              "flex items-center justify-center rounded-lg border-2 p-4 text-center font-medium shadow-md transition-all duration-300",
              isSelected
                ? "border-purple-400 bg-purple-100 shadow-purple-100"
                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:shadow-blue-100",
              preview && "cursor-default",
              "transform transition-transform active:scale-95 hover:scale-105",
            )}
            onClick={() => !preview && onSelectWord?.(index)}
            disabled={preview || inSolvedGroup}
          >
            {preview ? "?" : word}
          </button>
        )
      })}
    </div>
  )
}
