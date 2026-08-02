# Rantai

Chain Reaction: permainan strategi grid dengan ledakan berantai. Hotseat, lawan AI, dan
multiplayer peer-to-peer lewat WebRTC. Situs statis, tanpa backend.

> *rantai* — chain. *Reaksi berantai* adalah istilah Indonesia untuk chain reaction.

## Aturan

1. Taruh satu orb di sel kosong atau sel milikmu.
2. Setiap sel punya **massa kritis** = jumlah tetangga ortogonalnya (2 di sudut, 3 di tepi,
   4 di tengah). Saat tercapai, sel meledak: satu orb ke tiap tetangga, dan setiap sel yang
   menerima orb berpindah kepemilikan ke pemain yang meledak.
3. Ledakan bisa memicu ledakan lain. Menang bila semua orb di papan milikmu.

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
