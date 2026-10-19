import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StatusToggle } from '../StatusToggle'

function deferred() {
  let resolve!: () => void
  let reject!: (e: unknown) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function renderInLink(props: Partial<Parameters<typeof StatusToggle>[0]> & { on: boolean; onToggle: (next: boolean) => Promise<unknown> }) {
  return render(
    <MemoryRouter initialEntries={['/list']}>
      <Routes>
        <Route
          path="/list"
          element={
            <Link to="/detail">
              card
              <StatusToggle {...props} />
            </Link>
          }
        />
        <Route path="/detail" element={<p>DETAIL PAGE</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StatusToggle', () => {
  afterEach(cleanup)

  it('is a switch labelled with the current state', () => {
    renderInLink({ on: false, onToggle: vi.fn() })
    expect(screen.getByRole('switch', { name: '未發' })).toHaveAttribute('aria-checked', 'false')
    cleanup()
    renderInLink({ on: true, onToggle: vi.fn() })
    expect(screen.getByRole('switch', { name: '已發' })).toHaveAttribute('aria-checked', 'true')
  })

  it('uses custom labels', () => {
    renderInLink({ on: true, onToggle: vi.fn(), labels: { on: 'Done', off: 'Todo' } })
    expect(screen.getByRole('switch', { name: 'Done' })).toBeInTheDocument()
  })

  it('calls onToggle with the next state, disables while it runs, and never navigates', async () => {
    const pending = deferred()
    const onToggle = vi.fn(() => pending.promise)
    renderInLink({ on: false, onToggle })
    fireEvent.click(screen.getByRole('switch'))
    expect(onToggle).toHaveBeenCalledWith(true)
    expect(screen.getByRole('switch')).toBeDisabled()
    expect(screen.queryByText('DETAIL PAGE')).not.toBeInTheDocument()
    pending.resolve()
    await waitFor(() => expect(screen.getByRole('switch')).toBeEnabled())
  })

  it('asks for false when currently on', async () => {
    const onToggle = vi.fn(async () => {})
    renderInLink({ on: true, onToggle })
    fireEvent.click(screen.getByRole('switch'))
    await waitFor(() => expect(onToggle).toHaveBeenCalledWith(false))
    expect(screen.queryByText('DETAIL PAGE')).not.toBeInTheDocument()
  })

  it('shows an inline error when onToggle rejects', async () => {
    renderInLink({ on: false, onToggle: vi.fn(async () => Promise.reject(new Error('permission-denied'))) })
    fireEvent.click(screen.getByRole('switch'))
    expect(await screen.findByRole('alert')).toHaveTextContent('更新失敗：permission-denied')
    expect(screen.getByRole('switch')).toBeEnabled()
  })

  it('reports the error to onError instead when given', async () => {
    const onError = vi.fn()
    renderInLink({ on: false, onToggle: vi.fn(async () => Promise.reject(new Error('offline'))), onError })
    fireEvent.click(screen.getByRole('switch'))
    await waitFor(() => expect(onError).toHaveBeenLastCalledWith('offline'))
    expect(onError).toHaveBeenCalledWith(null)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
