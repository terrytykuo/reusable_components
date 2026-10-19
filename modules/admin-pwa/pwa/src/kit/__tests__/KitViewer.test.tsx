import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { KitViewer } from '../KitViewer'

const slides = [
  { file: '01.jpg', url: 'https://storage.googleapis.com/b/01.jpg' },
  { file: '02.jpg', url: 'https://storage.googleapis.com/b/02.jpg' },
  { file: '03.jpg', url: null },
]

describe('KitViewer', () => {
  afterEach(cleanup)

  it('shows the empty state when there are no slides', () => {
    render(<KitViewer slides={[]} />)
    expect(screen.getByText('尚未產生圖片')).toBeInTheDocument()
  })

  it('renders lazy images for slides with a url and a counter', () => {
    render(<KitViewer slides={slides} />)
    const imgs = screen.getAllByRole('img')
    expect(imgs.map((i) => i.getAttribute('alt'))).toEqual(['第 1 張', '第 2 張'])
    expect(imgs[0]).toHaveAttribute('loading', 'lazy')
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('opens a full-screen dialog on tap, steps with next, and closes', () => {
    render(<KitViewer slides={slides} />)
    fireEvent.click(screen.getByRole('button', { name: '放大第 2 張' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAccessibleName('第 2 張，共 2 張')
    expect(screen.getByRole('button', { name: '下一張' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '上一張' }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName('第 1 張，共 2 張')
    fireEvent.click(screen.getByRole('button', { name: '關閉' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('steps with arrow keys without moving focus, closes on Escape and restores focus', () => {
    const three = [...slides.slice(0, 2), { file: '03.jpg', url: 'https://storage.googleapis.com/b/03.jpg' }]
    render(<KitViewer slides={three} />)
    const opener = screen.getByRole('button', { name: '放大第 1 張' })
    opener.focus()
    fireEvent.click(opener)
    expect(screen.getByRole('button', { name: '關閉' })).toHaveFocus()

    const nextButton = screen.getByRole('button', { name: '下一張' })
    nextButton.focus()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByRole('dialog')).toHaveAccessibleName('第 2 張，共 3 張')
    expect(nextButton).toHaveFocus()
    fireEvent.click(nextButton)
    expect(screen.getByRole('dialog')).toHaveAccessibleName('第 3 張，共 3 張')
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByRole('dialog')).toHaveAccessibleName('第 2 張，共 3 張')
    expect(screen.getByRole('button', { name: '關閉' })).not.toHaveFocus()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('clamps the open slide when slides shrink, and closes when none are left', () => {
    const { rerender } = render(<KitViewer slides={slides} />)
    fireEvent.click(screen.getByRole('button', { name: '放大第 2 張' }))
    rerender(<KitViewer slides={slides.slice(0, 1)} />)
    expect(screen.getByRole('dialog')).toHaveAccessibleName('第 1 張，共 1 張')
    rerender(<KitViewer slides={[]} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('尚未產生圖片')).toBeInTheDocument()
  })
})
