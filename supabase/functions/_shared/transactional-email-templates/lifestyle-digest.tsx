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
  preferredName?: string
  assistantName?: string
  siteUrl?: string
  items?: string[]
}

const Email = ({ preferredName, assistantName, siteUrl, items }: Props) => {
  const url = siteUrl || 'https://fempowerae.com'
  const name = preferredName && preferredName !== 'there' ? preferredName : 'there'
  const zoya = assistantName || 'Zoya'
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      </Head>
      <Preview>Here's what's on your plate today</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <BrandHeader />
          <Heading style={s.h1}>Hi {name}, it's {zoya}.</Heading>
          <Text style={s.text}>Here's what I've got for you today, that's all, nothing else needs you right now.</Text>
          <Section>
            {(items ?? []).map((item, i) => (
              <Text style={s.text} key={i}>• {item}</Text>
            ))}
          </Section>
          <Section style={s.buttonWrap}>
            <Button style={s.button} href={`${url}/lifestyle-manager`}>
              Open Lifestyle Manager
            </Button>
          </Section>
          <Text style={s.signature}>
            Talk soon,<br />
            {zoya}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Your day, handled',
  displayName: 'Lifestyle Manager daily digest',
  previewData: {
    preferredName: 'Layla',
    assistantName: 'Zoya',
    siteUrl: 'https://fempowerae.com',
    items: ["Mum's birthday is in 5 days", 'Renew visa reminder due today'],
  },
} satisfies TemplateEntry
