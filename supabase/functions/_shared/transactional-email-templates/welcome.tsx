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
  const greeting = name ? `Hi ${name},` : 'Hi sister,'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to Fempower — rooted together, rising together</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <BrandHeader />
          <Heading style={s.h1}>Welcome to Fempower</Heading>
          <Text style={s.text}>{greeting}</Text>
          <Text style={s.text}>
            Thank you for joining the Fempower community — a sisterhood of women
            in the UAE rooted together and rising together. We're so glad you're here.
          </Text>
          <Text style={s.text}>
            Your next step is to complete your member profile so the community
            can find and connect with you. Once your membership is reviewed and
            approved, you'll unlock the directory, the Circle, and our
            members-only events.
          </Text>
          <Section style={s.buttonWrap}>
            <Button style={s.button} href={`${url}/account/profile`}>
              Complete your profile
            </Button>
          </Section>
          <Text style={s.text}>
            In the meantime, explore upcoming events and resources at{' '}
            <a href={url} style={{ color: '#4A2040' }}>fempowerae.com</a>.
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

export const template = {
  component: Email,
  subject: 'Welcome to Fempower',
  displayName: 'Welcome (new signup)',
  previewData: { name: 'Layla', siteUrl: 'https://fempowerae.com' },
} satisfies TemplateEntry
