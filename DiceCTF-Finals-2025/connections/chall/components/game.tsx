"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ConnectionsGrid } from "@/components/connections-grid"
import { ConnectionGroup } from "@/components/connection-group"
import { shuffle } from "@/lib/utils"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Confetti from "@/components/confetti"

type GameProps = {
  puzzle: {
    groups: {
      category: string
      words: string[]
      color: string
    }[]
  }
  onRestart?: () => void
}

export default function Game({ puzzle, onRestart }: GameProps) {
  const [gameState, setGameState] = useState({
    words: [] as string[],
    selectedIndices: [] as number[],
    solvedGroups: [] as {
      words: string[]
      category: string
      color: string
    }[],
    mistakes: 0,
    message: "",
    messageType: "",
    isComplete: false,
    showConfetti: false,
  })

  const startNewGame = useCallback(() => {
    // Flatten and shuffle all words
    const allWords = puzzle.groups.flatMap((group) => group.words)
    const shuffledWords = shuffle([...allWords])

    setGameState({
      words: shuffledWords,
      selectedIndices: [],
      solvedGroups: [],
      mistakes: 0,
      message: "",
      messageType: "",
      isComplete: false,
      showConfetti: false,
    })
  }, [puzzle])

  const handleWordSelect = (index: number) => {
    if (gameState.isComplete) return

    setGameState((prev) => {
      // If already selected, deselect it
      if (prev.selectedIndices.includes(index)) {
        return {
          ...prev,
          selectedIndices: prev.selectedIndices.filter((i) => i !== index),
          message: "",
          messageType: "",
        }
      }

      // If we already have 4 selections, replace the last one
      if (prev.selectedIndices.length >= 4) {
        return {
          ...prev,
          selectedIndices: [...prev.selectedIndices.slice(0, 3), index],
          message: "",
          messageType: "",
        }
      }

      // Add to selections
      return {
        ...prev,
        selectedIndices: [...prev.selectedIndices, index],
        message: "",
        messageType: "",
      }
    })
  }

  const handleSubmitGuess = () => {
    if (gameState.selectedIndices.length !== 4) {
      setGameState((prev) => ({
        ...prev,
        message: "Select exactly 4 words to submit a group",
        messageType: "warning",
      }))
      return
    }

    // Get the selected words
    const selectedWords = gameState.selectedIndices.map((index) => gameState.words[index])

    // Check if this is a valid group
    const matchingGroup = puzzle.groups.find((group) => {
      const groupWords = new Set(group.words)
      return selectedWords.every((word) => groupWords.has(word)) && selectedWords.length === group.words.length
    })

    if (matchingGroup) {
      // Correct group!
      setGameState((prev) => {
        const newSolvedGroups = [
          ...prev.solvedGroups,
          {
            words: selectedWords,
            category: matchingGroup.category,
            color: matchingGroup.color,
          },
        ]

        const isComplete = newSolvedGroups.length === 4

        return {
          ...prev,
          selectedIndices: [],
          solvedGroups: newSolvedGroups,
          message: isComplete ? "Puzzle complete! 🎉" : "Correct group!",
          messageType: "success",
          isComplete,
          showConfetti: true,
        }
      })

      // Hide confetti after 3 seconds
      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          showConfetti: false,
        }))
      }, 3000)
    } else {
      // Incorrect group
      setGameState((prev) => ({
        ...prev,
        selectedIndices: [],
        mistakes: prev.mistakes + 1,
        message: "That's not a group. Try again!",
        messageType: "error",
      }))
    }
  }

  const handleClearSelection = () => {
    setGameState((prev) => ({
      ...prev,
      selectedIndices: [],
      message: "",
      messageType: "",
    }))
  }

  // Initialize game
  useEffect(() => {
    startNewGame()
  }, [startNewGame, puzzle])

  return (
    <div className="space-y-6">
      {gameState.showConfetti && <Confetti />}

      {gameState.message && (
        <Alert
          className={`border-2 shadow-lg transition-all duration-300 ${
            gameState.messageType === "success"
              ? "border-green-300 bg-green-50 text-green-800"
              : gameState.messageType === "error"
                ? "border-red-300 bg-red-50 text-red-800"
                : "border-yellow-300 bg-yellow-50 text-yellow-800"
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {gameState.messageType === "success"
              ? "Success!"
              : gameState.messageType === "error"
                ? "Incorrect"
                : "Note"}
          </AlertTitle>
          <AlertDescription>{gameState.message}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border-2 border-purple-200 bg-white p-4 shadow-lg">
        <ConnectionsGrid
          connections={{ groups: [] }}
          words={gameState.words}
          selectedIndices={gameState.selectedIndices}
          onSelectWord={handleWordSelect}
          solvedGroups={gameState.solvedGroups}
        />
      </div>

      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handleClearSelection}
          disabled={gameState.selectedIndices.length === 0}
          className="flex-1 border-2 border-pink-200 bg-white font-medium text-pink-600 transition-all duration-300 hover:bg-pink-50 hover:text-pink-700 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
        >
          Clear Selection
        </Button>
        <Button
          onClick={handleSubmitGuess}
          disabled={gameState.selectedIndices.length !== 4 || gameState.isComplete}
          className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 font-medium text-white transition-all duration-300 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400"
        >
          Submit
        </Button>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between rounded-t-lg bg-gradient-to-r from-purple-100 to-blue-100 p-3">
          <h2 className="text-xl font-bold text-purple-700">Solved Groups</h2>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white px-3 py-1 text-sm font-medium text-purple-700 shadow-md">
              Mistakes: {gameState.mistakes}
            </div>
            {onRestart && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRestart}
                className="rounded-full bg-white shadow-md hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4 text-blue-500" />
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-3 rounded-b-lg border-2 border-t-0 border-purple-200 bg-white p-4 shadow-lg">
          {gameState.solvedGroups.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-purple-200 p-6 text-center text-muted-foreground">
              Solved groups will appear here
            </div>
          ) : (
            gameState.solvedGroups.map((group, index) => (
              <ConnectionGroup key={index} words={group.words} category={group.category} color={group.color} />
            ))
          )}
        </div>
      </div>

      {gameState.isComplete && (
        <div className="rounded-xl bg-gradient-to-r from-green-100 to-blue-100 p-8 text-center shadow-xl">
          <h2 className="mb-2 text-3xl font-bold text-green-700">Puzzle Complete! 🎉</h2>
          <p className="mb-6 text-lg text-green-600">You solved all the connections!</p>
          {onRestart && (
            <Button
              onClick={onRestart}
              className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-2 text-lg font-medium text-white transition-all duration-300 hover:from-green-600 hover:to-blue-600"
            >
              Play Again
            </Button>
          )}
        </div>
      )}
    </div>
  )
}