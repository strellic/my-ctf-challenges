import React from 'react'
import type { ConnectionsData } from '@/types'

type DifficultyIndicatorProps = React.HTMLAttributes<HTMLDivElement> & {
  puzzle: ConnectionsData
}

export default function DifficultyIndicator({ puzzle, className = "" }: DifficultyIndicatorProps) {
  const { groups } = puzzle
  
  return (
    <div 
      className={`rounded-lg border-2 border-purple-200 bg-white p-4 shadow-lg ${className}`}
    >
      <h3 className="mb-3 text-sm font-medium text-purple-700">Difficulty Levels</h3>
      <div className="grid grid-cols-4 gap-3">
        {groups.map((group, index) => {
          const { category, words, color, ...props } = group
          return (
            <div key={index} className="flex items-center gap-2">
              <div
                className={`rounded-lg p-3 shadow-md transition-all duration-300 ${color} w-8 h-8`}
                {...props}
              />
              <span className="text-sm font-medium text-gray-700">
                {["Easy", "Medium", "Hard", "Very Hard"][index]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}