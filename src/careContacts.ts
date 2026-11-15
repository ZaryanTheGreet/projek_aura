// Daftar kontak bantuan darurat & psikologis
// TODO: verifikasi nomor resmi terbaru sebelum rilis ke publik

export interface CareContact {
  id: string;
  name: string;
  category: string;
  contact: string;
  displayContact: string;
  availability: string;
  description: string;
  verified: boolean;
}

export const CARE_CONTACTS: CareContact[] = [
  {
    id: 'sejiwa',
    name: 'Layanan SEJIWA (Kemenkes RI)',
    category: 'Krisis & Bantuan Emosional',
    contact: 'tel:119,8',
    displayContact: '119 (ekstensi 8)',
    availability: '24 jam, bebas pulsa',
    description: 'Layanan dukungan psikologis resmi dari Kementerian Kesehatan RI.',
    verified: true,
  },
  {
    id: 'yayasan_pulih',
    name: 'Yayasan Pulih',
    category: 'Konseling Trauma & Stres',
    contact: 'https://wa.me/628118436633',
    displayContact: '+62 811 8436 633 (WhatsApp)',
    availability: 'Senin - Jumat, jam kerja',
    description: 'Lembaga nirlaba penyedia layanan konseling dan pemulihan trauma.',
    verified: true,
  },
  {
    id: 'lisa',
    name: 'LISA Suicide Prevention Hotline',
    category: 'Pencegahan Krisis & Pendampingan',
    contact: 'tel:081119940010',
    displayContact: '0811-1994-0010 (Bahasa Indonesia)',
    availability: '24 jam setiap hari',
    description: 'Pendampingan darurat bagi siapa pun yang membutuhkan teman bicara saat krisis.',
    verified: true,
  },
  {
    id: 'eap_guidance',
    name: 'Layanan Konseling Karyawan (EAP)',
    category: 'Internal Perusahaan',
    contact: '',
    displayContact: 'Hubungi People / HR tim kantormu',
    availability: 'Sesuai ketentuan kantor',
    description: 'Banyak perusahaan menyediakan Employee Assistance Program gratis dan rahasia bagi staf.',
    verified: true,
  },
];
