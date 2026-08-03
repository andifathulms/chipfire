# Chipfire

Chain Reaction: permainan strategi grid dengan ledakan berantai. Hotseat, lawan AI, dan
multiplayer peer-to-peer lewat WebRTC. Situs statis, tanpa backend.

> *chipfire* — dari **chip-firing game**, nama teori graf untuk mekanik ini: sebuah simpul
> *menembak* ketika chip yang dipegangnya mencapai jumlah tetangganya, mengirim satu chip ke
> tiap sisi. Persis `applyMove`.

Secara formal permainan ini adalah **abelian sandpile model** (Dhar 1990, di atas
Bak–Tang–Wiesenfeld 1987) dengan penguasaan wilayah di atasnya. Dua aturan yang paling mudah
salah di implementasi Chain Reaction justru adalah sifat pendefinisi model itu:

- sel yang meledak **mengurangi** massa kritisnya, bukan dikosongkan — itu aturan *toppling*;
- massa kritis sebuah sel **adalah** jumlah tetangganya — itu *degree* simpul.

Rentetan ledakan punya nama resmi di literatur itu: **avalanche**.

## Aturan

1. Taruh satu orb di sel kosong atau sel milikmu.
2. Setiap sel punya **massa kritis** = jumlah tetangga ortogonalnya (2 di sudut, 3 di tepi,
   4 di tengah). Saat tercapai, sel meledak: satu orb ke tiap tetangga, dan setiap sel yang
   menerima orb berpindah kepemilikan ke pemain yang meledak.
3. Ledakan bisa memicu ledakan lain. Menang bila semua orb di papan milikmu.

## Status

Hotseat, lawan AI, dan tanding peer-to-peer lewat tempel kode sudah bisa dimainkan.
Penelusur ulang dan kode berbagi permainan juga sudah ada. Belum ada: QR untuk kode
koneksi, pratinjau rambatan, dan sinyal lewat broker (PeerJS).

## Development

```bash
pnpm install
pnpm dev
pnpm test:run
pnpm build      # static export ke ./out
pnpm preview    # sajikan ./out di basePath produksi
```

Baca `PRD.md` untuk ruang lingkup dan `CLAUDE.md` untuk aturan kerja di repo ini.
Sifat yang menopang seluruh proyek ini adalah **determinisme**: `applyMove` harus
menghasilkan hasil identik di perangkat apa pun.

## Lisensi

MIT
