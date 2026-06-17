/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
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
    <Preview>Enter {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Enter the Studio</Heading>
        <Text style={text}>
          Use this private link to enter{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          .
        </Text>
        <Text style={text}>
          This link is for (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) and will create your account automatically if this is your first
          time here.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Enter the Studio
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(16, 55%, 50%)',
  color: 'hsl(30, 45%, 96%)',
  fontSize: '14px',
  borderRadius: '12px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: 'hsl(20, 25%, 48%)', margin: '30px 0 0' }
