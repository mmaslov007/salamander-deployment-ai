'use client';

import Link from 'next/link';
import { ThemeProvider, createTheme, CssBaseline, Container, Box, Typography, Link as MuiLink } from '@mui/material';

// custom theme using MUI's createTheme function
const theme = createTheme({
  typography: {
    h1: { fontWeight: 'bold', fontSize: '2rem' },  // style for h1 elements
    h2: { fontWeight: 600, fontSize: '1.5rem' },  // style for h2 elements
    body1: { fontSize: '1rem', lineHeight: 1.6 },  // style for body text
  },
  palette: {
    primary: { main: '#6200ea' },  // primary color (purple)
    secondary: { main: '#03dac6' },  // secondary color (teal)
    background: { default: '#f5f5f5' },  // background color (light gray)
    text: { primary: '#333', secondary: '#555' },  // primary and secondary text colors
  },
  components: {
    // styling overrides for Material-UI components
    MuiLink: {
      styleOverrides: {
        root: {
          fontWeight: 'bold',  // bold font for links
          textDecoration: 'none',  // remove underline from links
          transition: 'color 0.3s ease',  // smooth color transition on hover
          '&:hover': { color: '#81c784' },  // change color on hover
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          padding: '2rem',  // padding inside the container
          maxWidth: '1200px',  // maximum container width
        },
      },
    },
  },
});

// the root layout component, wraps all children content
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Salamander Tracker</title>
        <meta name="description" content="Track salamanders with computer vision." />
        <link rel="icon" href="/favicon.png" />
      </head>

      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />

          {/* Header */}
          <Box component="header" sx={{ bgcolor: '#000', py: 2, px: 3 }}>
            <Container sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h1" sx={{ fontSize: '2em', color: '#fff', fontWeight: 'bold' }}>
                Salamander Tracker HM
              </Typography>

              <Box>
                <MuiLink component={Link} href="/" sx={{ fontSize: '1.5em', color: '#fff', mr: '2.5rem' }}>
                  HOME
                </MuiLink>
                <MuiLink component={Link} href="/videos" sx={{ fontSize: '1.5em', color: '#fff', mr: '2.5rem' }}>
                  VIDEOS
                </MuiLink>
              </Box>
            </Container>
          </Box>

          {/* Main */}
          <main>
            <Container>
              <Box sx={{ bgcolor: '#fff', p: 4, borderRadius: 2, boxShadow: 3, mt: 3, minHeight: '80vh' }}>
                {children}
              </Box>
            </Container>
          </main>

          {/* Footer */}
          <Box component="footer" sx={{ bgcolor: '#000', py: 2, px: 3, mt: 4 }}>
            <Container>
              <Typography variant="body2" sx={{ color: '#fff', textAlign: 'center' }}>
                © 2025 Salamander Tracker HM. All rights reserved.
              </Typography>
            </Container>
          </Box>

        </ThemeProvider>
      </body>
    </html>
  );
}