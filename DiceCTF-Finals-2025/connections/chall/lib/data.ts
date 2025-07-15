import { ConnectionsData } from "@/types"

export const sampleConnection: ConnectionsData = {
  id: "1",
  groups: [
    {
      category: "Fruits",
      words: ["Apple", "Banana", "Orange", "Grape"],
      color: "bg-yellow-200 text-yellow-900",
    },
    {
      category: "Animals",
      words: ["Lion", "Tiger", "Bear", "Wolf"],
      color: "bg-green-200 text-green-900",
    },
    {
      category: "Countries",
      words: ["France", "Spain", "Italy", "Germany"],
      color: "bg-blue-200 text-blue-900",
    },
    {
      category: "Programming Languages",
      words: ["JavaScript", "Python", "Java", "Ruby"],
      color: "bg-purple-200 text-purple-900",
    },
  ],
  createdAt: new Date(0)
};
