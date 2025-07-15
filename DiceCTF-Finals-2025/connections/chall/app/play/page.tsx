import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, Home } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Game from "@/components/game"
import ShareButton from "@/components/share-button"
import ClearWip from "@/components/clear-wip"
import DifficultyIndicator from "@/components/difficulty-indicator"
import { sampleConnection } from "@/lib/data"

type ConnectionsData = {
  id: string
  groups: {
    category: string
    words: string[]
    color: string
  }[]
  createdAt: Date
}

// Global storage for custom connections
declare global {
  var customConnections: Map<string, ConnectionsData> | undefined;
}

const getCustomConnections = () => {
  if (!globalThis.customConnections) {
    globalThis.customConnections = new Map<string, ConnectionsData>()
  }
  return globalThis.customConnections
}

export default async function PlayPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ id?: string; saved?: string; clearWip?: string }> 
}) {
  const params = await searchParams
  const customId = params.id
  const showSavedMessage = params.saved === 'true'
  const shouldClearWip = params.clearWip === 'true'

  let connectionData: ConnectionsData | null = null
  let error: string | null = null

  if (customId) {
    const connections = getCustomConnections()
    connectionData = connections.get(customId) || null
    if (!connectionData) {
      error = "Connection not found"
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-blue-50 to-purple-50 p-6">
        <div className="container max-w-4xl mx-auto py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-600 mb-2">Puzzle Not Found</h2>
              <p className="text-red-500 mb-4">{error}</p>
              <Link href="/">
                <Button>Back to Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const puzzle = connectionData || sampleConnection
  const isCustom = !!connectionData

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-blue-50 to-purple-50 p-6">
      <ClearWip shouldClear={shouldClearWip} />
      <div className="container max-w-4xl mx-auto py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="icon" className="rounded-full bg-white shadow-md hover:bg-pink-50">
              <Home className="h-4 w-4 text-pink-500" />
            </Button>
          </Link>
          <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-3xl font-bold text-transparent">
            {isCustom ? "Custom Connections" : "Play Connections"}
          </h1>
          <div className="w-10" />
        </div>

        {showSavedMessage && (
          <Alert className="mb-6 border-2 border-green-300 bg-green-50 text-green-800 shadow-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              Your puzzle has been saved! Share this link with others to let them play your puzzle.
            </AlertDescription>
          </Alert>
        )}

        {isCustom && (
          <DifficultyIndicator puzzle={puzzle} />
        )}

        <Game puzzle={puzzle} />

        {isCustom && (
          <div className="mt-6 flex justify-center">
            <ShareButton />
          </div>
        )}
      </div>
    </div>
  )
}