import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveKitImages } from '../saveKitImages'
import { DownloadAllButton } from '../DownloadAllButton'

vi.mock('../saveKitImages', () => ({ saveKitImages: vi.fn() }))

const slides = [
  { file: '01.jpg', url: 'https://x/01.jpg' },
  { file: '02.jpg', url: 'https://x/02.jpg' },
]

describe('DownloadAllButton', () => {
  beforeEach(() => {
    vi.mocked(saveKitImages).mockReset()
  })
  afterEach(cleanup)

  it('saves the kit images, showing progress and staying disabled while running', async () => {
    let finish!: () => void
    vi.mocked(saveKitImages).mockImplementation((_id, _slides, opts) => {
      opts?.onProgress?.(1, 2)
      return new Promise((resolve) => (finish = () => resolve('shared')))
    })
    render(<DownloadAllButton kitId="2026-10-16" slides={slides} />)
    fireEvent.click(screen.getByRole('button', { name: '儲存全部圖片' }))
    expect(saveKitImages).toHaveBeenCalledWith('2026-10-16', slides, expect.objectContaining({ onProgress: expect.any(Function) }))
    const busy = screen.getByRole('button', { name: '準備中 1/2' })
    expect(busy).toBeDisabled()
    await act(async () => finish())
    expect(screen.getByRole('button', { name: '儲存全部圖片' })).toBeEnabled()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('explains the per-image download fallback', async () => {
    vi.mocked(saveKitImages).mockResolvedValue('downloaded')
    render(<DownloadAllButton kitId="k" slides={slides} />)
    fireEvent.click(screen.getByRole('button', { name: '儲存全部圖片' }))
    expect(await screen.findByText(/已逐張下載/)).toBeInTheDocument()
  })

  it('asks for a second tap when the share sheet lost the user activation', async () => {
    const err = new Error('share blocked')
    err.name = 'NotAllowedError'
    vi.mocked(saveKitImages).mockRejectedValue(err)
    render(<DownloadAllButton kitId="k" slides={slides} />)
    fireEvent.click(screen.getByRole('button', { name: '儲存全部圖片' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('請再點一次')
  })

  it('shows an error line when saving fails', async () => {
    vi.mocked(saveKitImages).mockRejectedValue(new Error('02.jpg：HTTP 403'))
    render(<DownloadAllButton kitId="k" slides={slides} />)
    fireEvent.click(screen.getByRole('button', { name: '儲存全部圖片' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('02.jpg：HTTP 403')
    expect(screen.getByRole('button', { name: '儲存全部圖片' })).toBeEnabled()
  })

  it('renders nothing when no slide has a URL', () => {
    const { container } = render(<DownloadAllButton kitId="k" slides={[{ file: 'a.jpg', url: null }]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
