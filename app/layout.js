// ============================================
// DSRT WAE — Root Layout
// Wraps every page with dark theme + metadata
// ============================================

import "./globals.css";

// Site metadata (shows in browser tab + SEO)
export const metadata = {
  title: "DSRT WAE — World AI Engine",
  description: 
    "Deep Strategic Real-Time World AI Engine. " +
    "Monitoring global events, geopolitics, and " +
    "world affairs 24/7.",
  keywords: [
    "geopolitics", "world news", "AI", 
    "intelligence", "real-time", "global events"
  ],
  // When someone shares the link
  openGraph: {
    title: "DSRT WAE — World AI Engine",
    description: "Real-time global intelligence engine",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    // Force dark mode always
    <html lang="en" className="dark">
      <head>
        {/* Favicon: globe emoji */}
        <link 
          rel="icon" 
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌍</text></svg>" 
        />
      </head>
      <body 
        className="bg-wae-bg text-wae-text min-h-screen font-mono antialiased"
      >
        {/* 
          children = whatever page.js renders
          All pages automatically get this wrapper
        */}
        {children}
      </body>
    </html>
  );
}