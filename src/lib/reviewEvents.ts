import type { CreateReviewInput } from '../types/mdkb.ts'

export interface ReviewSelectDetail {
  input: Omit<CreateReviewInput, 'comment'>
  anchorRect: DOMRect
}

export const MDKB_REVIEW_SELECT_EVENT = 'mdkb:review-select'

export function dispatchReviewSelect(detail: ReviewSelectDetail): void {
  window.dispatchEvent(new CustomEvent<ReviewSelectDetail>(MDKB_REVIEW_SELECT_EVENT, { detail }))
}
