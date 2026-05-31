export interface ScenarioCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  orderIndex: number
  scenarios?: Scenario[]
}

export interface Scenario {
  id: string
  categoryId: string
  category?: ScenarioCategory
  title: string
  description: string
  systemPrompt: string
  openingMessage?: string | null
  requiredLevel: string
  difficulty: string
  scoringCriteria: Array<{ name: string; description: string; weight: number }>
  maxTurns?: number | null
  estimatedMinutes: number
  isPublished: boolean
  characters?: ScenarioCharacter[]
}

export interface ScenarioCharacter {
  id: string
  scenarioId: string
  scenario?: Scenario
  name: string
  role: string
  personality: string
  speechStyle: string
  avatarKey?: string | null
  isPlayable: boolean
  orderIndex: number
}
