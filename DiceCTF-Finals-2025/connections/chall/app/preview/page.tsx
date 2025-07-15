import { randomBytes } from 'crypto'
import Link from "next/link"
import { redirect } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectionGroup } from "@/components/connection-group"
import { Home, Share2 } from "lucide-react"
import Game from "@/components/game"
import { GroupData, parseGroupData } from '@/lib/utils'

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

export default async function PreviewPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ data?: string }> 
}) {
  const params = await searchParams
  
  if (!params.data) {
    redirect('/create')
  }

  let groups: GroupData[]
  try {
    groups = parseGroupData(params.data)
  } catch (error) {
    console.error('Failed to parse data:', error)
    redirect('/create?error=parse-failed')
  }

  const saveCustomConnection = async () => {
    "use server"
    
    const id = randomBytes(5).toString('hex')
    const connectionData: ConnectionsData = {
      id,
      groups,
      createdAt: new Date(),
    }
    
    
    const connections = getCustomConnections()
    connections.set(id, connectionData)
    console.log('Saved connection:', connectionData)
    
    // Redirect to the saved puzzle with a success indicator and clear WIP flag
    redirect(`/play?id=${id}&saved=true&clearWip=true`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-blue-50 to-purple-50 p-6">
      <div className="container max-w-4xl mx-auto py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/create">
            <Button variant="outline" size="icon" className="rounded-full bg-white shadow-md hover:bg-pink-50">
              <Home className="h-4 w-4 text-pink-500" />
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          {/* Game Preview */}
          <Card className="border-2 border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-100">
              <CardTitle className="text-purple-700">Your Connections Puzzle</CardTitle>
              <CardDescription>Try to solve your own puzzle!</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Game puzzle={{ groups }} />
            </CardContent>
          </Card>

          {/* Solution */}
          <Card className="border-2 border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-100 to-green-50">
              <CardTitle className="text-green-700">Solution</CardTitle>
              <CardDescription>The correct groupings for your puzzle</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {groups.map((group, index) => (
                  <ConnectionGroup 
                    key={index} 
                    words={group.words} 
                    category={group.category} 
                    color={group.color} 
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Back to Edit */}
          <div className="flex justify-between">
            <Link href="/create">
              <Button
                variant="outline"
                className="px-6 py-2 font-medium border-2 border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                ← Back to Edit
              </Button>
            </Link>
            
            <form action={saveCustomConnection}>
              <Button
                type="submit"
                className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-2 font-medium text-white transition-all duration-300 hover:from-green-600 hover:to-blue-600"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Save & Share Puzzle
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}