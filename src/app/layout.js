import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "SPSMB Asy-Syadzili - Seleksi Penerimaan Santri & Murid Baru",
  description:
    "Sistem Seleksi Penerimaan Santri dan Murid Baru (SPSMB) Pondok Pesantren Asy-Syadzili. Daftar pondok sekaligus sekolah (SD, SMP, SMA, SMK) secara online, mudah, aman, dan langsung terhubung dengan admin.",
  keywords: [
    "SPSMB Asy-Syadzili",
    "Seleksi Penerimaan Santri Baru",
    "Seleksi Penerimaan Murid Baru",
    "PPDB Asy-Syadzili",
    "Pendaftaran Pondok Pesantren",
    "Pendaftaran Sekolah Asy-Syadzili",
    "PPDB Online",
    "Santri Asy-Syadzili",
    "Pondok Pesantren",
    "PPDB 2025"
  ],
  openGraph: {
    title: "SPSMB Asy-Syadzili - Seleksi Santri & Murid Baru",
    description:
      "Daftar pondok dan sekolah (SD, SMP, SMA, SMK) di Asy-Syadzili secara online. Seleksi santri dan murid baru, proses mudah dan terintegrasi.",
    url: "https://spsmb-santripasir.vercel.app/", // Ganti dengan domain Anda jika sudah custom
    siteName: "SPSMB Asy-Syadzili",
    images: [
      {
        url: "/2.png", // Pastikan logo sudah di folder public
        width: 400,
        height: 400,
        alt: "SPSMB Asy-Syadzili"
      }
    ],
    locale: "id_ID",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "SPSMB Asy-Syadzili - Seleksi Santri & Murid Baru",
    description:
      "Daftar pondok dan sekolah (SD, SMP, SMA, SMK) di Asy-Syadzili secara online. Seleksi santri dan murid baru, proses mudah dan terintegrasi.",
    images: ["/2.png"]
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
