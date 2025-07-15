import { cn } from "@/lib/utils"

type ConnectionGroupProps = {
  words: string[]
  category: string
  color: string
}

export function ConnectionGroup({ words, category, color }: ConnectionGroupProps) {
  return (
    <div className={cn("rounded-lg p-3 shadow-md transition-all duration-300 hover:shadow-lg", color)}>
      <div className="mb-2 font-bold">{category}</div>
      <div className="grid grid-cols-4 gap-2">
        {words.map((word, index) => (
          <div
            key={index}
            className="rounded-lg bg-white/60 p-2 text-center text-sm font-medium shadow-sm transition-transform duration-300 hover:-translate-y-1"
          >
            {word}
          </div>
        ))}
      </div>
    </div>
  )
}
