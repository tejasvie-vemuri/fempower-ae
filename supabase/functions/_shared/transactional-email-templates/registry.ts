/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { template as membershipApproved } from './membership-approved.tsx'
import { template as circlePostApproved } from './circle-post-approved.tsx'
import { template as circlePostPending } from './circle-post-pending.tsx'
import { template as eventRegistrationConfirmation } from './event-registration-confirmation.tsx'
import { template as welcome } from './welcome.tsx'
import { template as profileCompletionReminder } from './profile-completion-reminder.tsx'
import { template as lifestyleDigest } from './lifestyle-digest.tsx'
import { template as testimonialRequest } from './testimonial-request.tsx'
import { template as testimonialFeedback } from './testimonial-feedback.tsx'

export type SubjectFn = (data: Record<string, unknown>) => string

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | SubjectFn
  displayName?: string
  previewData?: Record<string, unknown>
  /** Optional fixed recipient that overrides the caller-provided recipient. */
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'membership-approved': membershipApproved,
  'circle-post-approved': circlePostApproved,
  'circle-post-pending': circlePostPending,
  'event-registration-confirmation': eventRegistrationConfirmation,
  'welcome': welcome,
  'profile-completion-reminder': profileCompletionReminder,
  'lifestyle-digest': lifestyleDigest,
  'testimonial-request': testimonialRequest,
  'testimonial-feedback': testimonialFeedback,
}
