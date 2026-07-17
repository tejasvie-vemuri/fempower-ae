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
  personalNote?: string | null
  siteUrl?: string
}

const Email = ({ name, personalNote, siteUrl }: Props) => {
  const url = siteUrl || 'https://fempowerae.com'
  const greeting = name ? `Hi ${name},` : 'Hi sister,'
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      </Head>
      <Preview>We'd love to put you in the spotlight 🦋💛</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <BrandHeader />
          <Heading style={s.h1}>You're getting the spotlight ✨</Heading>
          <Text style={s.text}>{greeting}</Text>
          <Text style={s.text}>
            We'd love to share your story with the FemPower community — the wins, the turning
            points, the moments that made a difference.
          </Text>
          {personalNote && (
            <Section style={{ ...s.text, borderLeft: '3px solid #4A2040', paddingLeft: 16, margin: '20px 0' }}>
              <Text style={{ ...s.text, fontStyle: 'italic', margin: 0 }}>"{personalNote}"</Text>
            </Section>
          )}
          <Text style={s.text}>
            We've put together a short guided form — six quick prompts, about 5 minutes — to help
            you tell it in your own words.
          </Text>
          <Section style={s.buttonWrap}>
            <Button style={s.button} href={`${url}/share-my-story`}>
              Share my story
            </Button>
          </Section>
          <Text style={s.signature}>
            Warmly,<br />
            The Fempower team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: "We'd love to put you in the spotlight 🦋💛",
  displayName: 'Spotlight story request (admin-initiated)',
  previewData: {
    name: 'Layla',
    personalNote: 'Your career pivot this year would inspire so many of us.',
    siteUrl: 'https://fempowerae.com',
  },
} satisfies TemplateEntry
