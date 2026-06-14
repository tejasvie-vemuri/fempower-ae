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
  siteUrl?: string
}

const Email = ({ name, siteUrl }: Props) => {
  const url = siteUrl || 'https://fempowerae.com'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to the circle — your Fempower membership is approved</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <BrandHeader />
          <Heading style={s.h1}>You're in, sister</Heading>
          <Text style={s.text}>
            {name ? `Dear ${name}, your` : 'Your'} Fempower membership has been approved.
            You can now access the full directory, join the Circle, and RSVP to our
            members-only events.
          </Text>
          <Section style={s.buttonWrap}>
            <Button style={s.button} href={`${url}/directory`}>
              Explore the community
            </Button>
          </Section>
          <Text style={s.text}>
            Take a moment to complete your member profile — it's how other sisters
            will find and connect with you.
          </Text>
          <Text style={s.signature}>
            Hugs,<br />
            Your sisters
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: "You're in — welcome to Fempower",
  displayName: 'Membership approved',
  previewData: { name: 'Layla', siteUrl: 'https://fempowerae.com' },
} satisfies TemplateEntry
