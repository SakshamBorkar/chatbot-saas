import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chatbot SaaS",
  description: "Embeddable AI chatbot",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}

