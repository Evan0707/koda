export type Stage = {
  id: string
  name: string
  color: string
  position: number
  isWon: boolean
  isLost: boolean
}

export type Opportunity = {
  id: string
  name: string
  value: number
  probability: number
  stage_id: string
  company_id: string | null
  expected_close_date: string | null
  companies: { id: string; name: string } | null
  contacts: { id: string; first_name: string; last_name: string } | null
  pipeline_stages: Stage | null
}

export type Company = { id: string; name: string }
export type Contact = { id: string; first_name: string; last_name: string | null }
