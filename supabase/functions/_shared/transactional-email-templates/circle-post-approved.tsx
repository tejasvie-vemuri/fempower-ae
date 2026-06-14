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
  postUrl?: string
  topic?: string
  snippet?: string
}

const Email = ({ name, postUrl, topic, snippet }: Props) => {
  const url = postUrl || 'https://fempowerae.com/circle'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your Circle post has been approved</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <BrandHeader />
          <Heading style={s.h1}>Your post is live</Heading>
          <Text style={s.text}>
            {name ? `Hi ${name}, ` : 'Hi, '}your post in the Circle has been approved
            and is now visible to other members.
          </Text>
          {(topic || snippet) && (
            <Section style={s.meta}>
              {topic && <Text style={{ margin: 0, fontWeight: 600 }}>Topic: {topic}</Text>}
              {snippet && <Text style={{ margin: '6px 0 0' }}>"{snippet}"</Text>}
            </Section>
          )}
          <Section style={s.buttonWrap}>
            <Button style={s.button} href={url}>
              View your post
            </Button>
          </Section>
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
  subject: 'Your Circle post is now live',
  displayName: 'Circle post approved',
  previewData: {
    name: 'Layla',
    topic: 'Career',
    snippet: 'Has anyone navigated a career pivot in their 30s?',
    postUrl: 'https://fempowerae.com/circle',
  },
} satisfies TemplateEntry
