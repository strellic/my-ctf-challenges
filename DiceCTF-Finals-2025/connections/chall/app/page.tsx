import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectionsGrid } from "@/components/connections-grid"
import { sampleConnection } from "@/lib/data"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-blue-50 to-purple-50 p-6">
      <div className="container max-w-4xl mx-auto py-10">
        <div className="mb-10 text-center">
          <h1 className="mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent">
            Connections
          </h1>
          <p className="text-lg text-muted-foreground">Find groups of four related words. Can you solve the puzzle?</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-2 border-pink-200 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-pink-100">
            <div className="h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-t-lg"></div>
            <CardHeader className="bg-gradient-to-r from-pink-100 to-pink-50">
              <CardTitle className="text-pink-700">Today&apos;s Puzzle</CardTitle>
              <CardDescription>Play the daily connections puzzle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square">
                <ConnectionsGrid connections={sampleConnection} preview={true} />
              </div>
            </CardContent>
            <CardFooter className="bg-gradient-to-r from-pink-50 to-pink-100">
              <Link href="/play" className="w-full">
                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white transition-all duration-300 hover:from-pink-600 hover:to-purple-600">
                  Play Now
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="border-2 border-blue-200 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-blue-100">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-lg"></div>
            <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50">
              <CardTitle className="text-blue-700">Create Your Own</CardTitle>
              <CardDescription>Design custom connections puzzles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-full items-center justify-center p-6">
                <div className="text-center">
                  <div className="mb-4 rounded-full bg-blue-100 p-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mx-auto text-blue-600"
                    >
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </div>
                  <p className="mb-4 text-muted-foreground">
                    Create your own connections puzzle and share it with friends.
                  </p>
                  <Link href="/create">
                    <Button
                      variant="outline"
                      className="border-2 border-blue-200 bg-white text-blue-600 transition-all duration-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Create Puzzle
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10">
          <h2 className="mb-4 text-2xl font-bold text-purple-700">How to Play</h2>
          <div className="space-y-4 rounded-lg border-2 border-purple-200 bg-white p-6 shadow-lg">
            <p>Find groups of four related words from the 16 word grid.</p>
            <p>Select words by clicking or tapping them, then submit your guess.</p>
            <p>Each puzzle has 4 groups with different difficulty levels:</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-yellow-200 p-3 text-center font-medium text-yellow-800 shadow-md transition-transform duration-300 hover:-translate-y-1">
                Easy
              </div>
              <div className="rounded-lg bg-green-200 p-3 text-center font-medium text-green-800 shadow-md transition-transform duration-300 hover:-translate-y-1">
                Medium
              </div>
              <div className="rounded-lg bg-blue-200 p-3 text-center font-medium text-blue-800 shadow-md transition-transform duration-300 hover:-translate-y-1">
                Hard
              </div>
              <div className="rounded-lg bg-purple-200 p-3 text-center font-medium text-purple-800 shadow-md transition-transform duration-300 hover:-translate-y-1">
                Very Hard
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
