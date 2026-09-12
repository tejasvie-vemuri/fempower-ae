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
  signupUrl?: string
}

const Email = ({ name, eventTitle, signupUrl }: Props) => {
  const url = signupUrl || 'https://fempowerae.com/auth?tab=signup'
  const greeting = name ? `Hi ${name},` : 'Hi sister,'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your details are already filled in — finish your Fempower account</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <BrandHeader />
          <Heading style={s.h1}>Make it official?</Heading>
          <Text style={s.text}>{greeting}</Text>
          <Text style={s.text}>
            You registered as a guest{eventTitle ? ` for ${eventTitle}` : ''} — lovely to have you.
            If you'd like to stay in the circle beyond the event, creating a Fempower account takes
            about a minute. We've pre-filled what you already gave us.
          </Text>
          <Section style={metaBox}>
            <Text style={metaLine}>· Your ticket and future RSVPs in one place</Text>
            <Text style={metaLine}>· The Circle — ask, share, get real answers</Text>
            <Text style={metaLine}>· Member-only events, meetups and resources</Text>
          </Section>
          <Section style={s.buttonWrap}>
            <Button style={s.button} href={url}>
              Finish my account
            </Button>
          </Section>
          <Text style={s.text}>
            No pressure — your event booking stands either way.
          </Text>
          <Text style={s.signature}>
            Warmly,<br />
            The Fempower team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const metaBox = {
  backgroundColor: '#FDF8F3',
  border: '1px solid #EDE4D8',
  borderRadius: '8px',
  padding: '14px 18px',
  margin: '0 0 20px',
}
const metaLine = { fontSize: '14px', color: '#3D3540', margin: '4px 0', lineHeight: '1.5' }

export const template = {
  component: Email,
  subject: 'Your Fempower account is one minute away',
  displayName: 'Guest → account nudge (24h)',
  previewData: {
    name: 'Layla',
    eventTitle: 'The To-Do Room (AI Roundtable)',
    signupUrl: 'https://fempowerae.com/auth?tab=signup',
  },
} satisfies TemplateEntry
