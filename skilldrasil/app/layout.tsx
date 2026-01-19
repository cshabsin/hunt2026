import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skilldrasil",
  description: "PoE Skill Tree Renderer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a
          href="/hunt2026/"
          style={{
            position: "fixed",
            top: "10px",
            left: "10px",
            zIndex: 9999,
            textDecoration: "none",
            fontSize: "24px",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            color: "#333",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            border: "1px solid #ccc",
          }}
          title="Back to Hunt 2026"
        >
          ←
        </a>
        {children}
      </body>
    </html>
  );
}
