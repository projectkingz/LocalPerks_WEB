import { Roboto, Roboto_Mono, Fira_Sans } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const roboto = Roboto({ 
  subsets: ['latin'],
  variable: '--font-roboto',
  weight: ['300', '400', '500', '700', '900']
});

const robotoMono = Roboto_Mono({ 
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  weight: ['300', '400', '500', '600', '700']
});

const firaSans = Fira_Sans({ 
  subsets: ['latin'],
  variable: '--font-fira-sans',
  weight: ['300', '400', '500', '600', '700']
});

export const metadata = {
  title: 'LocalPerks - Community Rewards Program',
  description: 'Earn points and rewards when you spend in your community',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${roboto.variable} ${robotoMono.variable} ${firaSans.variable}`}>
      <body className={roboto.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
} 