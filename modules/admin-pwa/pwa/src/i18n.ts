import { brand } from './brand'
import { defaultStrings, type UiStrings } from './strings'

/** Resolved UI strings: defaults from strings.ts with brand.strings applied on top. */
export const t: UiStrings = { ...defaultStrings, ...brand.strings }
