import { render, screen } from '@testing-library/react'
import SpeciesCard from '@/components/species/SpeciesCard'
import type { Species } from '@/types'

const mockSpecies: Species = {
  id: '1', name_ko: '개구리', name_scientific: 'Rana nigromaculata',
  category: '양서류', description: '연못에 사는 개구리', habitat: '연못가',
  image_url: null, created_by: null,
  created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z',
}

it('생물 이름과 카테고리를 렌더링한다', () => {
  render(<SpeciesCard species={mockSpecies} />)
  expect(screen.getByText('개구리')).toBeInTheDocument()
  expect(screen.getByText('양서류')).toBeInTheDocument()
})
