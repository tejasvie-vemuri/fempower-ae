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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Fempower — confirm your email to join the circle</Preview>
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
        <Heading style={h1}>Welcome, sister</Heading>
        <Text style={text}>
          Thank you for joining <strong>{siteName}</strong> — a community of women in the UAE
          growing, learning, and rising together.
        </Text>
        <Text style={text}>
          Please confirm your email address ({' '}
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          {' '}) to activate your account:
        </Text>
        <Section style={buttonWrap}>
          <Button style={button} href={confirmationUrl}>
            Confirm my email
          </Button>
        </Section>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
        <Text style={signature}>
          Hugs,<br />
          Your sisters
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const signature = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontStyle: 'italic' as const,
  fontSize: '14px',
  color: '#4A2040',
  margin: '32px 0 0',
}
