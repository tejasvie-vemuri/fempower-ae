/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Column, Img, Row, Section, Text } from 'npm:@react-email/components@0.0.22'

const LOGO_URL =
  'https://uaiymunelgvvnznkxeik.supabase.co/storage/v1/object/public/site-images/email%2Ffempower-logo.png'

export const BrandHeader = () => (
  <Section style={brandBar}>
    <Row>
      <Column style={logoCol}>
        <Img src={LOGO_URL} alt="Fempower" width="56" height="56" style={logoImg} />
      </Column>
      <Column>
        <Text style={brandMark}>FEMPOWER</Text>
        <Text style={brandTagline}>Rooted Together, Rising Together</Text>
      </Column>
    </Row>
  </Section>
)

export const styles = {
  main: { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Helvetica, Arial, sans-serif" },
  container: { padding: '32px 28px', maxWidth: '560px' },
  h1: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '28px',
    fontWeight: 'bold' as const,
    color: '#4A2040',
    margin: '0 0 20px',
  },
  text: { fontSize: '15px', color: '#3D3540', lineHeight: '1.6', margin: '0 0 18px' },
  link: { color: '#4A2040', textDecoration: 'underline' },
  buttonWrap: { margin: '28px 0' },
  button: {
    backgroundColor: '#4A2040',
    color: '#FDF8F3',
    fontSize: '15px',
    borderRadius: '8px',
    padding: '14px 28px',
    textDecoration: 'none',
    fontWeight: '500' as const,
  },
  footer: { fontSize: '13px', color: '#8A7E8E', margin: '24px 0 0', lineHeight: '1.5' },
  signature: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontStyle: 'italic' as const,
    fontSize: '14px',
    color: '#4A2040',
    margin: '32px 0 0',
  },
  meta: {
    backgroundColor: '#FDF8F3',
    border: '1px solid #EDE4D8',
    borderRadius: '8px',
    padding: '16px 18px',
    margin: '0 0 24px',
    fontSize: '14px',
    color: '#3D3540',
    lineHeight: '1.7',
  },
}

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
