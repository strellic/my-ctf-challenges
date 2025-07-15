"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Home, AlertCircle } from "lucide-react"

type GroupData = {
  category: string
  words: string[]
  color: string
}

function CreatePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  
  const colorPresets = [
    { name: "Yellow", value: "bg-yellow-200 text-yellow-900" },
    { name: "Green", value: "bg-green-200 text-green-900" },
    { name: "Blue", value: "bg-blue-200 text-blue-900" },
    { name: "Purple", value: "bg-purple-200 text-purple-900" },
    { name: "Red", value: "bg-red-200 text-red-900" },
    { name: "Orange", value: "bg-orange-200 text-orange-900" },
    { name: "Pink", value: "bg-pink-200 text-pink-900" },
    { name: "Teal", value: "bg-teal-200 text-teal-900" },
    { name: "Gray", value: "bg-gray-200 text-gray-900" },
    { name: "Indigo", value: "bg-indigo-200 text-indigo-900" },
    { name: "Cyan", value: "bg-cyan-200 text-cyan-900" },
    { name: "Emerald", value: "bg-emerald-200 text-emerald-900" },
  ]

  const standardColors = [
    "bg-yellow-200 text-yellow-900",
    "bg-green-200 text-green-900", 
    "bg-blue-200 text-blue-900",
    "bg-purple-200 text-purple-900"
  ]

  const [groups, setGroups] = useState<GroupData[]>([
    { category: "", words: ["", "", "", ""], color: standardColors[0] },
    { category: "", words: ["", "", "", ""], color: standardColors[1] },
    { category: "", words: ["", "", "", ""], color: standardColors[2] },
    { category: "", words: ["", "", "", ""], color: standardColors[3] },
  ])

  // Load saved state on mount
  useEffect(() => {
    const savedGroups = localStorage.getItem('connections-wip')
    if (savedGroups) {
      try {
        const parsed = JSON.parse(savedGroups)
        setGroups(parsed)
      } catch {
        // If parsing fails, keep default state
      }
    }
  }, [])

  // Save state whenever groups change
  useEffect(() => {
    localStorage.setItem('connections-wip', JSON.stringify(groups))
  }, [groups])

  const handleCategoryChange = (index: number, value: string) => {
    const newGroups = [...groups]
    newGroups[index].category = value
    setGroups(newGroups)
  }

  const handleWordChange = (groupIndex: number, wordIndex: number, value: string) => {
    const newGroups = [...groups]
    newGroups[groupIndex].words[wordIndex] = value
    setGroups(newGroups)
  }

  const handleColorChange = (groupIndex: number, color: string) => {
    // Check if color is already used by another group
    const isColorUsed = groups.some((group, index) => index !== groupIndex && group.color === color)
    if (isColorUsed) {
      return // Don't allow duplicate colors
    }
    
    const newGroups = [...groups]
    newGroups[groupIndex].color = color
    setGroups(newGroups)
  }

  const getAvailableColors = (currentGroupIndex: number) => {
    const usedColors = groups
      .filter((_, index) => index !== currentGroupIndex)
      .map(group => group.color)
    
    return colorPresets.filter(preset => !usedColors.includes(preset.value))
  }

  const getHeaderGradient = (color: string) => {
    const colorMap: Record<string, string> = {
      "bg-yellow-200 text-yellow-900": "from-yellow-100 to-yellow-50",
      "bg-green-200 text-green-900": "from-green-100 to-green-50",
      "bg-blue-200 text-blue-900": "from-blue-100 to-blue-50",
      "bg-purple-200 text-purple-900": "from-purple-100 to-purple-50",
      "bg-red-200 text-red-900": "from-red-100 to-red-50",
      "bg-orange-200 text-orange-900": "from-orange-100 to-orange-50",
      "bg-pink-200 text-pink-900": "from-pink-100 to-pink-50",
      "bg-teal-200 text-teal-900": "from-teal-100 to-teal-50",
      "bg-gray-200 text-gray-900": "from-gray-100 to-gray-50",
      "bg-indigo-200 text-indigo-900": "from-indigo-100 to-indigo-50",
      "bg-cyan-200 text-cyan-900": "from-cyan-100 to-cyan-50",
      "bg-emerald-200 text-emerald-900": "from-emerald-100 to-emerald-50",
    }
    return colorMap[color] || "from-gray-100 to-gray-50"
  }

  const getBorderColor = (color: string) => {
    const colorMap: Record<string, string> = {
      "bg-yellow-200 text-yellow-900": "border-yellow-200",
      "bg-green-200 text-green-900": "border-green-200",
      "bg-blue-200 text-blue-900": "border-blue-200",
      "bg-purple-200 text-purple-900": "border-purple-200",
      "bg-red-200 text-red-900": "border-red-200",
      "bg-orange-200 text-orange-900": "border-orange-200",
      "bg-pink-200 text-pink-900": "border-pink-200",
      "bg-teal-200 text-teal-900": "border-teal-200",
      "bg-gray-200 text-gray-900": "border-gray-200",
      "bg-indigo-200 text-indigo-900": "border-indigo-200",
      "bg-cyan-200 text-cyan-900": "border-cyan-200",
      "bg-emerald-200 text-emerald-900": "border-emerald-200",
    }
    return colorMap[color] || "border-gray-200"
  }

  const isFormComplete = () => {
    return groups.every((group) => group.category.trim() !== "" && group.words.every((word) => word.trim() !== ""))
  }

  const clearWipState = () => {
    localStorage.removeItem('connections-wip')
    // Reset to default state
    setGroups([
      { category: "", words: ["", "", "", ""], color: standardColors[0] },
      { category: "", words: ["", "", "", ""], color: standardColors[1] },
      { category: "", words: ["", "", "", ""], color: standardColors[2] },
      { category: "", words: ["", "", "", ""], color: standardColors[3] },
    ])
  }

  const handlePreview = () => {
    if (!isFormComplete()) return
    
    // Serialize the data and navigate to preview
    const serializedData = encodeURIComponent(JSON.stringify(groups))
    router.push(`/preview?data=${serializedData}`)
  }

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'invalid-data':
        return 'The puzzle data is invalid. Please check your entries and try again.'
      case 'parse-failed':
        return 'Failed to process the puzzle data. Please try again.'
      default:
        return 'An error occurred. Please try again.'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-blue-50 to-purple-50 p-6">
      <div className="container max-w-4xl mx-auto py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="icon" className="rounded-full bg-white shadow-md hover:bg-pink-50">
              <Home className="h-4 w-4 text-pink-500" />
            </Button>
          </Link>
          <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-3xl font-bold text-transparent">
            Create Connections
          </h1>
          <Button
            variant="outline"
            onClick={clearWipState}
            className="border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            New Puzzle
          </Button>
        </div>

        {error && (
          <Alert className="mb-6 border-2 border-red-300 bg-red-50 text-red-800 shadow-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Error</AlertTitle>
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {groups.map((group, groupIndex) => {
            return (
              <Card
                key={groupIndex}
                className={`border-2 ${getBorderColor(group.color)} shadow-lg transition-all duration-300 hover:shadow-xl`}
              >
                <CardHeader className={`bg-gradient-to-r ${getHeaderGradient(group.color)}`}>
                  <CardTitle className="flex items-center justify-between">
                    <span>Group {groupIndex + 1}</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={group.color}
                        onChange={(e) => handleColorChange(groupIndex, e.target.value)}
                        className={`rounded-full px-3 py-1 text-sm ${group.color} shadow-md font-medium border-0 focus:ring-2 focus:ring-purple-300`}
                      >
                        {/* Current color option */}
                        <option value={group.color}>
                          {colorPresets.find(p => p.value === group.color)?.name || "Current"}
                        </option>
                        {/* Available colors (excluding current) */}
                        {getAvailableColors(groupIndex)
                          .filter(preset => preset.value !== group.color)
                          .map((preset) => (
                            <option key={preset.value} value={preset.value}>
                              {preset.name}
                            </option>
                          ))}
                      </select>
                      <div className="text-xs text-gray-500">
                        {["Easy", "Medium", "Hard", "Very Hard"][groupIndex]}
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    <div className="mt-2">
                      <Label htmlFor={`category-${groupIndex}`} className="font-medium">
                        Category Name
                      </Label>
                      <Input
                        id={`category-${groupIndex}`}
                        value={group.category}
                        onChange={(e) => handleCategoryChange(groupIndex, e.target.value)}
                        placeholder="e.g., Types of Fruit"
                        className="mt-1 border-2 shadow-sm focus:border-purple-300 focus:ring-purple-300"
                      />
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {group.words.map((word, wordIndex) => (
                      <div key={wordIndex} className="transition-all duration-300 hover:scale-105">
                        <Label htmlFor={`word-${groupIndex}-${wordIndex}`} className="font-medium">
                          Word {wordIndex + 1}
                        </Label>
                        <Input
                          id={`word-${groupIndex}-${wordIndex}`}
                          value={word}
                          onChange={(e) => handleWordChange(groupIndex, wordIndex, e.target.value)}
                          placeholder={`Word ${wordIndex + 1}`}
                          className="mt-1 border-2 shadow-sm focus:border-purple-300 focus:ring-purple-300"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <div className="flex justify-end">
            <Button
              onClick={handlePreview}
              disabled={!isFormComplete()}
              className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-2 font-medium text-white transition-all duration-300 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400"
            >
              Preview
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-pink-50 via-blue-50 to-purple-50 p-6 flex items-center justify-center">
      <div className="text-purple-600 font-medium">Loading...</div>
    </div>}>
      <CreatePageContent />
    </Suspense>
  )
}