/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandHeader, styles as s } from './_brand.tsx'

interface Row { label: string; value: string }
interface Props {
  eventTitle?: string
  eventWhen?: string
  attendeeName?: string
  memberStatus?: string
  details?: Row[]
  answers?: Row[]
  guests?: Row[]
  payment?: Row[]
}

const Block = ({ title, rows }: { title: string; rows?: Row[] }) =>
  rows && rows.length ? (
    <Section style={s.meta}>
      <Text style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#4A2040' }}>{title}</Text>
      {rows.map((r, i) => (
        <Text key={i} style={{ margin: '4px 0 0' }}><strong>{r.label}:</strong> {r.value || '—'}</Text>
      ))}
    </Section>
  ) : null

const Email = ({ eventTitle = 'an event', eventWhen, attendeeName = 'Someone', memberStatus, details, answers, guests, payment }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${attendeeName} registered for ${eventTitle}`}</Preview>
    <Body style={s.main}>
      <Container style={s.container}>
        <BrandHeader />
        <Heading style={s.h1}>New registration</Heading>
        <Text style={s.text}>
          <strong>{attendeeName}</strong> ({memberStatus || 'unknown'}) registered for <strong>{eventTitle}</strong>{eventWhen ? ` on ${eventWhen}` : ''}.
        </Text>
        <Block title="Attendee" rows={details} />
        <Block title="Payment" rows={payment} />
        <Block title="Booking answers" rows={answers} />
        <Block title="Extra guests" rows={guests} />
        <Text style={s.footer}>You're receiving this because you're the Fempower admin.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  to: 'tejasvie59@gmail.com',
  subject: (d: Record<string, unknown>) => `New registration: ${d.attendeeName || 'Someone'} — ${d.eventTitle || 'event'}`,
  displayName: 'Admin: new event registration',
  previewData: {
    eventTitle: 'What am I beneath the roles?', eventWhen: 'Sun 15 Nov, 11:00 AM', attendeeName: 'Layla', memberStatus: 'Fempower member',
    details: [{ label: 'Email', value: 'layla@example.com' }, { label: 'WhatsApp', value: '+971 50 123 4567' }],
    payment: [{ label: 'Paid', value: 'AED 26.10' }, { label: 'Coupon', value: 'AGENT10 (−AED 2.90)' }],
    answers: [{ label: 'heard about us', value: 'WhatsApp community' }],
  },
} satisfies TemplateEntry
