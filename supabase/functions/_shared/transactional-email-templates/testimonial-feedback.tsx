/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry, SubjectFn } from './registry.ts'
import { BrandHeader, styles as s } from './_brand.tsx'

type Decision = 'approved' | 'rejected' | 'changes_requested'

interface Props {
  name?: string
  decision: Decision
  quote?: string
  feedbackNote?: string
  siteUrl?: string
}

const TITLES: Record<Decision, string> = {
  approved: 'Your testimonial is live 💗',
  changes_requested: 'A small tweak to your testimonial',
  rejected: 'About your testimonial',
}

const INTROS: Record<Decision, string> = {
  approved: "Thank you for sharing your voice. Your testimonial is now published on the Fempower homepage.",
  changes_requested: "Thank you for sharing your story. We'd love a small edit before it goes live — details from the team below.",
  rejected: "Thank you for taking the time to share. After a careful review, we weren't able to publish this one. Notes from the team are below and you're very welcome to submit another.",
}

const CTA_LABEL: Record<Decision, string> = {
  approved: 'See it on the site',
  changes_requested: 'Edit my testimonial',
  rejected: 'Write a new testimonial',
}

const CTA_PATH: Record<Decision, string> = {
  approved: '/#voices',
  changes_requested: '/account/profile#testimonial',
  rejected: '/account/profile#testimonial',
}

const Email = ({ name, decision, quote, feedbackNote, siteUrl }: Props) => {
  const url = siteUrl || 'https://fempowerae.com'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{TITLES[decision]}</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <BrandHeader />
          <Heading style={s.h1}>{TITLES[decision]}</Heading>
          <Text style={s.text}>{name ? `Dear ${name},` : 'Hi sister,'} {INTROS[decision]}</Text>

          {quote ? (
            <Section style={{ padding: '14px 18px', backgroundColor: '#FDF8F3', borderRadius: 8, marginTop: 12, marginBottom: 16 }}>
              <Text style={{ ...s.text, margin: 0, fontStyle: 'italic' }}>"{quote}"</Text>
            </Section>
          ) : null}

          {feedbackNote ? (
            <Section style={{ padding: '14px 18px', border: '1px solid #E7D8CC', borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ ...s.text, margin: 0, fontWeight: 600 }}>Note from the team</Text>
              <Text style={{ ...s.text, margin: '6px 0 0 0' }}>{feedbackNote}</Text>
            </Section>
          ) : null}

          <Section style={s.buttonWrap}>
            <Button style={s.button} href={`${url}${CTA_PATH[decision]}`}>
              {CTA_LABEL[decision]}
            </Button>
          </Section>

          <Text style={s.signature}>
            With love,<br />
            The Fempower team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const subject: SubjectFn = (data) => {
  const d = (data?.decision as Decision) || 'approved'
  return TITLES[d]
}

export const template = {
  component: Email,
  subject,
  displayName: 'Testimonial decision',
  previewData: { name: 'Layla', decision: 'changes_requested', quote: 'Fempower helped me...', feedbackNote: 'Could you add a line about the mentor walks?', siteUrl: 'https://fempowerae.com' },
} satisfies TemplateEntry
