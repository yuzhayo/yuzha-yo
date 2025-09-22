0) Tujuan & Aturan Main

Goal: Jadikan LayerBasic satu logic utuh (producer + order + image path + image scale + image position) yang output-nya langsung renderable oleh Stages.

Pipeline target: LayerBasic → (opsional) LayerSpin → (opsional) LayerOrbit → render → display.

Aturan:

Jangan tambah file baru.

Parent shared/stages/* jangan diubah.

Pakai hanya kode di part 1–3.

Lolos typecheck.

1) Lingkup File (berdasarkan part 1–3)
Layer (part 1)

shared/layer/LayerLogicBasic.ts

shared/layer/LayerMappingImage.ts

shared/layer/LayerMappingScreen.ts

shared/layer/LayerConverter.ts

shared/layer/LayerImageResolver.ts

shared/layer/LayerPipeline.ts

shared/layer/LayerProducer.ts

shared/layer/LayerTypes.ts

shared/layer/LayerValidator.ts

Effects (part 2) – tidak dimodif untuk fase LogicBasic

shared/layer/LayerLogicSpin.ts

shared/layer/LayerLogicOrbit.ts

shared/layer/LayerLogicPulse.ts

shared/layer/LayerLogicFade.ts

App (part 3)

src/MainScreen.tsx

src/MainScreenConfig.ts

src/StagesCanvas.tsx

src/StagesCanvasLayer.tsx

src/useStages.ts

src/App.tsx

src/main.tsx

src/index.css

src/sampleAnimations.ts (biarkan; tidak dipakai di blank screen)

2) Arsitektur Target (LayerBasic sebagai entry “siap render”)

LayerBasic = Validator → ImageResolver → LayerLogicBasic → MappingImage → MappingScreen → LayerData[]
Output mencakup:

order/z (fallback urutan input)

image path (via resolver)

image scale (fit/alignment/offset/anchor)

image position (konversi ke stage space)

tanpa efek (NO spin/orbit/clock)

Surface API: gunakan produceBasic(...) di LayerPipeline.ts sebagai entry resmi LayerBasic (boleh re-export alias di file yang sama; tanpa file baru).

3) Langkah Migrasi (fase berurutan)
Fase A — Verifikasi & Penegasan Jalur Basic

File: shared/layer/LayerPipeline.ts
Aksi:

Pastikan ada fungsi produceBasic(input, ctx) yang hanya memanggil:

validateLibraryConfig (LayerValidator)

resolveAsset (LayerImageResolver)

applyBasicTransform (LayerLogicBasic)

Mapping ke image & screen (LayerMappingImage/LayerMappingScreen)

Hasil akhir: LayerData[] + warnings

Tegaskan ini sebagai Surface API “LayerBasic” (re-export alias di file yang sama; tidak bikin file baru).

Cek jalur partial lain (e.g., produceBasicSpin) tidak memengaruhi jalur Basic murni.

Kriteria lolos:

produceBasic() mengembalikan LayerData[] renderable (order/path/scale/position OK).

Tidak ada referensi efek di dalamnya.

Fase B — Pemeriksaan Komponen Penyusun Basic

File: shared/layer/LayerLogicBasic.ts
Aksi:

Cek: hanya set transform dasar (posisi/scale/opacity/anchor), tanpa rotasi efek.

Pastikan produk akhirnya selaras dengan tipe di LayerTypes.ts.

File: shared/layer/LayerMappingImage.ts
Aksi:

Cek: hitung displayWidth/Height, offset, anchor sesuai fit mode (contain/cover/stretch) & alignment.

Pastikan nilai yang dibutuhkan Basic terisi dan dipakai downstream.

File: shared/layer/LayerMappingScreen.ts
Aksi:

Cek: konversi posisi/anchor ke koordinat stage (origin center/top-left) yang dipakai engine.

File: shared/layer/LayerImageResolver.ts
Aksi:

Cek: asset/path mengalir ke LayerData. Jika dimensi belum tersedia (NaN)—tidak mengubah kode—pastikan jalur Basic tetap aman (renderer menangani fallback).

File: shared/layer/LayerValidator.ts & shared/layer/LayerTypes.ts
Aksi:

Cek: tipe & normalisasi mendukung semua field yang dipakai Basic (stage, layer, asset, transform dasar).

Kriteria lolos (untuk semua file di fase B):

Tidak ada rotasi/efek di Basic.

Semua field wajib untuk render sudah ada (order/path/scale/position).

Typecheck lulus terhadap LayerTypes.ts.

Fase C — Orkestrasi Penuh Tetap Stabil

File: shared/layer/LayerProducer.ts
Aksi:

Tidak mengubah flow jalur penuh (Basic + efek).

Tambahkan komentar penegasan bahwa jalur Basic-only sudah siap render (dokumentatif, bukan fungsional).

Kriteria lolos:

Pipeline penuh tetap jalan seperti sebelumnya (regresi nol).

Jalur Basic-only dapat dipakai mandiri.

Fase D — Wiring di App (Blank Screen, Stages Connect)

File: src/MainScreenConfig.ts
Aksi:

Set preset minimal: stage { 2048×2048, origin "center" }, layers: [].

File: src/MainScreen.tsx
Aksi:

Render hanya canvas melalui StagesCanvasLayer dengan preset minimal.

Tanpa header/tombol/status demo.

File: src/StagesCanvasLayer.tsx, src/StagesCanvas.tsx, src/useStages.ts
Aksi:

Tidak diubah (parent stages stabil). Hanya pastikan props yang dibutuhkan terpenuhi (width/height/config jika wajib).

File: src/App.tsx, src/main.tsx, src/index.css
Aksi:

Tidak diubah, kecuali route default sudah mengarah ke MainScreen.

CSS boleh tetap; layar kosong tercapai bila preset minimal dipakai.

Kriteria lolos:

App run → layar kosong (no layer) tetapi Stages aktif/connected (init OK, no error).

Saat nanti diganti ke output produceBasic(...), layer tampil dengan pos/scale benar.

4) Validasi, Typecheck, & QA
Typecheck

Jalankan typecheck untuk memastikan semua path Basic cocok tipe di LayerTypes.ts.

Tidak ada tipe baru; jika betul-betul perlu penajaman tipe kecil, konfirm dulu.

Unit/Regresi

Jalankan test yang sudah ada di layer (Validator/Mapping/Basic/Pipeline/Producer).

Fokus: tidak ada perubahan perilaku tak diinginkan.

Smoke & Integrasi Manual

Blank: preset minimal (layers: []) → canvas tampil, tidak error.

Basic-only: 1 layer gambar → posisi/scale/anchor sesuai, tanpa rotasi.

Basic→Spin/Orbit (hanya verifikasi cepat, tanpa modif): tetap berfungsi via jalur penuh.

5) Risiko & Mitigasi

Dimensi aset unknown (NaN) saat fit/cover: dibiarkan ke renderer (existing behavior). QA gunakan aset ber-dimensi known untuk verifikasi visual.

Prop mismatch di StagesCanvasLayer: pastikan param yang diminta komponen dipenuhi dari MainScreenConfig.ts (tanpa mengubah komponen stages).

6) Rollback Sederhana

Revert perubahan di src/MainScreen.tsx & src/MainScreenConfig.ts bila perlu mengembalikan demo.

Perubahan di layer hanya dokumentatif/alias; revert ringan tanpa efek logic.

7) Acceptance Criteria (final)

produceBasic() (alias: LayerBasic) menghasilkan LayerData[] dengan order/z, image path, scale, position yang langsung dirender (no efek).

App blank (layers:[]) → Stages on, tanpa error.

Pipeline penuh (Producer) tetap stabil.

Tidak ada file baru, parent stages tidak diubah, typecheck lulus.

Wajib (runtime core untuk LayerBasic)

shared/layer/LayerTypes.ts — tipe data stage/layer/asset/transform.

shared/layer/LayerValidator.ts — normalisasi & default config input.

shared/layer/LayerImageResolver.ts — resolve image path/asset meta.

shared/layer/LayerLogicBasic.ts — hitung transform dasar (posisi, scale, opacity, anchor).

shared/layer/LayerMappingImage.ts — fit/alignment → displayWidth/Height, offset, anchor.

shared/layer/LayerMappingScreen.ts — konversi posisi ke koordinat stage.

shared/layer/LayerPipeline.ts — entry produceBasic(...) (ini yang kita pakai sebagai LayerBasic).


