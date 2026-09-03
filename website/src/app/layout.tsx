import "./globals.css";
import { Space_Mono, Rubik } from "next/font/google";
import { PROJECT_CONFIG } from "@/config";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const rubik = Rubik({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: PROJECT_CONFIG.meta.title,
  description: PROJECT_CONFIG.meta.description,
  keywords: PROJECT_CONFIG.meta.keywords,
  authors: [{ name: PROJECT_CONFIG.meta.author }],
  openGraph: {
    title: PROJECT_CONFIG.meta.title,
    description: PROJECT_CONFIG.meta.description,
    url: PROJECT_CONFIG.meta.url,
    siteName: PROJECT_CONFIG.brand.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: PROJECT_CONFIG.meta.title,
    description: PROJECT_CONFIG.meta.description,
    creator: `@${PROJECT_CONFIG.brand.handle}`,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2F8FC" },
    { media: "(prefers-color-scheme: dark)", color: "#24221f" },
  ],
};

const themeInitScript = `
(function(){
  try {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceMono.variable} ${rubik.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Font Awesome 6.5.1 Kit */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/brands.min.css"
          integrity="sha512-8RxmFOVaKQe/xtg6lbscU9DU0IRhURWEuiI0tXevv+lXbAHfkpamD4VKFQRto9WgfOJDwOZ74c/s9Yesv3VvIQ=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>
        <div className="grain-overlay" aria-hidden="true" />
        <Header />
        <main className="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
