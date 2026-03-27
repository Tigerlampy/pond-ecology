export interface Profile {
  id: string
  display_name: string
  grade: number | null
  class: string | null
  points: number
  created_at: string
}

export type SpeciesCategory = '어류' | '양서류' | '곤충' | '식물' | '조류' | '기타'

export interface Species {
  id: string
  name_ko: string
  name_scientific: string | null
  category: SpeciesCategory
  description: string | null
  habitat: string | null
  image_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Season = '봄' | '여름' | '가을' | '겨울'

export interface Observation {
  id: string
  species_id: string
  observer_id: string
  observed_at: string
  season: Season
  location: string | null
  count: number
  notes: string | null
  image_url: string | null
  weather: string | null
  created_at: string
  species?: Species
  observer?: Profile
}
