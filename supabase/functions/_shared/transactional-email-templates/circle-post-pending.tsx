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
import type { TemplateEntry } from './registry.ts'
import { BrandHeader, styles as s } from './_brand.tsx'

interface Props {
  authorName?: string
  topic?: string
  snippet?: string
  riskLevel?: string
  moderationUrl?: string
}

const Email = ({ authorName, topic, snippet, riskLevel, moderationUrl }: Props) => {
  const url = moderationUrl || 'https://fempowerae.com/admin/circle'
  const isHighRisk = riskLevel === 'high'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>A Circle post needs your review</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <BrandHeader />
          <Heading style={s.h1}>
            {isHighRisk ? 'Urgent: post needs review' : 'A post is pending review'}
          </Heading>
          <Text style={s.text}>
            A new Circle post is awaiting moderator approval
            {isHighRisk ? ' and has been flagged as high risk' : ''}.
          </Text>
          <Section style={s.meta}>
            {authorName && <Text style={{ margin: 0 }}><strong>Author:</strong> {authorName}</Text>}
            {topic && <Text style={{ margin: '6px 0 0' }}><strong>Topic:</strong> {topic}</Text>}
            {riskLevel && (
              <Text style={{ margin: '6px 0 0' }}>
                <strong>Risk:</strong>{' '}
                <span style={{ color: isHighRisk ? '#B23A48' : '#3D3540' }}>{riskLevel}</span>
              </Text>
            )}
            {snippet && <Text style={{ margin: '10px 0 0', fontStyle: 'italic' }}>"{snippet}"</Text>}
          </Section>
          <Section style={s.buttonWrap}>
            <Button style={s.button} href={url}>
              Open moderation queue
            </Button>
          </Section>
          <Text style={s.footer}>
            You're receiving this because you're an admin on Fempower.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) =>
    data.riskLevel === 'high'
      ? 'Urgent: Circle post needs review'
      : 'New Circle post pending review',
  displayName: 'Circle post pending review',
  previewData: {
    authorName: 'Layla',
    topic: 'Career',
    riskLevel: 'none',
    snippet: 'Has anyone navigated a career pivot in their 30s?',
    moderationUrl: 'https://fempowerae.com/admin/circle',
  },
} satisfies TemplateEntry
