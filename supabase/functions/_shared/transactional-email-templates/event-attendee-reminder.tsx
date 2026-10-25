import * as React from 'npm:react@18.3.1';
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22';
import type { TemplateEntry } from './registry.ts';
import { BrandHeader, styles as s } from './_brand.tsx';
import { formatEventDate } from './event-registration-confirmation.tsx';

interface Props { name?: string; eventTitle?: string; startsAt?: string; timezone?: string; location?: string; ticketCode?: string; quantity?: number; eventUrl?: string }
const Email = ({ name, eventTitle, startsAt, timezone, location, ticketCode, quantity, eventUrl }: Props) => (
  <Html lang="en"><Head /><Preview>Your event is coming up: {eventTitle}</Preview>
    <Body style={s.main}><Container style={s.container}><BrandHeader />
      <Heading style={s.h1}>See you soon</Heading>
      <Text style={s.text}>{name ? `Hi ${name},` : 'Hi,'} a quick reminder that you’re booked for <strong>{eventTitle || 'your Fempower event'}</strong>.</Text>
      <Section style={s.meta}>
        <Text><strong>When:</strong> {formatEventDate(startsAt, timezone)}</Text>
        {location && <Text><strong>Where:</strong> {location}</Text>}
        {ticketCode && <Text><strong>Ticket code:</strong> {ticketCode}</Text>}
        <Text><strong>Tickets:</strong> {quantity || 1}</Text>
      </Section>
      <Section style={s.buttonWrap}><Button style={s.button} href={eventUrl || 'https://fempowerae.com/events'}>View event details</Button></Section>
      <Text style={s.text}>Keep your ticket code handy, and check the event page for any preparation or venue details.</Text>
      <Text style={s.signature}>See you there,<br />The Fempower team</Text>
    </Container></Body>
  </Html>
);
export const template = { component: Email, subject: (data: Record<string, unknown>) => `Coming up: ${data.eventTitle || 'your Fempower event'}`, displayName: 'Event attendee reminder', previewData: { name: 'Layla', eventTitle: 'Builders Roundtable 09 — The Agent Room', startsAt: '2026-11-07T06:00:00Z', timezone: 'Asia/Dubai', location: 'Raw Coffee Company, Dubai', ticketCode: 'FEMP-AB12CD', quantity: 1, eventUrl: 'https://fempowerae.com/events/builders-roundtable-09-the-agent-room' } } satisfies TemplateEntry;