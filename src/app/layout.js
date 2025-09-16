import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "Pendaftaran Santri Baru Asy-Syadzili",
  description: "Sistem Pendaftaran Santri Baru Pondok Pesantren Asy-Syadzili",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={poppins.variable}>
        {children}
      </body>
    </html>
  );
}
