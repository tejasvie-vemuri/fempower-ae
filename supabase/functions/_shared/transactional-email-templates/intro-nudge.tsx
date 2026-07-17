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
      <Preview>Say hi to your Fempower sisters — a 3-line intro is enough</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <BrandHeader />
          <Heading style={s.h1}>Say hi to your sisters</Heading>
          <Text style={s.text}>{greeting}</Text>
          <Text style={s.text}>
            You joined Fempower two days ago — the community is here and would love to meet you.
          </Text>
          <Text style={s.text}>
            The single most helpful thing you can do this week is post a short introduction in the Circle. Three lines is plenty:
          </Text>
          <Section style={metaBox}>
            <Text style={metaLine}>· Who you are + where you're from</Text>
            <Text style={metaLine}>· What you're working on right now</Text>
            <Text style={metaLine}>· One way a sister could support you</Text>
          </Section>
          <Section style={s.buttonWrap}>
            <Button style={s.button} href={`${url}/circle?compose=intro&ref=intro-nudge`}>
              Write my intro
            </Button>
          </Section>
          <Text style={s.text}>
            You'll be surprised how quickly other sisters reply — every one of us was once the new woman in the room.
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
  subject: 'Say hi to your Fempower sisters',
  displayName: 'Introduce yourself nudge',
  previewData: { name: 'Layla', siteUrl: 'https://fempowerae.com' },
} satisfies TemplateEntry
