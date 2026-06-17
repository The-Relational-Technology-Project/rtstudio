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
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your link to enter {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Enter the Studio</Heading>
        <Text style={text}>
          Use this private link to enter {siteName}. It works for new and
          returning builders, and expires shortly.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Enter the Studio
        </Button>
        <Text style={footer}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '28px 25px' }
const h1 = {
  fontFamily: 'Fraunces, Georgia, serif',
  fontSize: '24px',
  fontWeight: '700' as const,
  color: 'hsl(20, 30%, 22%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(20, 25%, 48%)',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const button = {
  backgroundColor: 'hsl(16, 55%, 50%)',
  color: 'hsl(30, 45%, 96%)',
  fontSize: '14px',
  borderRadius: '12px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: 'hsl(20, 25%, 48%)', margin: '30px 0 0' }
