import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from '../ErrorBoundary'

function Boom(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>fine</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('fine')).toBeInTheDocument()
  })

  it('shows a recoverable screen when a child throws during render', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('出了點問題')
    expect(screen.getByRole('button', { name: '回首頁' })).toBeInTheDocument()
  })

  it('goes back to the home route instead of reloading the crashed one', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign, reload: vi.fn() })
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    fireEvent.click(screen.getByRole('button', { name: '回首頁' }))
    expect(assign).toHaveBeenCalledWith('/')
    vi.unstubAllGlobals()
  })
})
