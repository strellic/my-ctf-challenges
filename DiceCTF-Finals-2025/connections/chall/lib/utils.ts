import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shuffle<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

// Strict validation schema for group data
const VALID_COLORS = [
  "bg-yellow-200 text-yellow-900",
  "bg-green-200 text-green-900",
  "bg-blue-200 text-blue-900",
  "bg-purple-200 text-purple-900",
  "bg-red-200 text-red-900",
  "bg-orange-200 text-orange-900",
  "bg-pink-200 text-pink-900",
  "bg-teal-200 text-teal-900",
  "bg-gray-200 text-gray-900",
  "bg-indigo-200 text-indigo-900",
  "bg-cyan-200 text-cyan-900",
  "bg-emerald-200 text-emerald-900",
] as const

const GroupSchema = z.object({
  category: z.string()
    .min(1, "Category is required")
    .max(50, "Category too long")
    .regex(/^[a-zA-Z0-9\s\-'&]+$/, "Category contains invalid characters"),
  words: z.array(
    z.string()
      .min(1, "Word is required")
      .max(20, "Word too long")
      .regex(/^[a-zA-Z0-9\s\-'&]+$/, "Word contains invalid characters")
  ).length(4, "Must have exactly 4 words"),
  color: z.enum(VALID_COLORS)
}).strict() // No extra properties allowed

const GroupsSchema = z.array(GroupSchema)
  .length(4, "Must have exactly 4 groups")
  .refine((groups) => {
    // Ensure no duplicate colors
    const colors = groups.map(g => g.color)
    return new Set(colors).size === colors.length
  }, { message: "Duplicate colors not allowed" })
  .refine((groups) => {
    // Ensure no duplicate words across all groups
    const allWords = groups.flatMap(g => g.words.map(w => w.toLowerCase().trim()))
    return new Set(allWords).size === allWords.length
  }, { message: "Duplicate words not allowed" })
  .refine((groups) => {
    // Ensure all categories are unique
    const categories = groups.map(g => g.category.toLowerCase().trim())
    return new Set(categories).size === categories.length
  }, { message: "Duplicate categories not allowed" })

export type GroupData = z.infer<typeof GroupSchema>

export function parseGroupData(data: string): GroupData[] {
  const parsed = GroupsSchema.parse(JSON.parse(data))
  return parsed
}