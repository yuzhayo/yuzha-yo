0. Tujuan & Aturan Main

Goal: Jadikan LayerBasic satu logic utuh (producer + order + image path + image scale + image position) yang output-nya langsung renderable oleh Stages.

Pipeline target: LayerBasic → (opsional) LayerSpin → (opsional) LayerOrbit → render → display.

Aturan:

Jangan tambah file baru.

Parent shared/stages/\* jangan diubah.

Pakai hanya kode di part 1–3.

Lolos typecheck.

1. Lingkup File (berdasarkan part 1–3)
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

2. Arsitektur Target (LayerBasic sebagai entry “siap render”)

LayerBasic = Validator → ImageResolver → LayerLogicBasic → MappingImage → MappingScreen → LayerData[]
Output mencakup:

order/z (fallback urutan input)

image path (via resolver)

image scale (fit/alignment/offset/anchor)

image position (konversi ke stage space)

tanpa efek (NO spin/orbit/clock)

Surface API: gunakan produceBasic(...) di LayerPipeline.ts sebagai entry resmi LayerBasic (boleh re-export alias di file yang sama; tanpa file baru).

3. Langkah Migrasi (fase berurutan)
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

4. Validasi, Typecheck, & QA
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

5. Risiko & Mitigasi

Dimensi aset unknown (NaN) saat fit/cover: dibiarkan ke renderer (existing behavior). QA gunakan aset ber-dimensi known untuk verifikasi visual.

Prop mismatch di StagesCanvasLayer: pastikan param yang diminta komponen dipenuhi dari MainScreenConfig.ts (tanpa mengubah komponen stages).

6. Rollback Sederhana

Revert perubahan di src/MainScreen.tsx & src/MainScreenConfig.ts bila perlu mengembalikan demo.

Perubahan di layer hanya dokumentatif/alias; revert ringan tanpa efek logic.

7. Acceptance Criteria (final)

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

siap. ini **implementation plan untuk LogicSpin** (format & kedalaman mengikuti _plan.md_), pakai **kode part 1–3**, **tanpa file baru**, **type-safe**, dan kasih tanda **⚠️ KONFIRM** kalau perlu ubah kecil.&#x20;

---

# 0) Tujuan & Aturan Main

- **Goal:** aktifkan **LayerSpin** sebagai **efek independen** dan/atau **wrapper** setelah **LayerBasic**, konsisten aturanmu:
  - **Spin ON ⇒ manual angle OFF** (single source rotation).
  - **Spin OFF ⇒ manual angle (input) dipakai**.
  - Sudut **0–360°, “up = 90°”**.

- **Pipeline target:** **LayerBasic → (opsional) LayerSpin → (opsional) LayerOrbit → render → display**.&#x20;
- **Aturan kerja:**
  - **Jangan** tambah file baru.
  - **shared/stages/** **jangan diubah**.
  - **Pakai yang ada** di part 1–3; kalau butuh kecil-kecilan, **⚠️ KONFIRM** dulu.
  - **Lolos typecheck**.

---

# 1) Lingkup File (pakai yang ADA)

**Layer (part 1 & 2):**

- `shared/layer/LayerLogicSpin.ts` _(core efek)_
- `shared/layer/LayerPipeline.ts` _(jalur partial: Basic→Spin)_
- `shared/layer/LayerProducer.ts` _(jalur penuh; urutan efek)_
- `shared/layer/LayerTypes.ts`, `LayerValidator.ts` _(tipe & normalisasi input layer)_

**App (part 3) – host/orchestrator/display (unchanged kecuali wiring config):**

- `src/MainScreen.tsx`, `src/MainScreenConfig.ts`, `src/StagesCanvasLayer.tsx`, `src/StagesCanvas.tsx`, `src/useStages.ts`, `src/App.tsx`, `src/main.tsx`, `src/index.css`

**Converter/Config (digunakan dari yang ada):**

- `shared/layer/LayerConverter.ts` _(UI ↔ runtime)_
- **Input user**: `yuzha/src/configUI/main.json` → **Converter** → **(in-memory)** LibraryConfig

---

# 2) Arsitektur Target (Spin sebagai efek mandiri & wrapper)

- **Independent effect:** fungsi Spin (pure) menerima **state (angleDeg)**, **params (rpm, direction)**, dan **timeSeconds** → kembalikan **angleDeg** baru.
- **Wrapper pipeline:** setelah **LayerBasic**, jalankan Spin → hasil langsung ke renderer.
- **Gating rule:** bila `spin.enabled === true` (atau `imageSpin === "true"|"sec"|"min"|"hour"` khusus clock nanti), **abaikan manual angle** pada layer (gunakan hasil Spin).
- **Normalisasi sudut:** output **0–360** (modulo), **up=90°** dipertahankan.

---

# 3) Langkah Implementasi (fase)

## Fase A — Audit & Tegaskan Jalur Partial “Basic→Spin”

**File:** `shared/layer/LayerPipeline.ts`
**Aksi:**

1. Pastikan sudah ada **`produceBasicSpin(input, ctx)`** yang memanggil:
   `validate → resolveAsset → basic → spin → mapping screen (jika perlu)`.
2. **Gating** “single source rotation”:
   - **⚠️ KONFIRM**: jika saat ini pipeline **menjumlahkan** manual angle + Spin, ubah ke: **kalau Spin aktif ⇒ manual angle diabaikan**.

3. **Normalisasi sudut 0–360** setelah Spin.
   - **⚠️ KONFIRM**: kalau belum ada modulo, tambah **clamp/mod 360** di titik akhir Spin chain (minimal touch).

**Kriteria lolos:**

- `produceBasicSpin()` menghasilkan `LayerData[]` dengan angle final dari **Spin** (bukan manual) saat Spin aktif.
- Manual angle dipakai saat Spin off.
- Sudut keluar 0–360.

---

## Fase B — Verifikasi Efek Inti Spin

**File:** `shared/layer/LayerLogicSpin.ts`
**Aksi:**

- Review fungsi Spin yang ada (rpm → delta sudut; `cw/ccw`; guard rpm≤0/time invalid).
- Pastikan kompatibel dengan konvensi **up=90°** (umumnya renderer yang terapkan; Spin cukup mengubah angka derajat).
- Tidak perlu mengubah core; semua gating/normalisasi dilakukan di pipeline (Fase A).

**Kriteria lolos:**

- Spin pure & stateless; hasil hanya fungsi dari (state awal, params, `timeSeconds`).
- Tidak bergantung renderer/stages.

---

## Fase C — Integrasi ke Jalur Penuh (tetap stabil)

**File:** `shared/layer/LayerProducer.ts`
**Aksi:**

- Konfirmasi urutan efek penuh: **Basic → Spin → Orbit → (Pulse/Fade jika ada)** (sesuai urutan existing).
- Tambahkan **komentar** tentang gating Spin (dokumentatif, no logic change bila sudah dilakukan di Pipeline).

**Kriteria lolos:**

- Jalur penuh tetap berjalan; tidak ada regresi modul lain.

---

## Fase D — Converter & Config (UI → runtime)

**File:** `shared/layer/LayerConverter.ts`
**Aksi:**

- Pastikan ada mapping UI→runtime untuk param **Spin** (mis. `spinSpeedRpm`, `spinDirection`, `spin.enabled` / `imageSpin="true"`).
- Bila value belum ada di UI JSON, sediakan default **diam** (rpm=0) di converter.
- **Tidak** menambah file; cukup extend handler yang ada.

**Kriteria lolos:**

- Input `configUI/main.json` menghasilkan **LibraryConfig** valid dengan Spin params konsisten.
- Kalau `Spin=true` tanpa param spesifik → **diam** (sesuai instruksi kamu).

---

## Fase E — Orchestrator / Host (tanpa sentuh stages)

**Files:** `src/MainScreen.tsx`, `src/MainScreenConfig.ts`
**Aksi:**

- **MainScreen**: baca **configUI** → **Converter** (in-memory) → pilih pipeline:
  - Basic-only (default) **atau**
  - **Basic→Spin** jika flag Spin aktif pada konfigurasi.

- Jangan ubah `StagesCanvasLayer` / engine.

**Kriteria lolos:**

- Blank (layers:\[]) tetap kosong & connect.
- Saat Spin diaktifkan lewat UI config, rotasi jalan & manual angle di-off.

---

# 4) Validasi, Typecheck, QA

**Typecheck**

- Semua fungsi yang diubah **tetap** sesuai `LayerTypes.ts`.

**Smoke tests**

- **Spin OFF:** layer dengan manual angle ⇒ ditampilkan sesuai input; tidak ada rotasi tambahan.
- **Spin ON + rpm>0 (cw/ccw):** layer berputar; manual angle **tidak** berpengaruh.
- **rpm=0 / time NaN:** no-op aman.

**Edge**

- Sudut melebihi 360° ⇒ hasil dimodulo 0–360.
- Direction invalid ⇒ fallback `"cw"` (atau sesuai guard existing).

---

# 5) Risiko & Mitigasi

- **Gating belum ada di pipeline** → perlu perubahan kecil: **⚠️ KONFIRM** sebelum mengaktifkan rule “Spin ON ⇒ manual angle OFF”.
- **Modulo belum ada** → tambahkan di pipeline (akhir Spin chain): **⚠️ KONFIRM**.
- **Perbedaan konvensi rad/deg di renderer** → pastikan renderer memang mengharapkan derajat; kalau butuh radian, konversi dilakukan di renderer (bukan di Spin).

---

# 6) Rollback Sederhana

- Revert perubahan di `LayerPipeline.ts` (gating & modulo).
- Tidak ada file lain yang perlu di-rollback (Spin core, Producer, Converter tetap kompatibel).

---

# 7) Acceptance Criteria (final)

- **Single source rotation** ditegakkan:
  - **Spin ON ⇒ manual angle OFF** (dibuktikan pada sample layer).
  - **Spin OFF ⇒ manual angle dipakai**.

- Output angle **0–360**, konsisten **up=90°**.
- **`produceBasicSpin()`** tersedia & berfungsi; jalur penuh **Producer** tetap stabil.
- **Typecheck lulus**, **tanpa file baru**, **stages tidak diubah**.

---

# 8) Quick Testing Matrix

| Case | Config                                          | Expected                                                      |
| ---- | ----------------------------------------------- | ------------------------------------------------------------- |
| A    | Spin OFF, manual angle=45°                      | Sudut 45°, no rotation over time                              |
| B    | Spin ON, rpm=10, dir=cw, manual angle=45°       | Manual **diabaikan**, objek berputar cw; sudut dimodulo 0–360 |
| C    | Spin ON, rpm=0                                  | Tidak bergerak (diam)                                         |
| D    | Spin ON, dir invalid                            | Fallback dir, putar sesuai default                            |
| E    | Switch ON→OFF saat runtime (kalau UI mendukung) | Saat ON: manual OFF; Saat OFF: manual kembali berlaku         |

---

# 9) Konfirmasi yang dibutuhkan (sebelum eksekusi)

1. **Boleh** ubah kecil di `LayerPipeline.ts` untuk:
   - Gating rule (**Spin ON ⇒ manual angle OFF**)? **YA/TIDAK**
   - Normalisasi sudut **0–360** di akhir Spin chain? **YA/TIDAK**

2. Nama flag di UI config untuk Spin yang kamu pakai saat ini? (`spin.enabled` / `imageSpin: "true"`?) — biar converter mapping presisi.
3. Urutan efek final di jalur penuh tetap **Basic → Spin → Orbit**? (sesuai definisimu).

Jawab 1–3, aku langsung eksekusi sesuai plan ini, **konsisten** sama _plan.md_-style dan **strict** pakai kode yang ada.&#x20;

siap. ini **implementation plan untuk LayerOrbit** (gaya _plan.md_), pakai kode part 1–3, **tanpa file baru**, **stages tidak diubah**, dan **lolos typecheck**.

---

# 0) Tujuan & Aturan Main

- **Goal:** aktifkan **LayerOrbit** sebagai **efek independen** dan/atau **wrapper** setelah **LayerBasic** (dan setelah Spin bila aktif).
- **Aturanmu (wajib ditegakkan):**
  - **Orbit center** = koordinat input user (wajib).
  - **Orbit line** = **user input** ATAU **image position dari LayerBasic** (jika input ada ⇒ **override** Basic).
  - **Radius** = jarak (**orbit center ↔ orbit line point**).
  - **Speed** dalam **rpm**, **direction** `cw|ccw`.
  - **Orientasi**:
    - **Spin ON** ⇒ orientasi mengikuti **Spin**.
    - **Spin OFF** ⇒ orientasi **selalu facing outward** dari **orbit center** (ala jarum jam).

- **Pipeline target:** **LayerBasic → (opsional) LayerSpin → (opsional) LayerOrbit → render → display**.
- **Konvensi sudut global:** **0–360°, up = 90°**.

---

# 1) Lingkup File (pakai yang ADA)

- `shared/layer/LayerLogicOrbit.ts` _(core posisi orbit)_
- `shared/layer/LayerPipeline.ts` _(jalur partial: Basic→(Spin?)→Orbit + aturan override & facing)_
- `shared/layer/LayerProducer.ts` _(jalur penuh; urutan efek)_
- `shared/layer/LayerTypes.ts`, `LayerValidator.ts` _(tipe & normalisasi field orbit/posisi)_
- `shared/layer/LayerConverter.ts` _(mapping UI↔runtime untuk param orbit)_
- **App/Stages (part 3)**: `MainScreen.tsx`, `StagesCanvasLayer.tsx`, `StagesCanvas.tsx`, `useStages.ts` — **unchanged** (host & renderer stabil).

---

# 2) Arsitektur Target

- **Independent effect:** fungsi orbit (pure, stateless) menerima **state (position)**, **params (center, radius, rpm, direction)**, **timeSeconds** → menghasilkan **position** di lintasan lingkaran.
- **Wrapper pipeline:** setelah **LayerBasic** (dan setelah **Spin** jika aktif), terapkan orbit untuk **update position**; kemudian **tentukan orientation** sesuai aturan facing di atas.
- **Override sumber radius:** bila **user memberikan orbit line**, gunakan itu; jika tidak, pakai **image position dari Basic** sebagai orbit line.

---

# 3) Langkah Implementasi

## Fase A — Audit & Tegaskan Jalur Partial “Basic→(Spin?)→Orbit”

**File:** `shared/layer/LayerPipeline.ts`
**Aksi:**

1. Pastikan ada/siapkan jalur **`produceBasicOrbit(...)`** dan **`produceBasicSpinOrbit(...)`** (jika sudah ada, gunakan apa adanya).
2. **Override orbit line**:
   - Jika config berisi **`orbit.line`** (titik), **pakai itu**.
   - Jika **tidak ada**, gunakan **`LayerBasic.position`** sebagai **line point** (fallback).
   - **Radius** = `distance(orbit.center, linePoint)`.

3. **Orientasi (facing)**:
   - **Jika Spin ON** ⇒ **jangan ubah angle** (orientasi dari Spin).
   - **Jika Spin OFF** ⇒ set **angle** sehingga **facing outward** dari `orbit.center` ke arah posisi saat ini.
     - Rumus: `θ = angle(center → position)` + **offset** yang menyesuaikan **up=90°** (pastikan konsisten; biasanya outward = arah radial).

4. **Direction & phase**:
   - `cw` ⇒ sudut berkurang sesuai waktu; `ccw` ⇒ sudut bertambah.
   - Gunakan `rpm` → `rev/sec` → `deg/sec` untuk menghitung posisi di waktu `t`.
   - **Normalisasi** sudut kerja internal bila perlu; **output position** tidak butuh normalisasi angka (x,y saja).

5. **Don’t touch renderer**: semua komputasi posisi & angle dilakukan di pipeline.

**Kriteria lolos:**

- Jalur partial **Basic→Orbit** dan **Basic→Spin→Orbit** berjalan dengan aturan override & facing.
- Facing policy **hanya** diterapkan saat **Spin OFF**.
- Tidak ada efek samping ke modul lain.

---

## Fase B — Verifikasi Efek Inti Orbit

**File:** `shared/layer/LayerLogicOrbit.ts`
**Aksi:**

- Review fungsi orbit yang ada: guard nilai (rpm<=0, time NaN, radius<=0 ⇒ no-op aman), hitung sudut sesuai `cw|ccw`.
- Pastikan fungsi ini **mengubah position saja** (orientasi diatur di pipeline seperti fase A).
- Pastikan kompatibel dengan koordinat stage (MappingScreen sudah menangani ke space stage pada Basic).

**Kriteria lolos:**

- Fungsi orbit **pure & stateless**.
- Posisi mengikuti lintasan lingkaran radius R di `timeSeconds`.
- Direction `cw|ccw` konsisten.

---

## Fase C — Integrasi ke Jalur Penuh (tetap stabil)

**File:** `shared/layer/LayerProducer.ts`
**Aksi:**

- Konfirmasi urutan efek penuh adalah **Basic → Spin → Orbit → (Pulse/Fade)**.
- Tambahkan **komentar** singkat: “Orbit line override + facing outward when Spin OFF diterapkan di pipeline.”

**Kriteria lolos:**

- Jalur penuh tetap stabil, tanpa regresi.

---

## Fase D — Converter & Config (UI → runtime)

**File:** `shared/layer/LayerConverter.ts`
**Aksi:**

- Pastikan mapping untuk field Orbit:
  - `orbit.center: {x,y}`
  - `orbit.line?: {x,y}` (opsional; jika hilang ⇒ fallback ke posisi Basic)
  - `orbit.rpm: number`
  - `orbit.direction: "cw"|"ccw"`

- Default aman: `rpm=0` (diam), `direction="cw"`.
- **Tidak** menambah file; cukup extend handler yang ada.

**Kriteria lolos:**

- Input UI menghasilkan `LibraryConfig` valid untuk Orbit tanpa error.
- Jika user **tidak** memberi `orbit.line`, radius otomatis dari posisi Basic.

---

## Fase E — Orchestrator / Host (unchanged)

**Files:** `src/MainScreen.tsx`, `StagesCanvasLayer.tsx`
**Aksi:**

- Host membaca **configUI → Converter (in-memory)**.
- Pilih pipeline sesuai flag Orbit:
  - **Basic-only** (default).
  - **Basic→Orbit** bila Orbit aktif.
  - **Basic→Spin→Orbit** bila Spin & Orbit aktif bersamaan.

- **Tidak** mengubah komponen stages.

**Kriteria lolos:**

- Blank tetap blank.
- Saat Orbit aktif, objek mengorbit center sesuai param & facing policy.

---

# 4) Validasi, Typecheck, QA

**Typecheck**

- Semua perubahan sesuai `LayerTypes.ts`; tidak ada tipe baru selain yang sudah ada.

**Smoke tests**

- **Orbit OFF:** posisi = hasil Basic (no motion).
- **Orbit ON + rpm>0, cw/ccw:** posisi mengikuti orbit; radius sesuai sumber (input line atau Basic position).
- **Orbit ON + Spin ON:** orientasi mengikuti Spin (pipeline tidak menimpa angle).
- **Orbit ON + Spin OFF:** orientasi **facing outward** (benar-benar radial).

**Edge**

- `rpm=0` ⇒ no-op aman.
- `radius=0` (line= center) ⇒ no-op aman.
- `direction` invalid ⇒ fallback `"cw"` (atau guard existing).

---

# 5) Risiko & Mitigasi

- **Facing outward**: perlu pastikan offset sudut konsisten dengan **up=90°**.
  - _Mitigasi_: hitung `θ = angle(center→position)` dalam derajat sistem, lalu gunakan offset yang sudah dipakai global (uji visual).

- **Override line**: pastikan fallback ke **Basic position** terjadi **sebelum** kalkulasi radius.
- **Urutan efek**: Orbit harus dijalankan **setelah** Spin bila Spin aktif (posisi berubah setelah rotasi?—di sistem kita, Spin ubah **angle**, Orbit ubah **posisi**, jadi urutan yang kamu tetapkan sudah benar).

---

# 6) Rollback

- Revert perubahan di `LayerPipeline.ts` jika override/facing menimbulkan konflik.
- `LayerLogicOrbit.ts`, `LayerProducer.ts`, `LayerConverter.ts` tidak perlu rollback jika tidak diubah fungsinya.

---

# 7) Acceptance Criteria (final)

- **Override orbit line** bekerja: input line ⇒ pakai itu; jika tidak, pakai Basic position. Radius benar.
- **Facing policy** ditegakkan:
  - **Spin ON** ⇒ orientasi dari Spin (pipeline tidak menimpa).
  - **Spin OFF** ⇒ orientasi **facing outward** dari orbit center.

- **Partial pipelines** tersedia & jalan:
  - `Basic→Orbit`, `Basic→Spin→Orbit`.

- **Typecheck lulus**, **tanpa file baru**, **stages tidak diubah**.

---

# 8) Quick Testing Matrix

| Case | Config                                    | Expected                                                      |
| ---- | ----------------------------------------- | ------------------------------------------------------------- |
| A    | Orbit OFF                                 | Posisi = Basic, no motion                                     |
| B    | Orbit ON, rpm=5, dir=cw, **tanpa** line   | Radius dari Basic position; orbit cw                          |
| C    | Orbit ON, rpm=5, dir=ccw, **dengan** line | Radius dari line; orbit ccw                                   |
| D    | Orbit ON + Spin OFF                       | Posisi orbit; **angle facing outward** (radial)               |
| E    | Orbit ON + Spin ON                        | Posisi orbit; **angle dari Spin** (manual OFF oleh Spin rule) |
| F    | rpm=0 atau line=center                    | No-op aman                                                    |

---

# 9) Konfirmasi sebelum eksekusi

1. Nama field final untuk Orbit di UI config: `orbit.center {x,y}`, `orbit.line? {x,y}`, `orbit.rpm`, `orbit.direction` — **OK?**
2. Facing outward offset mengikuti standar **up=90°** (aku akan pakai `angle(center→pos)` lalu terapkan offset global) — **OK?**
3. Urutan efek final tetap **Basic → Spin → Orbit** — **OK?**

Jawab 1–3, aku lanjut eksekusi persis plan ini, **konsisten** dengan constraint: tanpa file baru, stages tidak disentuh, dan pakai kode yang ada.

paham. Ini **implementation plan untuk ClockLogic** (format ala _plan.md_), strictly pakai kode part 1–3, **tanpa nambah file baru** (kecuali kamu setujui), dan tandai hal yang perlu konfirmasi.

---

# 0) Tujuan & Aturan Main

- **Goal:** aktifkan **ClockLogic** sebagai **wrapper** di atas **LayerBasic** dengan aturanmu:
  - 4 titik **selalu segaris**: **imageTip – imageCenter – imageBase – clockCenter**.
  - **imageBase** default **nempel clockCenter** (radius=0), bisa **`centerBaseRadius > 0`**.
  - **Anchor tip/base by angle→border** (dari geometric center gambar, ray ke border rect).
  - **Konvensi sudut**: **0–360°, up = 90°**.
  - **imageSpin modes**:
    - `"none"` → pakai konfigurasi angle tip/base.
    - `"true"` → pakai **Spin logic** (kalau spin config kosong → **diam**).
    - `"sec|min|hour"` → **realtime** di imageCenter (ikut `tickMode smooth|tick`, `timezone`, `timeFormat 12|24`).

- **Pipeline target:** **LayerBasic → (opsional) LayerSpin → (opsional) LayerOrbit → (opsional) Clock → render → display**
  _(⚠️ KONFIRM: saat Clock ON, apakah Orbit harus OFF/diabaikan karena Clock sudah menentukan posisi di garis jarum?)_
- **Aturan kerja:**
  - **Jangan ubah** `shared/stages/*`.
  - **Jangan tambah file baru** (kecuali kamu setujui).
  - **Type-safe** sesuai `LayerTypes.ts`.

---

# 1) Lingkup File (pakai yang ADA)

- `shared/layer/LayerPipeline.ts` — tempat wrapper Clock dirangkai (partial pipeline).
- `shared/layer/LayerProducer.ts` — jalur penuh (urutan efek, dokumentasi behavior).
- `shared/layer/LayerLogicBasic.ts` — basis posisi/scale awal.
- `shared/layer/LayerMappingImage.ts` — **(potensi lokasi helper)** untuk hitung **angle→border point**.
  _(⚠️ KONFIRM: boleh tambah helper kecil di file ini? Tanpa file baru.)_
- `shared/layer/LayerMappingScreen.ts` — koordinat stage.
- `shared/layer/LayerValidator.ts`, `LayerTypes.ts` — tipe & normalisasi.
- `shared/layer/LayerConverter.ts` — mapping **UI JSON ↔ LibraryConfig** (Clock keys).

**Host/Display (unchanged):**
`yuzha/src/MainScreen.tsx`, `StagesCanvasLayer.tsx`, `StagesCanvas.tsx`, `useStages.ts`, `MainScreenConfig.ts`, `App.tsx`, `main.tsx`.

---

# 2) Arsitektur Target

- **ClockLogic (wrapper):** menerima **LayerData** hasil **Basic** (dan efek lain sesuai urutan), lalu:
  1. Tentukan **imageTip** & **imageBase** dari **angle anchor → border rect** (lokal gambar).
  2. Terapkan **colinear** terhadap **clockCenter** pada sudut **θ**:
     - **θ** berasal dari:
       - `"none"`: input angle config,
       - `"true"`: hasil **Spin**,
       - `"sec|min|hour"`: fungsi **time→angle** (tick/smooth, tz, 12/24). _(⚠️ KONFIRM: sumber fungsi time→angle di mana? Kalau belum ada, boleh tambah helper kecil di file existing.)_

  3. **imageBase** ditempatkan di **clockCenter** (atau pada **radius** jika `centerBaseRadius > 0`), lalu **imageCenter** dan **imageTip** diluruskan di garis sudut **θ**.

- **Single-source rotation:**
  - Saat `"true"`/`sec|min|hour` → **manual angle OFF**.
  - Saat `"none"` → pakai manual angle dari config.

- **Output:** `LayerData[]` siap render, menggantikan posisi/angle dari Basic sesuai aturan Clock.

---

# 3) Langkah Implementasi (fase)

## Fase A — Partial Pipeline Clock

**File:** `LayerPipeline.ts`
**Aksi:**

1. Tambah jalur partial **Basic→Clock** dan **Basic→Spin→Clock** (kalau belum ada, implement di file ini **tanpa** file baru).
2. **Gating sumber sudut**:
   - `imageSpin === "true"` → ambil sudut dari **Spin** (manual OFF).
   - `imageSpin === "sec|min|hour"` → sudut dari **time→angle** (lihat Fase C).
   - `imageSpin === "none"` → sudut dari **config tip/base angle**.

3. **Override posisi**:
   - Tempatkan **imageBase** di **clockCenter** (atau pada jarak `centerBaseRadius` di arah **θ**).
   - **imageCenter** dan **imageTip** diluruskan pada garis yang sama (colinear), sudut **θ**.

4. **Normalisasi** sudut output 0–360 (konsisten global).

**Kriteria lolos:**

- Jalur partial tersedia: `produceBasicClock`, `produceBasicSpinClock`.
- Gating berjalan: manual OFF saat Spin/Realtime ON.
- Posisi & orientasi sesuai colinear rule.

---

## Fase B — Anchor angle → border (lokal gambar)

**File:** `LayerMappingImage.ts` _(tempat terbaik untuk helper kecil)_
**Aksi:**

- Tambahkan **helper kecil** untuk memproyeksikan **ray dari geometric center** pada sudut **α** ke **border rect** → hasilkan titik **on-border** (untuk **imageBaseAnchorAngle360**, **imageTipAnchorAngle360**).
  _(Hitung intersection ray-rect; gunakan sudut “up=90°”.)_
- **Tanpa bikin file baru**; hanya penambahan fungsi util lokal.

**Kriteria lolos:**

- Dapatkan **imageBase** & **imageTip** anchor dari sudut (0–360) ke border, stabil terhadap rasio gambar.
- Tidak mengganggu mapping existing.

_(⚠️ KONFIRM: izinkan penambahan helper kecil ini di `LayerMappingImage.ts`. Kalau tidak, sebutkan util existing yang boleh dipakai.)_

---

## Fase C — Realtime time→angle (sec|min|hour)

**Sumber:** belum ada di part 1–3.
**Opsi minimal (tanpa file baru):**

- Implement **fungsi kecil** di `LayerPipeline.ts` untuk menghitung sudut dari waktu:
  - **hour**: `(jam%12)/12 * 360` (+ menit/sekon untuk smooth).
  - **min**: `menit/60 * 360` (+ detik untuk smooth).
  - **sec**: `detik/60 * 360`.
  - **tickMode**:
    - `tick` ⇒ buletkan ke unit masing-masing.
    - `smooth` ⇒ gunakan pecahan dari unit.

  - **timezone** & **12/24**: sesuaikan sumber waktu (UTC / Asia/Jakarta) dan format (12h untuk hour).

- **Tanpa file baru**: letakkan helper ini inline/privat dalam `LayerPipeline.ts`.

_(⚠️ KONFIRM: boleh menambah helper waktu kecil di `LayerPipeline.ts`? Atau kamu ingin sumber waktu dari Host/Config—kalau ya, berikan field yang ada.)_

---

## Fase D — Converter & Config

**File:** `LayerConverter.ts`
**Aksi:**

- Pastikan mapping UI→runtime untuk field Clock (yang sudah kamu definisikan):
  - `clock.enable: boolean`
  - `clock.imageTipAngle360: number`
  - `clock.imageBaseAngle360: number`
  - `clock.clockCenter: {x,y}`
  - `clock.centerBaseRadius: number`
  - `clock.imageSpin: "none" | "true" | "sec" | "min" | "hour"`
  - `clock.tickMode: "smooth" | "tick"`
  - `clock.timeFormat: 12 | 24`
  - `clock.timezone: "UTC" | "Asia/Jakarta" | …`

- Default aman: `enable=false`, `imageSpin="none"`, `centerBaseRadius=0`, `tickMode="smooth"`, `timezone="UTC"`.

**Kriteria lolos:**

- Input UI JSON menghasilkan `LibraryConfig` valid dengan blok Clock lengkap.
- Jika `imageSpin="true"` tapi param spin kosong → **diam** (no-op), sesuai instruksi.

---

## Fase E — Producer (jalur penuh) & Dokumentasi

**File:** `LayerProducer.ts`
**Aksi:**

- Dokumentasikan urutan penuh saat Clock dipakai. **Usulan gating** (⚠️ KONFIRM):
  - Saat **Clock ON**, **Orbit** diabaikan (Clock menentukan posisi jarum pada garis θ).
  - Urutan preferensi angle: **Clock realtime/Spin** > **manual angle**.

- **Tanpa** mengubah logic Producer jika semua sudah diatur di Pipeline.

---

# 4) Validasi, Typecheck, QA

**Typecheck**

- Semua perubahan tetap patuh `LayerTypes.ts`; bila perlu tipe ringan untuk blok Clock, **⚠️ KONFIRM** sebelum tambah.

**Smoke & Scenario**

- **Clock OFF**: Basic-only → tampil normal.
- **Clock ON, imageSpin="none"**: sudut dari input angle tip/base; base di clockCenter; colinear.
- **Clock ON, imageSpin="true"**: sudut dari Spin; manual OFF; base di clockCenter; colinear.
- **Clock ON, imageSpin="sec|min|hour"**: sudut realtime sesuai `tickMode` + `timezone`; base di clockCenter; colinear.
- **centerBaseRadius > 0**: base offset dari clockCenter sepanjang garis θ; tip/center ikut lurus.

**Edge**

- `centerBaseRadius=0` (default): base tepat di clockCenter.
- `imageTip/BaseAngle360` di luar 0–360 → modulo 360.
- Time source unavailable → fallback ke UTC & smooth.

---

# 5) Risiko & Mitigasi

- **Helper angle→border belum ada:** perlu tambah kecil di `LayerMappingImage.ts`. _(⚠️ butuh izin)_
- **Waktu/timezone**: jika lingkungan tidak sediakan tz, gunakan library/`Intl`—kalau tidak tersedia, fallback UTC. _(⚠️ konfirmasi sumber waktu)_
- **Konflik Orbit**: Clock sudah menentukan posisi; Orbit sebaiknya **OFF** saat Clock ON. _(⚠️ KONFIRM kebijakan final)_

---

# 6) Rollback

- Revert perubahan `LayerPipeline.ts` (hapus wrapper Clock, helper time).
- Revert helper kecil di `LayerMappingImage.ts` jika ditambahkan.

---

# 7) Acceptance Criteria (final)

- Jalur partial **Basic→Clock** & **Basic→Spin→Clock** tersedia dan benar.
- **Colinear** rule ditegakkan (tip/center/base/clockCenter segaris).
- **Base di clockCenter** (atau pada `centerBaseRadius` di arah θ).
- **Gating angle**:
  - `"none"` ⇒ manual angle,
  - `"true"` ⇒ Spin,
  - `"sec|min|hour"` ⇒ realtime (tick/smooth, tz, 12/24).

- Output **ready-to-render**, **typecheck lulus**, **stages tidak diubah**.

---

# 8) Quick Testing Matrix

| Case | Config                                                | Expected                                            |
| ---- | ----------------------------------------------------- | --------------------------------------------------- |
| A    | enable=false                                          | Basic-only; posisi Basic                            |
| B    | enable=true, imageSpin="none", tip=90, base=270       | Jarum vertikal; base di clockCenter; colinear       |
| C    | enable=true, imageSpin="true", rpm=10 cw              | Rotasi ikut Spin; manual OFF; colinear              |
| D    | enable=true, imageSpin="sec", tick, tz=UTC            | Lompat tiap detik; sudut sesuai detik; colinear     |
| E    | enable=true, imageSpin="min", smooth, tz=Asia/Jakarta | Halus mengikuti menit+detik; colinear               |
| F    | enable=true, radius>0                                 | Base offset dari center; tip/center lurus; colinear |
| G    | Orbit ON bersamaan (⚠️ kebijakan)                     | _(Jika Clock ON ⇒ Orbit OFF/ignored — konfirmasi)_  |

---

## Konfirmasi yang dibutuhkan (sebelum eksekusi)

1. **Helper angle→border** boleh ditambahkan **kecil** di `LayerMappingImage.ts`? **YA/TIDAK**
2. **Helper time→angle** boleh ditambahkan **kecil** di `LayerPipeline.ts`? **YA/TIDAK** (atau tentukan sumber waktu lain)
3. **Gating Clock vs Orbit**: Saat **Clock ON**, **Orbit OFF/diabaikan**? **YA/TIDAK**
4. Nama pasti field UI JSON (Clock) sudah final seperti di Fase D? **YA/TIDAK** (sebutkan jika beda)

Jawab 1–4, aku langsung eksekusi sesuai plan ini—konsisten, type-safe, tanpa file baru kecuali kamu izinkan.

paham. Berikut **implementation plan untuk EFFECTS** (gaya _plan.md_), pakai **kode yang sudah ada** (part 1–3), **tanpa file baru**, **stages tidak diubah**, dan **lolos typecheck**. Efek yang dicakup: **Pulse** (scale oscillation) & **Fade** (opacity oscillation). Spin/Orbit sudah punya plan terpisah.

---

# 0) Tujuan & Aturan Main

- **Goal:** aktifkan **Pulse** & **Fade** sebagai **efek independen** dan/atau **wrapper** setelah **LayerBasic** (selaras urutanmu).
- **Pipeline target (final):**
  **LayerBasic → (Spin) → (Orbit) → (Clock) → (Pulse) → (Fade) → render → display**
  _(Urutan akhir bisa kamu kunci; default di bawah.)_
- **Aturan kerja:**
  - **Jangan** tambah file baru.
  - **shared/stages/** **jangan diubah**.
  - Semua perubahan **type-safe**.

---

# 1) Lingkup File (pakai yang ADA)

- `shared/layer/LayerLogicPulse.ts` _(core scale oscillation)_
- `shared/layer/LayerLogicFade.ts` _(core opacity oscillation)_
- `shared/layer/LayerPipeline.ts` _(jalur partial & komposisi efek)_
- `shared/layer/LayerProducer.ts` _(jalur penuh & urutan efek)_
- `shared/layer/LayerTypes.ts`, `LayerValidator.ts` _(tipe & normalisasi)_
- `shared/layer/LayerConverter.ts` _(mapping UI↔runtime untuk efek)_
- **Host/Stages (unchanged):** `yuzha/src/MainScreen.tsx`, `StagesCanvasLayer.tsx`, `StagesCanvas.tsx`, `useStages.ts`

---

# 2) Arsitektur Target (independent effects)

- **Pulse (scale):** fungsi **pure** yang memodulasi `scale{x,y}` berdasarkan waktu:
  - Parameter umum: `amplitude`, `frequencyHz`/`rpm`, `phaseDeg`, `mode: "uniform"|"xy"`, `easing?`.
  - Output: `scale` baru (clamped).

- **Fade (opacity):** fungsi **pure** yang memodulasi `opacity` berdasarkan waktu:
  - Parameter umum: `min`, `max`, `frequencyHz`/`rpm`, `phaseDeg`, `curve: "sine"|"triangle"|...`.
  - Output: `opacity` baru (0–1).

---

# 3) Langkah Implementasi

## Fase A — Partial Pipelines

**File:** `LayerPipeline.ts`
**Aksi:**

1. Sediakan jalur partial (kalau belum ada / verifikasi ada):
   - `produceBasicPulse(...)`
   - `produceBasicFade(...)`
   - `produceBasicSpinOrbitPulseFade(...)` _(komposisi akhir; urutan lihat Fase C)_

2. Pastikan setiap jalur **menggunakan efek hanya jika enabled** di config.

**Kriteria lolos:**

- Partial pipelines tersedia dan tidak memodifikasi state saat efek nonaktif.

## Fase B — Verifikasi Inti Efek

**File:** `LayerLogicPulse.ts`
**Aksi:**

- Review bahwa fungsi hanya **mengubah scale**; guard nilai invalid (`amp<=0`, `freq<=0` ⇒ no-op).
- Pastikan opsi `uniform` (x=y) & `xy` didukung (bila ada di kode).
- Normalisasi hasil (hindari scale negatif/NaN).

**File:** `LayerLogicFade.ts`
**Aksi:**

- Review bahwa fungsi hanya **mengubah opacity**; clamp `0–1`.
- Guard konfigurasi (min/max swap, freq=0 ⇒ no-op).

**Kriteria lolos:**

- Keduanya **pure & stateless**; bergantung pada (state awal, params, `timeSeconds`).

## Fase C — Urutan Efek dalam Pipeline

**File:** `LayerProducer.ts` / `LayerPipeline.ts`
**Aksi (usulan urutan default, konsisten dan aman):**

1. **Spin** (rotasi) — mempengaruhi **angle**.
2. **Orbit** (posisi) — mempengaruhi **position**.
3. **Clock** (override angle/pos sesuai aturan clock) — jika ON, bisa menimpa angle/pos.
4. **Pulse** (scale) — memodulasi **scale** tanpa mengganggu angle/pos.
5. **Fade** (opacity) — terakhir, memodulasi **opacity**.

> Jika Clock ON dan menimpa orientasi/pos, pastikan Pulse/Fade tetap berlaku. Urutan 4–5 tidak saling mengganggu.

**Kriteria lolos:**

- Jalur penuh **stabil** dan konsisten dengan Spin/Orbit/Clock plan sebelumnya.

## Fase D — Converter & Config

**File:** `LayerConverter.ts`
**Aksi:**

- Tambahkan/konfirmasi mapping untuk **Pulse**:
  - `pulse.enabled: boolean`
  - `pulse.mode: "uniform"|"xy"`
  - `pulse.amplitude: number` _(mis. faktor 0–1)_
  - `pulse.frequencyHz` **atau** `pulse.rpm` _(pakai salah satu; pilih yang ada di kode)_
  - `pulse.phaseDeg: number` _(0–360)_

- Tambahkan/konfirmasi mapping untuk **Fade**:
  - `fade.enabled: boolean`
  - `fade.min: number` (0–1)
  - `fade.max: number` (0–1)
  - `fade.frequencyHz` **atau** `fade.rpm`
  - `fade.phaseDeg: number` (0–360)
  - `fade.curve?: "sine"|"triangle"|...` _(sesuaikan dengan yang ada)_

**Default aman:**

- `pulse.enabled=false`, `fade.enabled=false`.
- Jika enabled tapi param gagal/invalid ⇒ no-op.

**Kriteria lolos:**

- UI JSON → runtime `LibraryConfig` valid; typecheck OK.

## Fase E — Orchestrator / Host (unchanged)

- **MainScreen** membaca **configUI → Converter (in-memory)**, lalu memilih pipeline **yang sesuai flags effect**:
  - **Basic** (default)
  - **Basic→Pulse**, **Basic→Fade**
  - **Basic→Spin→Orbit→Clock→Pulse→Fade** (kombinasi penuh)

**Kriteria lolos:**

- Blank tetap blank.
- Saat Pulse/Fade aktif, perubahan scale/opacity terlihat tanpa efek samping lain.

---

# 4) Validasi, Typecheck, QA

**Typecheck**

- Pastikan param efek match `LayerTypes.ts`. Bila butuh tipe ringan baru (mis. `PulseConfig`, `FadeConfig`) tetapi **sudah ada** di repo, gunakan yang ada; kalau belum ada dan memang perlu, **konfirm dulu**.

**Smoke tests**

- **Pulse OFF** ⇒ scale dari Basic.
- **Pulse ON (uniform, amp=0.1, 1Hz)** ⇒ scale naik-turun halus.
- **Fade OFF** ⇒ opacity dari Basic.
- **Fade ON (min=0.3, max=1, 0.5Hz)** ⇒ opacity berkedip halus, clamp 0–1.

**Edge**

- `amp=0` / `freq=0` ⇒ no-op.
- `min>max` ⇒ swap atau clamp.
- `phaseDeg` ⇒ modulo 0–360.

---

# 5) Risiko & Mitigasi

- **Conflicting scales** (jika ada scale dasar besar): Pulse menambah/mengalikan di atas **scale Basic** (cek pola yang ada; jangan ubah core).
- **Opacity stacking**: Fade harus override final opacity (bukan multiply berulang) — ikuti implementasi yang ada.
- **Perf**: semua efek pure, biaya minimal; tetap di pipeline.

---

# 6) Rollback

- Revert perubahan kecil di `LayerPipeline.ts` (jalur partial/komposisi).
- Converter mapping bisa di-revert tanpa ganggu logic.

---

# 7) Acceptance Criteria (final)

- Partial pipelines tersedia: `Basic→Pulse`, `Basic→Fade`, dan kombinasi penuh.
- **Pulse** hanya memodulasi **scale**; **Fade** hanya memodulasi **opacity**.
- Efek hanya aktif jika **enabled**.
- Urutan efek konsisten dengan Spin/Orbit/Clock; **typecheck lulus**; **stages tidak diubah**.

---

# 8) Quick Testing Matrix

| Case | Config                             | Expected                                                      |
| ---- | ---------------------------------- | ------------------------------------------------------------- |
| A    | Pulse OFF, Fade OFF                | Scale/opacity = Basic                                         |
| B    | Pulse ON (uniform, amp=0.1, 1Hz)   | Scale naik-turun halus                                        |
| C    | Pulse ON (xy, ampX=0.2, ampY=0.05) | Scale X-Y berosilasi berbeda (jika mode xy ada)               |
| D    | Fade ON (min=0.3, max=1, 0.5Hz)    | Opacity berosilasi 0.3–1                                      |
| E    | Spin+Orbit+Clock+Pulse+Fade        | Rotasi/posisi sesuai, scale/opacity dimodulasi, tanpa konflik |

---

## Konfirmasi singkat (sebelum eksekusi)

1. **Urutan efek final** yang kamu mau kunci: **Basic → Spin → Orbit → Clock → Pulse → Fade** (OK?)
2. **Unit frekuensi** di repo: pakai `frequencyHz` atau `rpm` untuk Pulse/Fade? (pilih salah satu biar konsisten)
3. **Mode Pulse** yang tersedia di kode: ada `uniform` & `xy`? (kalau hanya uniform, kita pakai uniform saja)

jawab 1–3, aku lanjut eksekusi sesuai plan ini — konsisten, tanpa file baru, dan hanya pakai kode yang sudah ada.

oke, langsung to the point.

# File baru yang akan ditambahkan

**Default (sesuai aturanmu: jangan nambah yang gak perlu):**

- **Tidak ada file baru yang wajib.**
  Semua bisa jalan pakai file existing di `shared/layer` + `shared/stages` + `yuzha/src`.

**Kalau kamu MAU opsi tambahan (opsional, hanya jika disetujui):**

- (Opsional) `shared/layer/runtime.snapshot.json` — snapshot hasil convert (buat debugging/persist), **tidak wajib**.
- (Opsional) Helper kecil **tanpa file baru**:
  - **Clock anchor** (angle→border): ditambah **di file existing** `shared/layer/LayerMappingImage.ts`.
  - **time→angle** (sec|min|hour): ditambah **di file existing** `shared/layer/LayerPipeline.ts`.

> Catatan: dua helper di atas **bukan file baru**—hanya **penambahan fungsi** pada file yang sudah ada. Perlu **izinmu** sebelum ditambah.

# Workflow terbaru (config-first, UI → converter → logic → render)

1. **User input (human-friendly)**
   `yuzha/src/configUI/main.json` _(kamu edit di sini)_

2. **Converter (existing)**
   `shared/layer/LayerConverter.ts`
   - Translate **UI JSON → LibraryConfig** (Stage, LayerBasic, Spin, Orbit, Clock, Pulse, Fade).
   - Default/fallback diisi di converter (contoh: Spin ON tanpa param ⇒ **diam**).

3. **Orchestrator (host display)**
   `yuzha/src/MainScreen.tsx`
   - **Baca `configUI/main.json` → panggil Converter (in-memory)** → dapat **LibraryConfig**.
   - Pilih pipeline sesuai flags:
     - Basic saja → `produceBasic`
     - Basic→Spin → `produceBasicSpin`
     - Basic→Spin→Orbit → `produceBasicSpinOrbit`
     - Basic→Spin→Orbit→Clock → (jalur Clock di `LayerPipeline.ts`)
     - (+ Pulse/Fade di ujung bila aktif)

   - Kirim hasil `LayerData[]` ke Stages.

4. **Logic (existing)**
   `shared/layer/*`
   - **Basic**: `LayerLogicBasic.ts` + Mapping + Resolver + Validator via `produceBasic`.
   - **Spin/Orbit/Pulse/Fade**: `LayerLogic*.ts` via pipelines partial.
   - **Clock**: wrapper di `LayerPipeline.ts` (pakai anchor angle→border + time→angle jika aktif).

5. **Renderer/Display (stabil, unchanged)**
   `shared/stages/*` + `yuzha/src/StagesCanvasLayer.tsx`
   - Terima `LayerData[]` → render → display.

# Status perubahan file (ringkas)

- **\[UPDATED]** `shared/layer/LayerConverter.ts` (mapping UI ↔ runtime untuk Spin/Orbit/Clock/Pulse/Fade).
- **\[UPDATED]** `yuzha/src/MainScreen.tsx` (baca UI JSON → convert → pilih pipeline → render).
- **\[UNCHANGED]** semua di `shared/stages/*`.
- **\[UNCHANGED]** logic lain di `shared/layer/*` (kecuali jika kamu izinkan helper Clock dimasukkan ke file existing di atas).

# Butuh konfirmasi (biar lanjut eksekusi tanpa nyasar)

1. **Tambahkan helper kecil** di **file existing**:
   - angle→border (Clock anchor) **di `LayerMappingImage.ts`** — OK?
   - time→angle (sec|min|hour) **di `LayerPipeline.ts`** — OK?

2. Urutan efek final tetap: **Basic → Spin → Orbit → Clock → Pulse → Fade** — OK?

jawab 1–2, aku langsung jalanin sesuai workflow ini tanpa nambah file yang gak perlu.
