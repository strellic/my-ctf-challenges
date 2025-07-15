export type ConnectionsData = {
  id: string
  groups: {
    category: string
    words: string[]
    color: string
  }[]
  createdAt: Date
}