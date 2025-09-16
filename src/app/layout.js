import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "Pendaftaran Santri Baru Asy-Syadzili",
  description:
    "Daftar santri baru Pondok Pesantren Asy-Syadzili secara online. Mudah, aman, dan langsung terhubung dengan admin. Dapatkan informasi pendaftaran, syarat, dan proses seleksi terbaru.",
  keywords: [
    "PPDB Asy-Syadzili",
    "Pendaftaran Santri Baru",
    "Pesantren Asy-Syadzili",
    "PPDB Online",
    "Santri Asy-Syadzili",
    "Pondok Pesantren",
    "Pendaftaran Pesantren",
    "PPDB 2025"
  ],
  openGraph: {
    title: "Pendaftaran Santri Baru Asy-Syadzili",
    description:
      "Daftar santri baru Pondok Pesantren Asy-Syadzili secara online. Mudah, aman, dan langsung terhubung dengan admin.",
    url: "https://spmb-santripasir.vercel.app/", // Ganti dengan domain Anda jika sudah custom
    siteName: "PPDB Asy-Syadzili",
    images: [
      {
        url: "/1.png", // Pastikan logo sudah di folder public
        width: 400,
        height: 400,
        alt: "Logo Asy-Syadzili"
      }
    ],
    locale: "id_ID",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Pendaftaran Santri Baru Asy-Syadzili",
    description:
      "Daftar santri baru Pondok Pesantren Asy-Syadzili secara online. Mudah, aman, dan langsung terhubung dengan admin.",
    images: ["/1.png"]
  }
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
