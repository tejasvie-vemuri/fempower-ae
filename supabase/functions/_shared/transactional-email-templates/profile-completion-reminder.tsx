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
  missingFields?: string[]
}

const Email = ({ name, siteUrl, missingFields }: Props) => {
  const url = siteUrl || 'https://fempowerae.com'
  const greeting = name ? `Hi ${name},` : 'Hi sister,'
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      </Head>
        <Preview>You're in 🦋💛 let the community find you</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <BrandHeader />
          <Heading style={s.h1}>{`You're in 🦋💛 let sisters find you`}</Heading>
          <Text style={s.text}>{greeting}</Text>
          <Text style={s.text}>
            Welcome to the Fempower community. Your membership is approved, and
            the directory is now open to you.
          </Text>
          <Text style={s.text}>
            A complete profile makes it easier for other women to discover and
            connect with you — through your role, city, interests, and what
            you're looking for. It only takes a few minutes.
          </Text>
          {missingFields && missingFields.length > 0 && (
            <Text style={s.text}>
              <strong>Still to add:</strong> {missingFields.join(', ')}.
            </Text>
          )}
          <Section style={s.buttonWrap}>
            <Button style={s.button} href={`${url}/account/profile`}>
              Complete your profile
            </Button>
          </Section>
          <Text style={s.text}>
            Once you're done, head to the{' '}
            <a href={`${url}/directory`} style={{ color: '#4A2040' }}>
              member directory
            </a>{' '}
            to start connecting.
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
  subject: 'Complete your Fempower profile',
  displayName: 'Profile completion reminder (1h after approval)',
  previewData: {
    name: 'Layla',
    siteUrl: 'https://fempowerae.com',
    missingFields: ['photo', 'bio', 'expertise'],
  },
} satisfies TemplateEntry
