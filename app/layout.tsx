import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Holy Child College - 80th Anniversary Frames",
  description: "Create beautiful custom frames to celebrate Holy Child College of Education's 80th Anniversary",
  icons: {
    icon: '/holychildlogo.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased h-full overflow-hidden">
        {children}
      </body>
    </html>
  );
}
