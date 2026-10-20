'use strict';
/* =====================================================================
   TiketKu — script.js
   ---------------------------------------------------------------------
   PETUNJUK MEMBACA KODE (cari penanda ini dengan Ctrl+F)
     [STRUCT]     Bagian 1 — struct Tiket dan struct Booking
     [ARRAY]      Bagian 2 — daftarTiket, daftarBooking, state.view
     [POINTER]    Bagian 3 — class Pointer, alamat memori fiktif
     [RECORDER]   Bagian 4 — perekam langkah algoritma (untuk log)
     [SORTING]    Bagian 5 — Bubble Sort
     [SEARCHING]  Bagian 6 — Linear Search
     [TERMINAL]   Bagian 7 — panel Terminal Log Algoritma
     [INSPECTOR]  Bagian 8 — Memory Inspector (array di memori)
   Bagian lain: konfigurasi (0), state & pipeline (9), aksi (10),
   render UI (11), event & inisialisasi (12).
   ===================================================================== */


/* =====================================================================
   0. UTILITAS & KONFIGURASI
   ===================================================================== */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const rp = n => 'Rp' + n.toLocaleString('id-ID');
const rpShort = n => n >= 1e6 ? (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'jt' : Math.round(n / 1000) + 'rb';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const hex = n => '0x' + n.toString(16).toUpperCase().padStart(8, '0');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shortName = (t, max = 20) => t.nama.length > max ? t.nama.slice(0, max - 1) + '…' : t.nama;

// Konfigurasi tiap kategori layanan
const KAT = {
  hotel:   { label:'Hotel',      judul:'Hotel tersedia',       satuan:'malam', waktu:'Check-in',  jumlah:'Jumlah malam',     tgl:'Tanggal check-in',  kode:'HTL', ph:'Nama hotel atau kota, mis. bandung',       maxJml:14 },
  kereta:  { label:'Kereta Api', judul:'Kereta api tersedia',  satuan:'orang', waktu:'Berangkat', jumlah:'Jumlah penumpang', tgl:'Tanggal berangkat', kode:'KRT', ph:'Nama kereta atau stasiun, mis. gambir',    maxJml:6 },
  pesawat: { label:'Pesawat',    judul:'Penerbangan tersedia', satuan:'orang', waktu:'Berangkat', jumlah:'Jumlah penumpang', tgl:'Tanggal berangkat', kode:'PSW', ph:'Maskapai atau kota, mis. denpasar',        maxJml:6 }
};
const MODE_LABEL = { 'harga-asc':'Harga termurah', 'harga-desc':'Harga termahal', 'rating-desc':'Rating tertinggi' };

// Foto dari Unsplash. Jika gagal dimuat (offline / ID tidak ada), gambar
// cadangan SVG dipakai otomatis oleh handler "error" di bagian 12.
const unsplash = id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=720&q=70`;
const FOTO = {
  hotel:   ['1566073771259-6a8506099945','1551882547-ff40c63fe5fa','1542314831-068cd1dbfeeb','1520250497591-112f2f40a3f4','1564501049412-61c2a3083791','1582719478250-c89cae4dc85b','1590490360182-c33d57733427','1445019980597-93fa8acb246c'],
  kereta:  ['1474487548417-781cb71495f3','1515165562839-978bbcf18277','1527684651001-731c474bbb5a','1535535112387-56ffe8db21ff','1541625602330-2277a4c46182','1532105956626-a115e2b2a8d6'],
  pesawat: ['1436491865332-7a61a109cc05','1464037866556-6812c9d1c72e','1530521954074-e64f6810b32d','1569154941061-e231b4725ef1','1517479149777-5f3b1511d5ad','1544016768-982d1554f0b9','1556388158-158ea5ccacbd','1540962351504-03099e0a754b']
};
const foto = (kat, i) => unsplash(FOTO[kat][i % FOTO[kat].length]);

// Gambar cadangan (SVG data-URI) per kategori
const ICON_PATH = {
  hotel:   '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16"/><path d="M15 10h4a1 1 0 0 1 1 1v10"/><path d="M2 21h20M8 8h3M8 12h3M8 16h3"/>',
  kereta:  '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 21l2-4M16 21l-2-4"/>',
  pesawat: '<path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2 3.4 7.6l6.4 3.6-3.1 3.1-2.9-.4L2.4 15.5l4.1 1.9 1.9 4.1 1.6-1.4-.4-2.9 3.1-3.1 3.6 6.4z"/>'
};
function fotoCadangan(kat){
  const w = { hotel:['#BBD6F8','#E8F1FD'], kereta:['#FBE3A6','#FFF4D6'], pesawat:['#BDEBD6','#E3F7EE'] }[kat] || ['#CBD8EA','#EEF3FA'];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${w[0]}"/><stop offset="1" stop-color="${w[1]}"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><g transform="translate(134 74) scale(2.2)" fill="none" stroke="#0064D2" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".55">${ICON_PATH[kat] || ''}</g></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
const PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>';
const XICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';


/* =====================================================================
   [STRUCT] 1. STRUCT
   ---------------------------------------------------------------------
   JavaScript tidak punya `struct` seperti C. Kita meniru dengan fungsi
   "constructor" yang mengembalikan objek dengan field tetap, setara:

       struct Tiket {
           char id[12];  char kategori[8];  char nama[32];  char lokasi[40];
           int harga;    int hargaCoret;    float rating;    int ulasan;
           char jam[6];  char info[24];     char *foto;      char status[10];
       };

   Parameter berupa objek meniru "designated initializer" C99:
       Tiket t = { .id = "HTL-001", .harga = 850000, ... };

   Setiap struct juga mendapat `addr`, alamat memori FIKTIF dari malloc()
   buatan kita, agar konsep pointer bisa dilihat di Memory Inspector.
   ===================================================================== */
const SIZEOF_TIKET   = 128;       // ukuran fiktif struct Tiket (byte)
const SIZEOF_BOOKING = 96;        // ukuran fiktif struct Booking (byte)
let heapPtr = 0x2A4F0000;         // alamat awal "heap" fiktif

// malloc() fiktif: "mengalokasikan" memori lalu mengembalikan alamatnya
function malloc(size){
  const alamat = heapPtr;
  heapPtr += size;
  return alamat;
}

// struct Tiket
function Tiket(f){
  return {
    id: f.id, kategori: f.kategori, nama: f.nama, lokasi: f.lokasi,
    harga: f.harga, hargaCoret: f.hargaCoret || 0,
    rating: f.rating, ulasan: f.ulasan, jam: f.jam, info: f.info || '',
    foto: f.foto,
    status: 'tersedia',                 // 'tersedia' | 'dipesan'
    addr: malloc(SIZEOF_TIKET)          // alamat memori fiktif struct ini
  };
}

// struct Booking. Field `tiket` adalah POINTER (referensi) ke struct Tiket,
// bukan salinan. Jika status tiket berubah, Booking langsung melihatnya.
let bookingCounter = 0;
function Booking(kode, tiket, pemesan, tanggal, jumlah, metode){
  bookingCounter++;
  return {
    idBooking: `BK-${kode}-${String(bookingCounter).padStart(4, '0')}`,
    tiket,                              // pointer -> struct Tiket
    pemesan, tanggal, jumlah, metode,
    total: tiket.harga * jumlah,
    addr: malloc(SIZEOF_BOOKING)
  };
}


/* =====================================================================
   [ARRAY] 2. ARRAY
   ---------------------------------------------------------------------
   daftarTiket   : array berisi SEMUA struct Tiket (hotel, kereta, pesawat).
   daftarBooking : array berisi pesanan (struct Booking).
   state.view    : array berisi POINTER ke struct Tiket yang sedang tampil
                   (hasil filter, searching, dan sorting).
   Operasi array yang dipakai: push(), splice(), filter(), slice(),
   findIndex(), indexOf(), map().
   ===================================================================== */
const daftarTiket = [
  // ----- Hotel: harga per malam, jam = check-in -----
  Tiket({ id:'HTL-001', kategori:'hotel', nama:'Hotel Santika Premiere', lokasi:'Bandung',    harga:850000,  hargaCoret:1000000, rating:4.5, ulasan:2184, jam:'14:00', info:'Sarapan gratis',    foto:foto('hotel',0) }),
  Tiket({ id:'HTL-002', kategori:'hotel', nama:'Ibis Styles Airport',   lokasi:'Tangerang',  harga:520000,                      rating:4.3, ulasan:1530, jam:'14:00', info:'Dekat bandara',     foto:foto('hotel',1) }),
  Tiket({ id:'HTL-003', kategori:'hotel', nama:'The Alana Hotel',       lokasi:'Surabaya',   harga:780000,  hargaCoret:920000,  rating:4.6, ulasan:962,  jam:'14:00', info:'Kolam renang',      foto:foto('hotel',2) }),
  Tiket({ id:'HTL-004', kategori:'hotel', nama:'Mercure Kuta',          lokasi:'Bali',       harga:1250000, hargaCoret:1480000, rating:4.7, ulasan:3012, jam:'15:00', info:'Dekat pantai',      foto:foto('hotel',3) }),
  Tiket({ id:'HTL-005', kategori:'hotel', nama:'Hotel Tentrem',         lokasi:'Yogyakarta', harga:1650000,                     rating:4.8, ulasan:1877, jam:'14:00', info:'Spa & kolam renang',foto:foto('hotel',4) }),
  Tiket({ id:'HTL-006', kategori:'hotel', nama:'POP! Hotel Stasiun Kota',lokasi:'Jakarta',   harga:310000,                      rating:4.0, ulasan:2650, jam:'13:00', info:'Dekat stasiun',     foto:foto('hotel',5) }),
  Tiket({ id:'HTL-007', kategori:'hotel', nama:'Favehotel Braga',       lokasi:'Bandung',    harga:420000,  hargaCoret:495000,  rating:4.2, ulasan:1204, jam:'14:00', info:'Pusat kota',        foto:foto('hotel',6) }),
  Tiket({ id:'HTL-008', kategori:'hotel', nama:'Aston Inn Pandanaran',  lokasi:'Semarang',   harga:590000,                      rating:4.4, ulasan:745,  jam:'14:00', info:'Sarapan gratis',    foto:foto('hotel',7) }),
  // ----- Kereta api: harga per orang, jam = berangkat -----
  Tiket({ id:'KRT-001', kategori:'kereta', nama:'Argo Bromo Anggrek', lokasi:'Gambir → Surabaya Pasarturi',    harga:560000,                     rating:4.7, ulasan:3410, jam:'08:20', info:'Eksekutif',  foto:foto('kereta',0) }),
  Tiket({ id:'KRT-002', kategori:'kereta', nama:'Argo Parahyangan',   lokasi:'Gambir → Bandung',               harga:150000,                     rating:4.5, ulasan:2890, jam:'06:30', info:'Eksekutif',  foto:foto('kereta',1) }),
  Tiket({ id:'KRT-003', kategori:'kereta', nama:'Taksaka',            lokasi:'Yogyakarta → Gambir',            harga:480000, hargaCoret:540000,  rating:4.4, ulasan:1320, jam:'20:35', info:'Eksekutif',  foto:foto('kereta',2) }),
  Tiket({ id:'KRT-004', kategori:'kereta', nama:'Gajayana',           lokasi:'Malang → Gambir',                harga:640000,                     rating:4.6, ulasan:1710, jam:'17:40', info:'Eksekutif',  foto:foto('kereta',3) }),
  Tiket({ id:'KRT-005', kategori:'kereta', nama:'Turangga',           lokasi:'Bandung → Surabaya Gubeng',      harga:520000,                     rating:4.3, ulasan:980,  jam:'18:25', info:'Eksekutif',  foto:foto('kereta',4) }),
  Tiket({ id:'KRT-006', kategori:'kereta', nama:'Sancaka',            lokasi:'Yogyakarta → Surabaya Gubeng',   harga:245000,                     rating:4.2, ulasan:2140, jam:'07:00', info:'Bisnis',     foto:foto('kereta',5) }),
  Tiket({ id:'KRT-007', kategori:'kereta', nama:'Bima',               lokasi:'Gambir → Surabaya Gubeng',       harga:590000, hargaCoret:650000,  rating:4.5, ulasan:1560, jam:'16:30', info:'Eksekutif',  foto:foto('kereta',0) }),
  Tiket({ id:'KRT-008', kategori:'kereta', nama:'Lodaya',             lokasi:'Bandung → Solo Balapan',         harga:310000,                     rating:4.1, ulasan:870,  jam:'07:45', info:'Bisnis',     foto:foto('kereta',2) }),
  // ----- Pesawat: harga per orang, jam = berangkat -----
  Tiket({ id:'PSW-001', kategori:'pesawat', nama:'Garuda Indonesia GA-326', lokasi:'Jakarta (CGK) → Surabaya (SUB)',     harga:1250000,                    rating:4.8, ulasan:5120, jam:'06:00', info:'Bagasi 20 kg',  foto:foto('pesawat',0) }),
  Tiket({ id:'PSW-002', kategori:'pesawat', nama:'Lion Air JT-690',         lokasi:'Jakarta (CGK) → Surabaya (SUB)',     harga:780000,                     rating:3.9, ulasan:4380, jam:'07:15', info:'Tanpa bagasi',  foto:foto('pesawat',1) }),
  Tiket({ id:'PSW-003', kategori:'pesawat', nama:'Citilink QG-810',         lokasi:'Surabaya (SUB) → Denpasar (DPS)',    harga:640000,  hargaCoret:720000, rating:4.2, ulasan:1890, jam:'09:40', info:'Bagasi 20 kg',  foto:foto('pesawat',2) }),
  Tiket({ id:'PSW-004', kategori:'pesawat', nama:'Batik Air ID-6510',       lokasi:'Jakarta (CGK) → Denpasar (DPS)',     harga:1180000,                    rating:4.5, ulasan:2760, jam:'10:25', info:'Bagasi 20 kg',  foto:foto('pesawat',3) }),
  Tiket({ id:'PSW-005', kategori:'pesawat', nama:'AirAsia QZ-7510',         lokasi:'Jakarta (CGK) → Medan (KNO)',        harga:890000,                     rating:4.0, ulasan:3120, jam:'12:05', info:'Tanpa bagasi',  foto:foto('pesawat',4) }),
  Tiket({ id:'PSW-006', kategori:'pesawat', nama:'Super Air Jet IU-761',    lokasi:'Jakarta (CGK) → Yogyakarta (YIA)',   harga:690000,  hargaCoret:790000, rating:4.1, ulasan:1450, jam:'13:30', info:'Bagasi 15 kg',  foto:foto('pesawat',5) }),
  Tiket({ id:'PSW-007', kategori:'pesawat', nama:'Garuda Indonesia GA-404', lokasi:'Denpasar (DPS) → Jakarta (CGK)',     harga:1420000,                    rating:4.7, ulasan:3980, jam:'15:10', info:'Bagasi 20 kg',  foto:foto('pesawat',6) }),
  Tiket({ id:'PSW-008', kategori:'pesawat', nama:'Wings Air IW-1812',       lokasi:'Surabaya (SUB) → Banyuwangi (BWX)',  harga:560000,                     rating:4.0, ulasan:640,  jam:'16:45', info:'Bagasi 15 kg',  foto:foto('pesawat',7) })
];
const daftarBooking = [];


/* =====================================================================
   [POINTER] 3. POINTER (simulasi)
   ---------------------------------------------------------------------
   Pointer di C menyimpan ALAMAT sebuah data. Di JavaScript kita meniru:
     class Pointer   : menyimpan array + indeks aktif   Tiket *ptr = &arr[i];
     deref()         : meniru  *ptr   (ambil struct yang ditunjuk)
     next() / prev() : meniru  ptr++  dan  ptr--
     address         : alamat memori fiktif struct yang ditunjuk

   Model memori yang dipakai di Memory Inspector:
     - Setiap struct Tiket berada di alamat heap (0x2A4F....), hasil malloc().
     - Array `view` adalah ARRAY OF POINTER: tiap slot (8 byte) berisi
       alamat sebuah struct. Slot ke-i berada di VIEW_BASE + i * 8.
     - Saat Bubble Sort "menukar", yang bertukar adalah ISI SLOT (alamat),
       bukan struct-nya. Struct tetap di tempatnya.
   Pointer juga dipakai oleh: Linear Search (kursor `ptr`), form pesanan
   (`ptrTerpilih`), dan Booking.tiket (pointer ke struct Tiket).
   ===================================================================== */
const VIEW_BASE = 0x7FFE1000;       // alamat awal array `view` (fiktif)
const SLOT = 8;                     // ukuran satu slot pointer (byte)

class Pointer {
  constructor(arr, index = 0){ this.arr = arr; this.index = index; }
  deref(){ return this.arr[this.index] ?? null; }                        // *ptr
  get address(){ const t = this.deref(); return t ? hex(t.addr) : 'NULL'; }
  get valid(){ return this.index >= 0 && this.index < this.arr.length; }
  next(){ this.index++; return this; }                                   // ptr++
  prev(){ this.index--; return this; }                                   // ptr--
}


/* =====================================================================
   [RECORDER] 4. PEREKAM LANGKAH ALGORITMA
   ---------------------------------------------------------------------
   Algoritma sorting dan searching bekerja SEKALI dan mencatat setiap
   langkahnya ke Recorder (teks log, snapshot array, warna sel, dan
   indeks ptrA/ptrB). Lalu pemutar (putar()) menayangkan catatan itu ke
   Terminal Log dan Memory Inspector secara berurutan.
   Jika `enabled = false`, algoritma tetap jalan tetapi tidak merekam.
   ===================================================================== */
class Recorder {
  constructor(enabled){
    this.enabled = enabled;
    this.steps = []; this.cmps = 0; this.swaps = 0;
    this.fixed = new Set();                      // indeks yang posisinya sudah final
  }
  add(text, tag, arr, marks = {}, a = -1, b = -1){
    if (!this.enabled) return;
    const m = {};
    this.fixed.forEach(i => { m[i] = 'sorted'; });
    Object.assign(m, marks);
    this.steps.push({ text, tag, order: arr.slice(), marks: m, a, b });
  }
}


/* =====================================================================
   [SORTING] 5. BUBBLE SORT
   ---------------------------------------------------------------------
   Cara kerja: bandingkan dua elemen bertetangga (arr[j] dan arr[j+1]).
   Jika urutannya salah, tukar. Setelah satu pass, elemen terakhir yang
   belum final "menggelembung" ke posisinya. Jika satu pass tidak menukar
   apa pun, array sudah terurut dan proses berhenti lebih awal.
   Kompleksitas: O(n²) terburuk, O(n) jika data sudah terurut. Stabil.

   Yang ditukar adalah POINTER di dalam array, jadi struct Tiket tidak
   disalin dan alamat memorinya tidak berubah.
   ===================================================================== */
// harusSetelah(a, b): true jika a harus berada SETELAH b, artinya perlu ditukar
function harusSetelah(a, b, mode){
  if (mode === 'harga-asc')  return a.harga > b.harga;     // termurah di depan
  if (mode === 'harga-desc') return a.harga < b.harga;     // termahal di depan
  return a.rating < b.rating;                              // rating tertinggi di depan
}
const nilai = (t, mode) => mode.startsWith('rating') ? '★' + t.rating.toFixed(1) : rp(t.harga);

function bubbleSort(data, mode, rec){
  const arr = data.slice();                  // kerja di salinan array pointer
  const n = arr.length;
  rec.add(`bubble_sort(): n = ${n}, urutan = ${MODE_LABEL[mode]}. Yang ditukar adalah pointer di slot array.`, 'info', arr);
  if (n < 2){
    rec.add('Array kurang dari 2 elemen, tidak ada yang perlu diurutkan.', 'done', arr);
    return arr;
  }
  for (let pass = 0; pass < n - 1; pass++){
    let adaTukar = false;
    rec.add(`Pass ${pass + 1}: bandingkan pasangan sampai indeks [${n - pass - 1}]`, 'info', arr);
    for (let j = 0; j < n - pass - 1; j++){
      rec.cmps++;
      const A = arr[j], B = arr[j + 1];
      const salahUrut = harusSetelah(A, B, mode);
      rec.add(`Bandingkan [${j}] ${A.nama} (${nilai(A, mode)}) dengan [${j + 1}] ${B.nama} (${nilai(B, mode)}): ${salahUrut ? 'salah urut' : 'sudah benar'}`,
              'cmp', arr, { [j]: 'cmp', [j + 1]: 'cmp' }, j, j + 1);
      if (salahUrut){
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];           // tukar dua POINTER
        rec.swaps++; adaTukar = true;
        rec.add(`Tukar slot [${j}] dan [${j + 1}]: alamat ${hex(A.addr)} dan ${hex(B.addr)} bertukar tempat`,
                'swap', arr, { [j]: 'swap', [j + 1]: 'swap' }, j, j + 1);
      }
    }
    rec.fixed.add(n - pass - 1);
    rec.add(`Pass ${pass + 1} selesai: indeks [${n - pass - 1}] sudah final (${arr[n - pass - 1].nama})`, 'keep', arr);
    if (!adaTukar){
      rec.add('Tidak ada pertukaran pada pass ini, array sudah terurut. Berhenti lebih awal.', 'keep', arr);
      break;
    }
  }
  for (let i = 0; i < n; i++) rec.fixed.add(i);
  rec.add(`Bubble Sort selesai: ${rec.cmps} perbandingan, ${rec.swaps} pertukaran. Kompleksitas O(n²).`, 'done', arr);
  return arr;
}


/* =====================================================================
   [SEARCHING] 6. LINEAR SEARCH
   ---------------------------------------------------------------------
   Cara kerja: periksa elemen satu per satu dari indeks 0 sampai akhir.
   Setiap elemen yang cocok dimasukkan ke array hasil. Tidak butuh data
   terurut. Kompleksitas: O(n).

   Pencocokan:
     input teks  -> cocok jika ada di nama atau lokasi (tanpa beda huruf)
     input angka -> cocok jika harga <= angka itu (anggaran maksimal)

   Pointer `ptr` dipakai untuk berjalan di array:
     ptr.deref() mengambil elemen saat ini, ptr.next() maju satu elemen.
   ===================================================================== */
// "500000", "500.000", atau "Rp 500.000" -> 500000. Bukan angka -> null.
function parseHarga(q){
  if (!/^(rp\.?\s*)?[\d.,\s]+$/i.test(q)) return null;
  const n = parseInt(q.replace(/\D/g, ''), 10);
  return Number.isFinite(n) && n >= 1000 ? n : null;
}

function linearSearch(data, q, rec){
  const hasil = [];
  const maxHarga = parseHarga(q);
  const kunci = q.toLowerCase();
  const marks = {};
  rec.add(`linear_search(): cari ${maxHarga !== null ? `harga ≤ ${rp(maxHarga)}` : `"${q}" pada nama atau lokasi`} di ${data.length} elemen. Periksa indeks 0 sampai akhir.`, 'info', data);
  if (!data.length){
    rec.add('Array kosong (setelah filter), tidak ada yang diperiksa.', 'warn', data);
    return hasil;
  }
  const ptr = new Pointer(data, 0);                       // Tiket *ptr = &data[0];
  while (ptr.valid){                                      // selama ptr belum lewat akhir array
    const t = ptr.deref();                                // *ptr
    const i = ptr.index;
    rec.cmps++;
    const cocok = maxHarga !== null
      ? t.harga <= maxHarga
      : (t.nama + ' ' + t.lokasi).toLowerCase().includes(kunci);
    marks[i] = cocok ? 'found' : 'checked';
    if (cocok) hasil.push(t);                             // simpan pointer, bukan salinan
    rec.add(`Memeriksa indeks [${i}] ${t.nama} (ptr ${ptr.address})... ${cocok ? 'Data ditemukan!' : 'Tidak cocok'}`,
            cocok ? 'hit' : 'miss', data, { ...marks }, i, -1);
    ptr.next();                                           // ptr++
  }
  rec.add(`Linear Search selesai: ${hasil.length} data cocok dari ${data.length} elemen, ${rec.cmps} perbandingan. Kompleksitas O(n).`, 'done', data, { ...marks });
  return hasil;
}


/* =====================================================================
   [TERMINAL] 7. TERMINAL LOG ALGORITMA
   ===================================================================== */
const TAG = { cmd:'$', info:'INFO', filter:'FILTER', cmp:'BANDING', swap:'TUKAR', keep:'LEWAT', hit:'COCOK', miss:'TIDAK', done:'SELESAI', mem:'MEMORI', warn:'CEK' };
let nomorBaris = 0;

function termLine(text, tag = 'info'){
  const box = $('#termLog');
  const row = document.createElement('div');
  row.className = 'tl tl-' + (TAG[tag] ? tag : 'info');
  const n = document.createElement('span'); n.className = 'tl-n';
  n.textContent = tag === 'cmd' ? '' : String(++nomorBaris).padStart(3, '0');
  const g = document.createElement('span'); g.className = 'tl-tag'; g.textContent = TAG[tag] || 'INFO';
  const x = document.createElement('span'); x.className = 'tl-tx'; x.textContent = text;
  row.append(n, g, x);
  box.appendChild(row);
  while (box.children.length > 800) box.removeChild(box.firstChild);
  box.scrollTop = box.scrollHeight;
}
function termStats(text){ $('#termStats').textContent = text; }
function termClear(){
  $('#termLog').innerHTML = '';
  nomorBaris = 0;
  termStats('Log dibersihkan.');
}
function bukaDock(buka){
  const dock = $('#dock');
  dock.dataset.open = String(buka);
  $('#dockToggle').setAttribute('aria-expanded', String(buka));
}
function setBusy(b){
  state.busy = b;
  $('#btnSort').disabled = b;
  $('#btnSearch').disabled = b;
  $('#btnSkip').hidden = !b;
  const st = $('#termStatus');
  st.textContent = b ? 'RUNNING' : 'IDLE';
  st.classList.toggle('run', b);
}

// Memutar catatan Recorder ke Terminal Log + Memory Inspector, langkah demi langkah
async function putar(rec, id){
  const speed = +$('#speed').value;
  state.skip = speed === 0;
  setBusy(true);
  const steps = rec.steps;
  for (let n = 0; n < steps.length; n++){
    if (id !== state.runId) return false;                 // dibatalkan oleh aksi lain
    const s = steps[n];
    termLine(s.text, s.tag);
    const terakhir = n === steps.length - 1;
    if (!state.skip || terakhir){                         // saat "Lewati", gambar hanya langkah akhir
      state.insp = { order: s.order, marks: s.marks, a: s.a, b: s.b };
      renderInspector();
    }
    if (!state.skip) await sleep(speed);
  }
  return id === state.runId;
}


/* =====================================================================
   9. STATE & PIPELINE DATA
   ---------------------------------------------------------------------
   Urutan pemrosesan data yang tampil:
     sumber() -> filter harga/rating/ketersediaan (Array.filter)
              -> Linear Search jika ada kata kunci
              -> Bubble Sort jika ada kriteria urut
   Log hanya dicatat untuk tahap yang barusan dipicu pengguna
   (tombol Cari atau Urutkan). Tahap lain dihitung ulang tanpa log.
   ===================================================================== */
const state = {
  kategori: 'hotel',
  query: '', sortMode: null,
  minHarga: 0, maxHarga: 0, batas: { lo: 0, hi: 0 },
  minRating: 0, hanyaTersedia: false,
  view: [],                       // array pointer yang tampil
  aktif: null,                    // ptrAktif: tiket yang dipilih (klik kartu)
  terpilih: null,                 // ptrTerpilih: Pointer ke tiket di form pesanan
  insp: { order: [], marks: {}, a: -1, b: -1 },   // isi Memory Inspector
  busy: false, skip: false, runId: 0
};

// sumber(): array pointer ke semua tiket di kategori aktif
const sumber = () => daftarTiket.filter(t => t.kategori === state.kategori);

const lolosFilter = t =>
  t.harga >= state.minHarga && t.harga <= state.maxHarga &&
  t.rating >= state.minRating &&
  (!state.hanyaTersedia || t.status === 'tersedia');

function hitungView(opsi = {}){
  let data = sumber().filter(lolosFilter);                // filter biasa, bukan algoritma pencarian
  let recSearch = null, recSort = null;
  if (state.query){
    recSearch = new Recorder(!!opsi.logSearch);
    data = linearSearch(data, state.query, recSearch);    // [SEARCHING]
  }
  if (state.sortMode){
    recSort = new Recorder(!!opsi.logSort);
    data = bubbleSort(data, state.sortMode, recSort);     // [SORTING]
  }
  return { data, recSearch, recSort };
}

function idleInspector(){
  state.insp = { order: state.view, marks: {}, a: -1, b: -1 };
}

// Hitung ulang view tanpa log, lalu gambar ulang
function refresh(){
  const sedangJalan = state.busy;
  state.runId++;                                          // batalkan animasi yang berjalan
  setBusy(false);
  if (sedangJalan) termLine('Proses sebelumnya dibatalkan karena kriteria berubah.', 'warn');
  state.view = hitungView().data;
  if (!state.aktif) state.aktif = state.view[0] ?? null;
  idleInspector();
  renderHasil();
  renderInspector();
}


/* =====================================================================
   [INSPECTOR] 8. DEBUGGER & MEMORY INSPECTOR
   ===================================================================== */
function renderInspector(){
  const { order, marks, a, b } = state.insp;

  // --- Array di memori: array of pointer, tiap slot berisi alamat struct ---
  $('#memMeta').textContent = order.length
    ? `&view[0] = ${hex(VIEW_BASE)}, length = ${order.length}, ${SLOT} byte per slot (Tiket *)`
    : 'length = 0';
  $('#memArray').innerHTML = order.length ? order.map((t, i) => {
    const tags = [];
    if (i === a) tags.push('ptrA');
    if (i === b) tags.push('ptrB');
    if (t === state.aktif) tags.push('ptrAktif');
    return `<button type="button" class="mcell ${marks[i] || ''}${t === state.aktif ? ' is-active' : ''}" data-id="${t.id}" title="Slot &view[${i}] berada di ${hex(VIEW_BASE + i * SLOT)}">
      <span class="m-idx">[${i}]</span>
      <span class="m-name">${esc(shortName(t))}</span>
      <span class="m-val">${rpShort(t.harga)}, ★${t.rating.toFixed(1)}</span>
      <span class="m-addr">→ ${hex(t.addr)}</span>
      <span class="m-tags">${tags.map(x => `<span>▲${x}</span>`).join('')}</span>
    </button>`;
  }).join('') : '<p class="mem-empty">Array kosong (length = 0). Tidak ada pointer di memori.</p>';
}


/* =====================================================================
   10. AKSI PENGGUNA
   ===================================================================== */
// Tombol "Urutkan": jalankan Bubble Sort dengan log
async function aksiUrutkan(){
  if (state.busy) return;
  const mode = $('#sortMode').value;
  state.sortMode = mode;
  const h = hitungView({ logSort: true });
  bukaDock(true);
  const id = ++state.runId;
  termLine(`bubble_sort(view, "${mode}")`, 'cmd');
  const selesai = await putar(h.recSort, id);
  if (!selesai) return;
  state.view = h.data;
  setBusy(false);
  termStats(`Bubble Sort, O(n²), n = ${h.data.length}, perbandingan: ${h.recSort.cmps}, pertukaran: ${h.recSort.swaps}`);
  renderHasil();
  renderInspector();
}

// Tombol "Cari": jalankan Linear Search dengan log
async function aksiCari(e){
  if (e) e.preventDefault();
  if (state.busy) return;
  const q = $('#q').value.trim();
  const input = $('#q');
  input.classList.remove('err');
  if (!q){
    input.classList.add('err'); input.focus();
    toast('Masukkan nama, lokasi, atau harga dulu.');
    return;
  }
  state.query = q;
  const h = hitungView({ logSearch: true });
  bukaDock(true);
  const id = ++state.runId;
  termLine(`linear_search(view, "${q}")`, 'cmd');
  const selesai = await putar(h.recSearch, id);
  if (!selesai) return;
  state.view = h.data;
  if (!state.view.includes(state.aktif)) state.aktif = state.view[0] ?? state.aktif;
  setBusy(false);
  termStats(`Linear Search, O(n), perbandingan: ${h.recSearch.cmps}, ditemukan: ${h.data.length}`);
  renderHasil();
  renderInspector();
  $('#hasil').scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function resetSemua(pesan){
  state.query = ''; state.sortMode = null;
  state.minRating = 0; state.hanyaTersedia = false;
  $('#q').value = ''; $('#q').classList.remove('err');
  $('input[name="rating"][value="0"]').checked = true;
  $('#onlyAvail').checked = false;
  aturRentang();
  refresh();
  if (pesan) termLine(pesan, 'info');
}

function setKategori(kat){
  if (!KAT[kat] || kat === state.kategori) return;
  state.kategori = kat;
  state.aktif = null;
  resetSemua(`Kategori diganti ke ${KAT[kat].label}: view = daftarTiket.filter(kategori === "${kat}"), ${state.view.length} pointer.`);
}

/* ---------- Filter harga (slider ganda) & rating ---------- */
function aturRentang(){
  const harga = sumber().map(t => t.harga);
  const lo = Math.floor(Math.min(...harga) / 50000) * 50000;
  const hi = Math.ceil(Math.max(...harga) / 50000) * 50000;
  state.batas = { lo, hi };
  for (const el of [$('#minHarga'), $('#maxHarga')]){ el.min = lo; el.max = hi; el.step = 10000; }
  $('#minHarga').value = lo; $('#maxHarga').value = hi;
  bacaSlider();
}
function bacaSlider(dari){
  const minEl = $('#minHarga'), maxEl = $('#maxHarga');
  let a = +minEl.value, b = +maxEl.value;
  if (a > b){                                    // thumb tidak boleh saling melewati
    if (dari === 'min') a = b; else b = a;
    minEl.value = a; maxEl.value = b;
  }
  state.minHarga = a; state.maxHarga = b;
  const { lo, hi } = state.batas;
  const span = (hi - lo) || 1;
  const dual = $('#dual');
  dual.style.setProperty('--lo', ((a - lo) / span * 100) + '%');
  dual.style.setProperty('--hi', ((b - lo) / span * 100) + '%');
  minEl.style.zIndex = a > lo + span / 2 ? 4 : 2;    // thumb yang bertumpuk di ujung tetap bisa digeser
  maxEl.style.zIndex = 3;
  $('#minOut').textContent = rp(a);
  $('#maxOut').textContent = rp(b);
}
function catatFilter(){
  termLine(`filter: harga ${rp(state.minHarga)} sampai ${rp(state.maxHarga)}, rating ≥ ${state.minRating || 'semua'}${state.hanyaTersedia ? ', hanya tersedia' : ''} → ${state.view.length} dari ${sumber().length} pointer lolos.`, 'filter');
}

/* ---------- Booking ---------- */
function ringkasanHtml(t){
  const k = KAT[t.kategori];
  return `<img src="${t.foto}" alt="" data-kat="${t.kategori}" width="96" height="72">
    <div><b>${esc(t.nama)}</b><span>${esc(t.lokasi)}</span><span>${k.waktu} ${t.jam}</span><span class="mini-rate">★ ${t.rating.toFixed(1)}</span></div>`;
}
function bukaBooking(i){
  const ptr = new Pointer(state.view, i);                   // ptrTerpilih = &view[i]
  const t = ptr.deref();
  if (!t || t.status !== 'tersedia') return;
  state.terpilih = ptr; state.aktif = t;
  const k = KAT[t.kategori];
  termLine(`ptrTerpilih = &view[${i}] → ${ptr.address} (${t.nama})`, 'mem');
  $('#viewForm').hidden = false; $('#viewDone').hidden = true;
  $('#dlgSum').innerHTML = ringkasanHtml(t);
  $('#fTglLabel').textContent = k.tgl;
  $('#fJmlLabel').textContent = k.jumlah;
  $('#fJml').max = k.maxJml; $('#fJml').value = 1;
  const besok = new Date(Date.now() + 864e5);
  const iso = new Date(besok.getTime() - besok.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  $('#fTgl').min = iso; $('#fTgl').value = iso;
  $('#fNama').value = ''; $('#fNama').classList.remove('err'); $('#errNama').hidden = true;
  hitungTotal();
  renderCards(); renderInspector();
  $('#dlg').showModal();
  $('#fNama').focus();
}
function hitungTotal(){
  const t = state.terpilih ? state.terpilih.deref() : null;
  if (!t) return;
  const j = Math.min(+$('#fJml').max, Math.max(1, parseInt($('#fJml').value, 10) || 1));
  const hemat = t.hargaCoret ? ` (hemat ${rp((t.hargaCoret - t.harga) * j)})` : '';
  $('#rowHarga').textContent = `${rp(t.harga)} × ${j} ${KAT[t.kategori].satuan}${hemat}`;
  $('#rowHargaVal').textContent = rp(t.harga * j);
  $('#fTotal').textContent = rp(t.harga * j);
}
function ubahJumlah(delta){
  const el = $('#fJml');
  const v = (parseInt(el.value, 10) || 1) + delta;
  el.value = Math.min(+el.max, Math.max(1, v));
  hitungTotal();
}
function simpanBooking(e){
  e.preventDefault();
  const t = state.terpilih ? state.terpilih.deref() : null;   // *ptrTerpilih
  if (!t) return;
  const nama = $('#fNama').value.trim();
  const tgl = $('#fTgl').value;
  const jml = parseInt($('#fJml').value, 10);
  const max = +$('#fJml').max;
  $('#fNama').classList.toggle('err', !nama);
  $('#errNama').hidden = !!nama;
  if (!nama){ $('#fNama').focus(); return; }
  if (!tgl){ toast('Pilih tanggal terlebih dahulu.'); return; }
  if (!(jml >= 1 && jml <= max)){ toast(`${KAT[t.kategori].jumlah} harus 1 sampai ${max}.`); return; }

  const b = Booking(KAT[t.kategori].kode, t, nama, tgl, jml, $('#fMetode').value);  // b.tiket = pointer ke t
  daftarBooking.push(b);                                       // [ARRAY] push
  t.status = 'dipesan';                                        // ubah field lewat pointer: ptr->status
  bukaDock(true);
  termLine(`daftarBooking.push(${b.idBooking}) → length = ${daftarBooking.length}. Struct Booking di ${hex(b.addr)}.`, 'mem');
  termLine(`${b.idBooking}.tiket = ${hex(t.addr)}  // pointer ke struct Tiket ${t.id}, bukan salinan`, 'mem');
  termLine(`ptrTerpilih->status = "dipesan"  // field diubah lewat pointer`, 'mem');

  $('#doneId').textContent = b.idBooking;
  $('#doneSum').innerHTML = ringkasanHtml(t);
  $('#viewForm').hidden = true; $('#viewDone').hidden = false;
  refresh();
}
function batalkanBooking(idBooking){
  const idx = daftarBooking.findIndex(b => b.idBooking === idBooking);
  if (idx < 0) return;
  const [b] = daftarBooking.splice(idx, 1);                    // [ARRAY] splice: hapus + geser elemen
  b.tiket.status = 'tersedia';                                 // kembalikan status lewat pointer
  bukaDock(true);
  termLine(`daftarBooking.splice(${idx}, 1) → ${b.idBooking} dihapus, elemen setelahnya bergeser ke kiri. length = ${daftarBooking.length}.`, 'mem');
  termLine(`${b.tiket.id}->status = "tersedia"  // lewat pointer ${hex(b.tiket.addr)}`, 'mem');
  toast(`Pesanan ${b.idBooking} dibatalkan.`);
  refresh();
}


/* =====================================================================
   11. RENDER UI
   ===================================================================== */
function renderTabs(){
  $$('.tab').forEach(el => el.setAttribute('aria-selected', String(el.dataset.cat === state.kategori)));
  const k = KAT[state.kategori];
  $('#qLabel').textContent = 'Cari ' + k.label.toLowerCase();
  $('#q').placeholder = k.ph;
  $('#listTitle').textContent = k.judul;
}

function renderMeta(){
  $('#resultCount').textContent = `Menampilkan ${state.view.length} dari ${sumber().length} ${KAT[state.kategori].label.toLowerCase()}.`;
  $('#badgeCount').textContent = daftarBooking.length;
  $('#bookLen').textContent = daftarBooking.length;
}

function renderChips(){
  const c = [];
  if (state.query) c.push(['query', `Pencarian: "${state.query}"`]);
  if (state.sortMode) c.push(['sort', `Urut: ${MODE_LABEL[state.sortMode]}`]);
  if (state.minHarga > state.batas.lo || state.maxHarga < state.batas.hi) c.push(['harga', `Harga ${rpShort(state.minHarga)} sampai ${rpShort(state.maxHarga)}`]);
  if (state.minRating) c.push(['rating', `Rating ★ ${state.minRating}+`]);
  if (state.hanyaTersedia) c.push(['avail', 'Hanya yang tersedia']);
  $('#chips').innerHTML = c.map(([k, t]) =>
    `<li><button class="chip" type="button" data-chip="${k}" aria-label="Hapus kriteria ${esc(t)}">${esc(t)}${XICON}</button></li>`).join('');
}

function renderCards(){
  const k = KAT[state.kategori];
  if (!state.view.length){
    $('#grid').innerHTML = `<div class="empty"><b>Tidak ada ${k.label.toLowerCase()} yang cocok</b>Longgarkan filter harga atau rating, ubah kata kunci, atau tekan Reset untuk menampilkan semua.</div>`;
    return;
  }
  $('#grid').innerHTML = state.view.map((t, i) => {
    const ada = t.status === 'tersedia';
    const aktif = t === state.aktif;
    const diskon = t.hargaCoret ? Math.round((1 - t.harga / t.hargaCoret) * 100) : 0;
    return `
    <article class="card${aktif ? ' is-active' : ''}${ada ? '' : ' is-booked'}" data-i="${i}" tabindex="0" aria-label="${esc(t.nama)}">
      <div class="card-media">
        <img src="${t.foto}" alt="Foto ${k.label} ${esc(t.nama)}" loading="lazy" width="720" height="450" data-kat="${t.kategori}">
        ${diskon ? `<span class="promo-flag">Hemat ${diskon}%</span>` : ''}
        ${aktif ? '<span class="ptr-flag">*ptrAktif</span>' : ''}
        ${ada ? '' : '<span class="booked-flag">Sudah dipesan</span>'}
        <span class="rating-chip">★ ${t.rating.toFixed(1)} <small>(${t.ulasan.toLocaleString('id-ID')})</small></span>
      </div>
      <div class="card-body">
        <div class="card-top"><span class="kind">${k.label}</span><span class="tid">${t.id}</span></div>
        <h3>${esc(t.nama)}</h3>
        <p class="loc">${PIN}<span>${esc(t.lokasi)}</span></p>
        <ul class="facts">
          <li>${k.waktu} ${t.jam}</li>
          ${t.info ? `<li class="${/gratis/i.test(t.info) ? 'ok' : ''}">${esc(t.info)}</li>` : ''}
        </ul>
        <div class="card-foot">
          <div class="price">
            ${t.hargaCoret ? `<span class="old">${rp(t.hargaCoret)}</span>` : ''}
            <b>${rp(t.harga)}</b><small>/${k.satuan}</small>
          </div>
          <button class="btn yellow" type="button" data-book="${i}" ${ada ? '' : 'disabled'}>${ada ? 'Pesan' : 'Dipesan'}</button>
        </div>
      </div>
    </article>`;
  }).join('');
}

function renderBookings(){
  if (!daftarBooking.length){
    $('#bookBody').innerHTML = '<tr><td colspan="8" class="row-empty">Belum ada pesanan. Pilih tiket di atas, lalu klik Pesan.</td></tr>';
    return;
  }
  $('#bookBody').innerHTML = daftarBooking.map(b => {
    const t = b.tiket;                                         // dereference pointer: b->tiket
    return `<tr>
      <td><div class="t-ticket"><img src="${t.foto}" alt="" data-kat="${t.kategori}" width="56" height="42"><div><b>${esc(t.nama)}</b><small>${esc(t.lokasi)}</small></div></div></td>
      <td class="mono"><b>${b.idBooking}</b></td>
      <td>${esc(b.pemesan)}<br><small class="muted">${esc(b.metode)}</small></td>
      <td>${b.tanggal}</td>
      <td>${b.jumlah} ${KAT[t.kategori].satuan}</td>
      <td><b>${rp(b.total)}</b></td>
      <td><span class="status">Terkonfirmasi</span></td>
      <td><button class="link-danger" type="button" data-cancel="${b.idBooking}">Batalkan</button></td>
    </tr>`;
  }).join('');
}

function renderHasil(){ renderTabs(); renderMeta(); renderChips(); renderCards(); renderBookings(); }

let toastTimer;
function toast(msg){
  const el = $('#toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}


/* =====================================================================
   12. EVENT & INISIALISASI
   ===================================================================== */
// Tab kategori dan menu navigasi
$$('.tab').forEach(b => b.addEventListener('click', () => setKategori(b.dataset.cat)));
$$('.nav a[data-cat]').forEach(a => a.addEventListener('click', () => setKategori(a.dataset.cat)));

// Pencarian dan pengurutan
$('#searchForm').addEventListener('submit', aksiCari);
$('#btnSort').addEventListener('click', aksiUrutkan);
$('#btnReset').addEventListener('click', () => resetSemua('Reset: semua kriteria dihapus, view = sumber().'));
$('#btnResetFilter').addEventListener('click', () => resetSemua('Filter diatur ulang ke nilai awal.'));

// Filter
$('#minHarga').addEventListener('input', () => { bacaSlider('min'); refresh(); });
$('#maxHarga').addEventListener('input', () => { bacaSlider('max'); refresh(); });
$('#minHarga').addEventListener('change', catatFilter);
$('#maxHarga').addEventListener('change', catatFilter);
$$('input[name="rating"]').forEach(r => r.addEventListener('change', () => {
  state.minRating = +r.value; refresh(); catatFilter();
}));
$('#onlyAvail').addEventListener('change', e => {
  state.hanyaTersedia = e.target.checked; refresh(); catatFilter();
});

// Chip kriteria aktif: klik untuk menghapus satu kriteria
$('#chips').addEventListener('click', e => {
  const c = e.target.closest('[data-chip]'); if (!c) return;
  const k = c.dataset.chip;
  if (k === 'query'){ state.query = ''; $('#q').value = ''; }
  if (k === 'sort')  state.sortMode = null;
  if (k === 'harga'){ $('#minHarga').value = state.batas.lo; $('#maxHarga').value = state.batas.hi; bacaSlider(); }
  if (k === 'rating'){ state.minRating = 0; $('input[name="rating"][value="0"]').checked = true; }
  if (k === 'avail'){ state.hanyaTersedia = false; $('#onlyAvail').checked = false; }
  refresh();
  termLine(`Kriteria "${k}" dihapus → ${state.view.length} pointer di view.`, 'info');
});

// Kartu tiket: klik memilih (ptrAktif), tombol Pesan membuka form
function pilihKartu(i){
  const t = state.view[i]; if (!t) return;
  state.aktif = t;
  renderCards(); renderInspector();
}
$('#grid').addEventListener('click', e => {
  const book = e.target.closest('[data-book]');
  if (book){ bukaBooking(+book.dataset.book); return; }
  const card = e.target.closest('.card');
  if (card) pilihKartu(+card.dataset.i);
});
$('#grid').addEventListener('keydown', e => {
  if ((e.key !== 'Enter' && e.key !== ' ') || e.target.closest('button')) return;
  const card = e.target.closest('.card');
  if (card){ e.preventDefault(); pilihKartu(+card.dataset.i); }
});

// Sel memori: klik untuk menunjuknya dengan ptrAktif
$('#memArray').addEventListener('click', e => {
  const cell = e.target.closest('[data-id]'); if (!cell) return;
  const t = daftarTiket.find(x => x.id === cell.dataset.id);
  if (!t) return;
  state.aktif = t;
  termLine(`ptrAktif = ${hex(t.addr)} (${t.nama})`, 'mem');
  renderCards(); renderInspector();
});

// Tabel pesanan
$('#bookBody').addEventListener('click', e => {
  const c = e.target.closest('[data-cancel]');
  if (c) batalkanBooking(c.dataset.cancel);
});

// Modal booking
$('#bookForm').addEventListener('submit', simpanBooking);
$('#fJml').addEventListener('input', hitungTotal);
$('#btnMin').addEventListener('click', () => ubahJumlah(-1));
$('#btnPlus').addEventListener('click', () => ubahJumlah(1));
$('#dlgCancel').addEventListener('click', () => $('#dlg').close());
$('#dlgClose').addEventListener('click', () => $('#dlg').close());
$('#doneClose').addEventListener('click', () => $('#dlg').close());
$('#doneGo').addEventListener('click', () => { $('#dlg').close(); $('#pesanan').scrollIntoView({ behavior: 'smooth' }); });
$('#dlg').addEventListener('click', e => { if (e.target === $('#dlg')) $('#dlg').close(); });

// Terminal dock
$('#dockToggle').addEventListener('click', () => bukaDock($('#dock').dataset.open !== 'true'));
$('#btnClear').addEventListener('click', termClear);
$('#btnSkip').addEventListener('click', () => { state.skip = true; });
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--dock-h', $('#dock').offsetHeight + 'px');
}).observe($('#dock'));

// Gambar gagal dimuat (offline atau ID foto tidak ada) -> pakai gambar cadangan.
// Event "error" tidak bubble, jadi didengarkan pada fase capture.
document.addEventListener('error', e => {
  const img = e.target;
  if (img.tagName !== 'IMG' || img.dataset.fb) return;
  img.dataset.fb = '1';
  img.src = fotoCadangan(img.dataset.kat);
}, true);

// ----- Inisialisasi -----
termLine(`daftarTiket dibuat: ${daftarTiket.length} struct Tiket × ${SIZEOF_TIKET} byte. Alamat ${hex(daftarTiket[0].addr)} sampai ${hex(daftarTiket[daftarTiket.length - 1].addr)}.`, 'mem');
termLine('Klik "Urutkan" atau "Cari" untuk melihat proses algoritma langkah demi langkah di panel ini.', 'info');
termStats('Belum ada algoritma yang dijalankan.');
aturRentang();
refresh();
termLine(`state.view = sumber().filter(...) → ${state.view.length} pointer ke tiket ${KAT[state.kategori].label}. ptrAktif = ${state.aktif ? hex(state.aktif.addr) : 'NULL'}.`, 'mem');
