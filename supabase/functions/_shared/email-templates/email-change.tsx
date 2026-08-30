/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Row>
            <Column style={logoCol}>
              <Img src="https://uaiymunelgvvnznkxeik.supabase.co/storage/v1/object/public/site-images/email%2Ffempower-logo.png" alt="Fempower" width="56" height="56" style={logoImg} />
            </Column>
            <Column>
              <Text style={brandMark}>FEMPOWER</Text>
              <Text style={brandTagline}>Rooted Together, Rising Together</Text>
            </Column>
          </Row>
        </Section>
        <Heading style={h1}>Confirm your email change</Heading>
        <Text style={text}>
          You requested to change your email for <strong>{siteName}</strong> from{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>{oldEmail}</Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Section style={buttonWrap}>
          <Button style={button} href={confirmationUrl}>
            Confirm email change
          </Button>
        </Section>
        <Text style={footer}>
          If you didn't request this, please secure your account immediately.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Helvetica, Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brandBar = { borderBottom: '1px solid #EDE4D8', paddingBottom: '20px', marginBottom: '28px' }
const logoCol = { width: '70px', verticalAlign: 'middle' as const }
const logoImg = { display: 'block', borderRadius: '6px' }
const brandMark = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '20px',
  letterSpacing: '4px',
  color: '#4A2040',
  margin: '0',
  fontWeight: 'bold' as const,
}
const brandTagline = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '12px',
  fontStyle: 'italic' as const,
  color: '#D4A853',
  margin: '4px 0 0',
}
const h1 = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#4A2040',
  margin: '0 0 20px',
}
const text = { fontSize: '15px', color: '#3D3540', lineHeight: '1.6', margin: '0 0 18px' }
const link = { color: '#4A2040', textDecoration: 'underline' }
const buttonWrap = { margin: '28px 0' }
const button = {
  backgroundColor: '#4A2040',
  color: '#FDF8F3',
  fontSize: '15px',
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
  fontWeight: '500' as const,
}
const footer = { fontSize: '13px', color: '#8A7E8E', margin: '24px 0 0', lineHeight: '1.5' }
