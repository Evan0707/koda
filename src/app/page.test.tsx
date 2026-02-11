import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Page from './page'

describe('Page d\'accueil', () => {
 it('affiche le titre principal', () => {
  render(<Page />)
  const heading = screen.getByRole('heading', { level: 1 })
  expect(heading).toBeInTheDocument()
 })
})
