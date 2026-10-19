import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveKitImages, savesToDownloads } from '../saveKitImages'

const slides = [
  { file: '01.jpg', url: 'https://storage.googleapis.com/b/01.jpg' },
  { file: '02.jpg', url: null },
  { file: '03.jpg', url: 'https://storage.googleapis.com/b/03.jpg' },
]

function okResponse(body: string) {
  return { ok: true, status: 200, blob: () => Promise.resolve(new Blob([body], { type: 'image/jpeg' })) } as unknown as Response
}

describe('saveKitImages', () => {
  const createObjectURL = vi.fn(() => 'blob:img')
  const revokeObjectURL = vi.fn()
  let clicked: HTMLAnchorElement[]

  beforeEach(() => {
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
    Object.assign(URL, { createObjectURL, revokeObjectURL })
    clicked = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this)
    })
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('shares every slide with a URL as one File each through the system share sheet', async () => {
    const fetchImpl = vi.fn((url: string) => Promise.resolve(okResponse(url)))
    const share = vi.fn((_data?: ShareData) => Promise.resolve())
    const canShare = vi.fn((_data?: ShareData) => true)
    const progress: Array<[number, number]> = []

    const result = await saveKitImages('2026-10-16', slides, {
      fetchImpl,
      nav: { share, canShare },
      onProgress: (done, total) => progress.push([done, total]),
    })

    expect(result).toBe('shared')
    expect(fetchImpl.mock.calls.map((c) => c[0])).toEqual([slides[0].url, slides[2].url])
    expect(progress[0]).toEqual([0, 2])
    expect(progress.at(-1)).toEqual([2, 2])
    expect(canShare).toHaveBeenCalledWith({ files: expect.any(Array) })
    const data = share.mock.calls[0][0] as ShareData
    expect(data.files?.map((f) => f.name)).toEqual(['2026-10-16-01.jpg', '2026-10-16-03.jpg'])
    expect(data.files?.every((f) => f.type === 'image/jpeg')).toBe(true)
    expect(data.title).toBe('2026-10-16')
    expect(clicked).toHaveLength(0)
  })

  it('uses the given share title', async () => {
    const fetchImpl = vi.fn((url: string) => Promise.resolve(okResponse(url)))
    const share = vi.fn((_data?: ShareData) => Promise.resolve())
    await saveKitImages('k', slides, { fetchImpl, title: 'Brand k', nav: { share, canShare: () => true } })
    expect((share.mock.calls[0][0] as ShareData).title).toBe('Brand k')
  })

  it('reports a cancelled share sheet without throwing', async () => {
    const fetchImpl = vi.fn((url: string) => Promise.resolve(okResponse(url)))
    const abort = new Error('cancelled')
    abort.name = 'AbortError'
    const result = await saveKitImages('k', slides, { fetchImpl, nav: { share: () => Promise.reject(abort), canShare: () => true } })
    expect(result).toBe('cancelled')
  })

  it('downloads each image separately when files cannot be shared', async () => {
    const fetchImpl = vi.fn((url: string) => Promise.resolve(okResponse(url)))
    const result = await saveKitImages('2026-10-16', slides, { fetchImpl, nav: { share: undefined, canShare: undefined } as never })
    expect(result).toBe('downloaded')
    expect(clicked.map((a) => a.download)).toEqual(['2026-10-16-01.jpg', '2026-10-16-03.jpg'])
    expect(createObjectURL).toHaveBeenCalledTimes(2)
    expect(document.body.contains(clicked[0])).toBe(false)
    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledTimes(2)
  })

  it("mode 'download' skips the share sheet even where it would work", async () => {
    const fetchImpl = vi.fn((url: string) => Promise.resolve(okResponse(url)))
    const share = vi.fn((_data?: ShareData) => Promise.resolve())
    const result = await saveKitImages('k', slides, { fetchImpl, mode: 'download', nav: { share, canShare: () => true } })
    expect(result).toBe('downloaded')
    expect(share).not.toHaveBeenCalled()
    expect(clicked.map((a) => a.download)).toEqual(['k-01.jpg', 'k-03.jpg'])
  })

  it('rejects naming the file when a fetch returns a non-OK status, and saves nothing', async () => {
    const fetchImpl = vi.fn((url: string) =>
      Promise.resolve(url.endsWith('03.jpg') ? ({ ok: false, status: 403 } as Response) : okResponse(url)),
    )
    const share = vi.fn()
    await expect(saveKitImages('k', slides, { fetchImpl, nav: { share, canShare: () => true } })).rejects.toThrow(/03\.jpg.*403/)
    expect(share).not.toHaveBeenCalled()
    expect(clicked).toHaveLength(0)
  })

  it('rejects when a fetch throws (network / CORS)', async () => {
    const fetchImpl = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
    await expect(saveKitImages('k', slides, { fetchImpl })).rejects.toThrow(/01\.jpg.*Failed to fetch/)
    expect(clicked).toHaveLength(0)
  })

  it('rejects when no slide has a URL', async () => {
    const fetchImpl = vi.fn()
    await expect(saveKitImages('k', [{ file: 'a.jpg', url: null }], { fetchImpl })).rejects.toThrow('沒有可儲存的圖片')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('savesToDownloads is true on Android only', () => {
    expect(savesToDownloads('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36')).toBe(true)
    expect(savesToDownloads('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1')).toBe(false)
    expect(savesToDownloads('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 Chrome/130 Safari/537.36')).toBe(false)
  })
})
