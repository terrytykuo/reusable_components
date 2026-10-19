/** One image of a kit, as written by the CI side: file name + public URL (null until uploaded). */
export interface Slide {
  file: string
  url: string | null
}
