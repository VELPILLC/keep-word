import "./globals.css";

export const metadata = {
  icons: {
    apple: [{ url: "/apple-touch-icon", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
