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
  personalNote?: string
  siteUrl?: string
}

const Email = ({ name, personalNote, siteUrl }: Props) => {
  const url = siteUrl || 'https://fempowerae.com'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Would you share your Fempower story?</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <BrandHeader />
          <Heading style={s.h1}>We'd love to hear your story</Heading>
          <Text style={s.text}>
            {name ? `Dear ${name},` : 'Hi sister,'} your voice matters to this community.
            We'd be honoured if you'd share a short testimonial about what
            Fempower has meant to you — it helps other women see themselves in
            this circle.
          </Text>
          {personalNote ? (
            <Section style={{ ...s.buttonWrap, padding: '12px 16px', backgroundColor: '#FDF8F3', borderRadius: 8, marginTop: 12, marginBottom: 12 }}>
              <Text style={{ ...s.text, margin: 0, fontStyle: 'italic' }}>
                "{personalNote}"
              </Text>
            </Section>
          ) : null}
          <Text style={s.text}>
            It takes a minute — a line or two is perfect. Your first name is the
            only thing shown publicly.
          </Text>
          <Section style={s.buttonWrap}>
            <Button style={s.button} href={`${url}/account/profile#testimonial`}>
              Share my testimonial
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

export const template = {
  component: Email,
  subject: 'Would you share your Fempower story?',
  displayName: 'Testimonial request',
  previewData: { name: 'Layla', personalNote: 'Your energy at the last walk was contagious!', siteUrl: 'https://fempowerae.com' },
} satisfies TemplateEntry
