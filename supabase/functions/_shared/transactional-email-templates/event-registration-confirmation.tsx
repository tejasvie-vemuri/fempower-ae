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
  name?: string
  eventTitle?: string
  startsAt?: string
  location?: string
  ticketCode?: string
  quantity?: number
  eventUrl?: string
}

const formatDate = (iso?: string) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Dubai',
      timeZoneName: 'short',
    })
  } catch {
    return iso
  }
}

const Email = ({
  name,
  eventTitle,
  startsAt,
  location,
  ticketCode,
  quantity,
  eventUrl,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're registered for {eventTitle || 'a Fempower event'}</Preview>
    <Body style={s.main}>
      <Container style={s.container}>
        <BrandHeader />
        <Heading style={s.h1}>You're registered</Heading>
        <Text style={s.text}>
          {name ? `Hi ${name}, ` : 'Hi, '}your registration for{' '}
          <strong>{eventTitle || 'this event'}</strong> is confirmed. We can't wait
          to see you there.
        </Text>
        <Section style={s.meta}>
          {startsAt && (
            <Text style={{ margin: 0 }}>
              <strong>When:</strong> {formatDate(startsAt)}
            </Text>
          )}
          {location && (
            <Text style={{ margin: '6px 0 0' }}>
              <strong>Where:</strong> {location}
            </Text>
          )}
          {quantity && quantity > 1 && (
            <Text style={{ margin: '6px 0 0' }}>
              <strong>Tickets:</strong> {quantity}
            </Text>
          )}
          {ticketCode && (
            <Text style={{ margin: '10px 0 0' }}>
              <strong>Ticket code:</strong>{' '}
              <span style={{ fontFamily: 'monospace', color: '#4A2040' }}>{ticketCode}</span>
            </Text>
          )}
        </Section>
        {eventUrl && (
          <Section style={s.buttonWrap}>
            <Button style={s.button} href={eventUrl}>
              View event details
            </Button>
          </Section>
        )}
        <Text style={s.footer}>
          If your plans change, please contact us so another sister can take your spot.
        </Text>
        <Text style={s.signature}>
          Hugs,<br />
          Your sisters
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) =>
    `You're registered for ${data.eventTitle || 'a Fempower event'}`,
  displayName: 'Event registration confirmation',
  previewData: {
    name: 'Layla',
    eventTitle: 'Sunrise Mentor Walk · Kite Beach',
    startsAt: '2026-07-12T06:30:00+04:00',
    location: 'Kite Beach, Dubai',
    ticketCode: 'FEMP-AB12CD',
    quantity: 1,
    eventUrl: 'https://fempowerae.com/events/sunrise-mentor-walk',
  },
} satisfies TemplateEntry
