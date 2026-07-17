/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandHeader, styles as s } from './_brand.tsx'

interface DigestEvent {
  title?: string
  slug?: string
  starts_at?: string
  emirate?: string | null
  url?: string
}
interface DigestPost {
  id?: string
  topic_label?: string
  excerpt?: string
  author?: string
  url?: string
}
interface DigestMember {
  id?: string
  name?: string
  role?: string
  city?: string
  url?: string
}
interface Props {
  name?: string
  siteUrl?: string
  event?: DigestEvent | null
  post?: DigestPost | null
  member?: DigestMember | null
}

const formatWhen = (iso?: string) => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

const Email = ({ name, siteUrl, event, post, member }: Props) => {
  const url = siteUrl || 'https://fempowerae.com'
  const greeting = name ? `Hi ${name},` : 'Hi sister,'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Three small ways to connect with your Fempower sisters this week</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <BrandHeader />
          <Heading style={s.h1}>Your Fempower week</Heading>
          <Text style={s.text}>{greeting}</Text>
          <Text style={s.text}>
            Three small ways to feel more rooted — and rise — this week.
          </Text>

          {event && event.title && event.url && (
            <Section style={cardStyle}>
              <Text style={cardEyebrow}>An event for you</Text>
              <Text style={cardTitle}>{event.title}</Text>
              <Text style={cardMeta}>
                {formatWhen(event.starts_at)}
                {event.emirate ? ` · ${event.emirate}` : ''}
              </Text>
              <Section style={{ margin: '10px 0 0' }}>
                <Button style={cardButton} href={event.url}>
                  Reserve your spot
                </Button>
              </Section>
            </Section>
          )}

          {post && post.excerpt && post.url && (
            <Section style={cardStyle}>
              <Text style={cardEyebrow}>A Circle post that needs your voice</Text>
              <Text style={cardTitle}>{post.topic_label ?? 'From the Circle'}</Text>
              <Text style={cardExcerpt}>“{post.excerpt}”</Text>
              <Section style={{ margin: '10px 0 0' }}>
                <Button style={cardButton} href={post.url}>
                  Reply with kindness
                </Button>
              </Section>
            </Section>
          )}

          {member && member.name && member.url && (
            <Section style={cardStyle}>
              <Text style={cardEyebrow}>A sister to meet</Text>
              <Text style={cardTitle}>{member.name}</Text>
              <Text style={cardMeta}>
                {[member.role, member.city].filter(Boolean).join(' · ') || 'A new sister nearby'}
              </Text>
              <Section style={{ margin: '10px 0 0' }}>
                <Button style={cardButton} href={member.url}>
                  Say hello
                </Button>
              </Section>
            </Section>
          )}

          {!event && !post && !member && (
            <Text style={s.text}>
              Things are quiet on the platform this week — pop into the community and start a conversation. Someone is waiting to be heard.
            </Text>
          )}

          <Hr style={{ borderColor: '#EDE4D8', margin: '28px 0' }} />

          <Text style={s.text}>
            Come back anytime at{' '}
            <a href={url} style={s.link}>fempowerae.com</a>.
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

const cardStyle = {
  border: '1px solid #EDE4D8',
  borderRadius: '10px',
  padding: '18px 20px',
  margin: '0 0 16px',
  backgroundColor: '#FDF8F3',
}
const cardEyebrow = {
  fontSize: '11px',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  color: '#D4A853',
  margin: '0 0 6px',
  fontWeight: 'bold' as const,
}
const cardTitle = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '18px',
  color: '#4A2040',
  margin: '0 0 6px',
  lineHeight: '1.3',
}
const cardMeta = { fontSize: '13px', color: '#8A7E8E', margin: '0 0 4px' }
const cardExcerpt = {
  fontSize: '14px',
  fontStyle: 'italic' as const,
  color: '#3D3540',
  lineHeight: '1.5',
  margin: '4px 0 0',
}
const cardButton = {
  backgroundColor: '#4A2040',
  color: '#FDF8F3',
  fontSize: '13px',
  borderRadius: '6px',
  padding: '10px 20px',
  textDecoration: 'none',
  fontWeight: '500' as const,
}

export const template = {
  component: Email,
  subject: 'Your Fempower week — 3 small ways to connect',
  displayName: 'Weekly personalised digest',
  previewData: {
    name: 'Layla',
    siteUrl: 'https://fempowerae.com',
    event: {
      title: 'Sunset Mentor Walk — La Mer',
      slug: 'mentor-walk-la-mer',
      starts_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      emirate: 'Dubai',
      url: 'https://fempowerae.com/events/mentor-walk-la-mer?ref=digest&slot=event',
    },
    post: {
      id: 'preview',
      topic_label: 'Career',
      excerpt: 'How do you build a professional reputation here when you know nobody?',
      url: 'https://fempowerae.com/circle?ref=digest&slot=circle',
    },
    member: {
      id: 'preview',
      name: 'Aisha K.',
      role: 'Product Designer',
      city: 'Abu Dhabi',
      url: 'https://fempowerae.com/directory?ref=digest&slot=member',
    },
  },
} satisfies TemplateEntry
