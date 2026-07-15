import { project } from "@/projectInfo";
import NextAuthProvider from "@/components/NextAuthProvider";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: project.title,
  description: project.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-900">
      <body
        className={`${inter.className} h-full text-slate-100 antialiased`}
        suppressHydrationWarning
      >
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
