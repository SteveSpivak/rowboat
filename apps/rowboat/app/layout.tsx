import "./globals.css";
import { ThemeProvider } from "./providers/theme-provider";
import { Providers } from "./providers";
import { Metadata } from "next";
import { HelpModalProvider } from "./providers/help-modal-provider";
import { Auth0Provider } from "@auth0/nextjs-auth0";
import { USE_AUTH } from "./lib/feature_flags";

export const metadata: Metadata = {
  title: {
    default: "RowBoat labs",
    template: "%s | RowBoat Labs",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <ThemeProvider>
      <body className="h-full text-base [scrollbar-width:thin] bg-background">
        <Providers className='h-full flex flex-col'>
          <HelpModalProvider>
            {children}
          </HelpModalProvider>
        </Providers>
      </body>
    </ThemeProvider>
  );

  return <html lang="en" className="h-dvh">
    {USE_AUTH ? <Auth0Provider>{content}</Auth0Provider> : content}
  </html>;
}
