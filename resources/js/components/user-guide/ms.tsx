import { Badge } from '@/components/ui/badge';
import type { GuideSection } from '@/components/user-guide/en';
import { Kbd } from '@/components/user-guide/en';

/** Bahasa Melayu user guide: mirrors en.tsx section for section (same ids and order). */
export const sections: GuideSection[] = [
    {
        id: 'journey',
        title: 'Dari mula hingga akhir',
        wide: true,
        body: (
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                    <h3 className="font-semibold">
                        A. Sediakan sekali (admin)
                    </h3>
                    <ol className="ml-5 list-decimal space-y-1.5">
                        <li>
                            <b>Admin → Pasukan</b>, kemudian{' '}
                            <b>Admin → Pengguna</b>: tambah semua orang dengan
                            peranan (Admin, Pengurus jualan, Wakil jualan) dan
                            pasukan.
                        </li>
                        <li>
                            <b>Admin → Produk</b>: katalog anda dengan harga dan
                            cukai.
                        </li>
                        <li>
                            Pilihan: <b>Medan tersuai</b> untuk apa-apa maklumat
                            tambahan, <b>Cuti</b> untuk jam SLA,{' '}
                            <b>Aliran kerja</b> (cth. sebut harga dengan diskaun
                            melebihi 15% perlu kelulusan),{' '}
                            <b>Borang laman web</b> di laman anda,{' '}
                            <b>Peti mel</b> (peti mel sokongan → kes, peti mel
                            jualan → draf sebut harga), dan <b>Webhook</b> /
                            token API untuk sistem lain.
                        </li>
                    </ol>
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold">B. Dapatkan pelanggan</h3>
                    <ol className="ml-5 list-decimal space-y-1.5" start={4}>
                        <li>
                            <b>Prospek</b> masuk: Tambah prospek, Import, borang
                            laman web anda, atau pengirim tidak dikenali dalam
                            Peti masuk → Cipta prospek.
                        </li>
                        <li>
                            Usahakannya: <b>Log aktiviti</b> untuk setiap
                            panggilan, mesyuarat atau tugasan dengan tarikh
                            akhir (ia dipaparkan dalam Tugasan dan Kalendar),{' '}
                            <b>Hantar e-mel</b>, tambah nota, dan ubah statusnya
                            Baharu → Dihubungi → Layak.
                        </li>
                        <li>
                            <b>Tukar</b> prospek: anda mendapat akaun, kenalan
                            dan urus niaga.
                        </li>
                        <li>
                            Gerakkan <b>urus niaga</b> di sepanjang papan
                            apabila ia berkembang; papan pemuka menunjukkan
                            saluran jualan anda.
                        </li>
                        <li>
                            Pada urus niaga, <b>Cipta sebut harga</b>, tambah
                            baris produk dan simpan. Jika perlu kelulusan,
                            pengurus akan meluluskannya. Kemudian{' '}
                            <b>Cetak / PDF</b>, hantar kepada pelanggan dan{' '}
                            <b>Tanda dihantar</b>.
                        </li>
                        <li>
                            Pelanggan bersetuju: tanda sebut harga{' '}
                            <b>Diterima</b> dan seret urus niaga ke{' '}
                            <b>Menang</b>.
                        </li>
                    </ol>
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold">C. Kekalkan pelanggan</h3>
                    <ol className="ml-5 list-decimal space-y-1.5" start={10}>
                        <li>
                            Pada akaun, <b>Tambah kontrak</b>: sebut harga,
                            tempoh, nilai dan berapa hari sebelum tamat untuk
                            mengingatkan anda.
                        </li>
                        <li>
                            Sokongan: pelanggan menghantar e-mel ke peti mel
                            sokongan anda (kes dibuka dengan sendirinya), atau
                            anda gunakan <b>Buka kes</b> pada akaun. Usahakannya
                            dan <b>Selesaikan</b> sebelum SLA tamat.
                        </li>
                        <li>
                            Sebelum kontrak tamat, anda menerima tugasan dan
                            e-mel “Perbaharui …”: buka kontrak,{' '}
                            <b>Perbaharui sebagai urus niaga</b>, dan anda
                            kembali ke langkah 7.
                        </li>
                    </ol>
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold">D. Setiap hari</h3>
                    <ul className="ml-5 list-disc space-y-1.5">
                        <li>
                            Mula di <b>Tugasan</b> (atau <b>Kalendar</b>):
                            selesaikan yang lewat dan yang perlu siap hari ini.
                        </li>
                        <li>
                            Semak nombor merah <b>Kes</b>: itu kes yang telah
                            melepasi SLA.
                        </li>
                        <li>
                            Pengurus: <b>Papan pemuka</b> untuk saluran jualan,{' '}
                            <b>Laporan</b> untuk yang lain, dan sebut harga yang
                            menunggu kelulusan anda.
                        </li>
                    </ul>
                </div>
            </div>
        ),
    },
    {
        id: 'start',
        title: 'Cara menggunakan',
        body: (
            <>
                <p>
                    Bar atas memuatkan setiap bahagian. Tekan <Kbd>⌘K</Kbd> (
                    <Kbd>Ctrl K</Kbd> pada Windows) di mana-mana untuk mencari
                    prospek, kenalan, akaun, urus niaga, kes atau kontrak
                    mengikut nama, nombor, e-mel atau telefon, atau untuk terus
                    ke sesuatu halaman.
                </p>
                <p>
                    Apa yang anda lihat bergantung pada peranan anda:{' '}
                    <b>wakil jualan</b> melihat rekod mereka sendiri,{' '}
                    <b>pengurus jualan</b> melihat rekod pasukan mereka, dan{' '}
                    <b>admin</b> melihat semuanya. Rekod orang lain tidak akan
                    dipaparkan.
                </p>
                <p>
                    Nombor merah pada bar ialah perkara yang memerlukan
                    perhatian anda: <b>Kes</b> yang melepasi SLA dan{' '}
                    <b>Tugasan</b> yang perlu siap hari ini atau sudah lewat.
                </p>
            </>
        ),
    },
    {
        id: 'lists',
        title: 'Senarai',
        body: (
            <ul>
                <li>
                    Cari, tapis mengikut pemilik, status dan sebarang medan
                    tersuai jenis senarai juntai atau ya/tidak, dan klik
                    pengepala lajur untuk mengisih (termasuk medan tersuai).
                </li>
                <li>
                    <b>Paparan</b> menyimpan carian, penapis dan susunan semasa
                    di bawah satu nama, untuk anda sahaja.
                </li>
                <li>
                    <b>Lajur</b> menyembunyikan atau menunjukkan lajur; dua
                    butang di sebelahnya bertukar antara senarai dan grid (kad).
                </li>
                <li>
                    Menu <b>⋯</b> pada setiap baris memuatkan Edit dan Padam;
                    klik nama untuk membuka rekod.
                </li>
                <li>
                    Prospek, kenalan dan akaun mempunyai <b>Import</b> (CSV,
                    anda padankan lajur) dan <b>Eksport</b> (apa yang dipaparkan
                    dalam senarai sekarang), serta <b>Cari pendua</b> untuk
                    menggabungkan salinan medan demi medan.
                </li>
            </ul>
        ),
    },
    {
        id: 'records',
        title: 'Halaman rekod',
        body: (
            <>
                <p>Setiap rekod dibuka dengan tab:</p>
                <ul>
                    <li>
                        <b>Gambaran keseluruhan</b> — butiran dan rekod
                        berkaitan.
                    </li>
                    <li>
                        <b>Aktiviti</b> — panggilan, mesyuarat, tugasan dan
                        e-mel; tandakan untuk menandakannya selesai.
                    </li>
                    <li>
                        <b>Nota</b> dan <b>Fail</b> — apa sahaja yang perlu
                        disimpan.
                    </li>
                    <li>
                        <b>Sejarah</b> — siapa mengubah apa, dan bila.
                    </li>
                </ul>
                <p>
                    <b>Hantar e-mel</b> pada rekod menghantar dari CRM dengan
                    nama anda, balasan masuk ke peti mel anda sendiri, dan e-mel
                    itu dilog pada rekod.
                </p>
            </>
        ),
    },
    {
        id: 'leads',
        title: 'Prospek',
        body: (
            <>
                <p>
                    Prospek ialah seseorang yang mungkin membeli. Tambah mereka
                    dengan <b>Tambah prospek</b>, atau biarkan borang laman web
                    anda menciptanya. Jika seseorang dengan e-mel, telefon atau
                    nama yang sama sudah wujud, anda akan diberi amaran supaya
                    boleh menggabungkannya dengan <b>Cari pendua</b>.
                </p>
                <p>
                    Setelah layak, tekan <b>Tukar</b>: CRM mencipta kenalan,
                    memautkan atau mencipta akaun, dan boleh membuka urus niaga
                    dalam satu langkah. Prospek yang ditukar kekal sebagai
                    rujukan dan dipautkan kepada rekod baharunya.
                </p>
            </>
        ),
    },
    {
        id: 'accounts',
        title: 'Akaun dan kenalan',
        body: (
            <p>
                <b>Akaun</b> ialah syarikat; <b>kenalan</b> ialah orangnya.
                Halaman akaun menyenaraikan kenalan, urus niaga, kes dan
                kontraknya, dengan butang untuk menambah kenalan, membuka kes
                atau menambah kontrak yang sudah dipautkan kepadanya.
            </p>
        ),
    },
    {
        id: 'deals',
        title: 'Urus niaga',
        body: (
            <>
                <p>
                    Urus niaga dibuka pada <b>papan</b>: seret kad ke peringkat
                    lain (atau gunakan menunya). Mengalihkannya ke Menang atau
                    Kalah akan menutupnya. Setiap peringkat menetapkan
                    kebarangkalian menang, supaya papan pemuka boleh menunjukkan
                    saluran jualan berwajaran. Beralih ke <b>senarai</b> untuk
                    mengisih, memilih lajur dan paparan tersimpan.
                </p>
                <p>
                    Pada urus niaga, <b>Cipta sebut harga</b> memulakan sebut
                    harga dengan akaun dan kenalan sudah diisi.
                </p>
            </>
        ),
    },
    {
        id: 'quotes',
        title: 'Sebut harga',
        body: (
            <>
                <p>
                    Tambah baris daripada senarai produk atau taip sendiri;
                    jumlah, diskaun dan cukai dikira untuk anda. Sebut harga
                    bergerak Draf → <b>Tanda dihantar</b> → <b>Diterima</b> atau{' '}
                    <b>Ditolak</b>. <b>Cetak / PDF</b> memberikan halaman kemas
                    untuk dicetak atau disimpan sebagai PDF.
                </p>
                <p>
                    Jika syarikat anda mempunyai peraturan kelulusan (contohnya,
                    diskaun melebihi 15%), sebut harga yang sepadan menunjukkan{' '}
                    <Badge variant="warning">Menunggu kelulusan</Badge> dan
                    dikunci sehingga pengurus meluluskan atau menolaknya dengan
                    sebab. Mengedit sebut harga yang telah diluluskan memerlukan
                    kelulusan semula.
                </p>
                <p>
                    Apabila draf sebut harga dihidupkan pada peti mel jualan,
                    Claude membaca permintaan sebut harga daripada pelanggan
                    sedia ada dan menyediakan draf sebut harga untuk anda. E-mel
                    dipaparkan di bawah draf; item yang tidak dapat dipadankan
                    diberi harga 0 dan disenaraikan dalam nota. Semak setiap
                    baris sebelum menghantarnya. Tiada apa yang dihantar dengan
                    sendirinya.
                </p>
            </>
        ),
    },
    {
        id: 'cases',
        title: 'Kes (sokongan)',
        body: (
            <>
                <p>
                    Kes ialah masalah pelanggan. Keutamaannya menetapkan tarikh
                    akhir dalam masa bekerja: <b>Segera</b> 4 jam, <b>Tinggi</b>{' '}
                    1 hari bekerja, <b>Biasa</b> 3, <b>Rendah</b> 5 (hujung
                    minggu dan cuti tidak dikira). Senarai menunjukkan baki masa
                    dan bertukar merah apabila lewat.
                </p>
                <p>
                    <b>Selesaikan</b> menutupnya dan merekodkan sama ada SLA
                    dipenuhi; <b>Buka semula</b> membukanya kembali. E-mel ke
                    peti mel sokongan membuka kes dengan sendirinya; balasan
                    dalam bebenang yang sama (atau dengan nombor kes dalam
                    subjek) ditambah sebagai nota dan membuka semula kes yang
                    telah diselesaikan. Kes yang terlepas tarikh akhir
                    dieskalasikan sekali: pemiliknya dan pengurus pasukannya
                    menerima e-mel.
                </p>
            </>
        ),
    },
    {
        id: 'contracts',
        title: 'Kontrak',
        body: (
            <p>
                Rekodkan tempoh, nilai dan syarat pembaharuan setiap perjanjian.
                Beberapa hari sebelum ia tamat (30 secara lalai) pemilik
                menerima tugasan “Perbaharui …” dan e-mel.{' '}
                <b>Perbaharui sebagai urus niaga</b> membuka urus niaga untuk
                tempoh seterusnya dengan akaun dan nilai yang sama. Kontrak yang
                telah tamat bertukar kepada Luput dengan sendirinya.
            </p>
        ),
    },
    {
        id: 'tasks',
        title: 'Tugasan dan kalendar',
        body: (
            <>
                <p>
                    <b>Tugasan</b> menyenaraikan aktiviti anda mengikut Lewat,
                    Hari ini, Akan datang, Tiada tarikh dan Selesai.{' '}
                    <b>Log aktiviti</b> menambah satu; tandakan apabila selesai.
                </p>
                <p>
                    <b>Kalendar</b> menunjukkan sebulan. Klik aktiviti untuk
                    mengeditnya, gunakan <b>+</b> pada sesuatu hari untuk
                    menambah, atau seret ke hari lain untuk menjadualkan semula
                    (masanya kekal). Pengurus boleh beralih ke kalendar semua
                    orang atau seorang sahaja.
                </p>
            </>
        ),
    },
    {
        id: 'reports',
        title: 'Papan pemuka dan laporan',
        body: (
            <p>
                <b>Papan pemuka</b> menunjukkan saluran jualan terbuka dan
                berwajaran, kemenangan dan prospek baharu bulan ini, tugasan
                anda yang perlu disiapkan dan urus niaga yang hampir ditutup.{' '}
                <b>Laporan</b> membolehkan anda memilih jenis rekod,
                mengumpulkannya (mengikut pemilik, peringkat, status, sumber,
                bulan…), mengira atau menjumlahkannya, mengehadkan tarikh, dan
                mengeksport hasilnya sebagai CSV.
            </p>
        ),
    },
    {
        id: 'settings',
        title: 'Tetapan anda',
        body: (
            <ul>
                <li>
                    <b>Profil</b> — nama dan e-mel.
                </li>
                <li>
                    <b>Keselamatan</b> — tukar kata laluan dan hidupkan log
                    masuk dua faktor. Terlupa? Gunakan <b>Lupa kata laluan</b>{' '}
                    pada halaman log masuk.
                </li>
                <li>
                    <b>Penampilan</b> — cerah, gelap atau ikut peranti anda.
                </li>
                <li>
                    <b>Token API</b> — benarkan sistem lain membaca (atau
                    mengubah) rekod sebagai anda. Salin token semasa ia
                    dipaparkan; ia tidak akan dipaparkan lagi. Batalkannya untuk
                    menyekat akses serta-merta.
                </li>
            </ul>
        ),
    },
    {
        id: 'catalog',
        title: 'Produk, borang laman web dan peti masuk',
        who: 'catalog',
        body: (
            <ul>
                <li>
                    <b>Produk</b> — katalog yang digunakan oleh sebut harga:
                    nama, SKU, harga dan cukai.
                </li>
                <li>
                    <b>Borang laman web</b> — cipta borang, tampal kod benamnya
                    di laman anda, dan setiap penghantaran menjadi prospek
                    dengan mesejnya sebagai nota.
                </li>
                <li>
                    <b>Peti masuk</b> — e-mel yang dibaca daripada peti mel
                    anda. Tukar pengirim tidak dikenali menjadi prospek dengan{' '}
                    <b>Cipta prospek</b>, semak draf sebut harga (e-mel
                    dipaparkan di bawah sebut harga), dan <b>Cuba AI semula</b>{' '}
                    untuk apa-apa yang gagal.
                </li>
            </ul>
        ),
    },
    {
        id: 'admin',
        title: 'Pentadbiran',
        who: 'admin',
        body: (
            <ul>
                <li>
                    <b>Pengguna</b> dan <b>Pasukan</b> — tambah orang, tetapkan
                    peranan dan pasukan mereka. Pengurus melihat rekod pasukan
                    mereka.
                </li>
                <li>
                    <b>Medan tersuai</b> — medan tambahan pada mana-mana jenis
                    rekod. Tidak aktif menyembunyikan medan tetapi mengekalkan
                    nilainya; Padam membuang kedua-duanya.
                </li>
                <li>
                    <b>Aliran kerja</b> — “apabila rekod dicipta/dikemas kini
                    dan syarat ini sepadan, maka tetapkan medan, cipta tugasan,
                    hantar e-mel, atau wajibkan kelulusan sebut harga.” Syarat
                    boleh menguji mana-mana medan (ialah, bukan, lebih atau
                    kurang daripada, mengandungi, kosong, berubah). Teks tugasan
                    dan e-mel boleh menggunakan nilai rekod, seperti{' '}
                    <code>{'{first_name}'}</code>, serta{' '}
                    <code>{'{owner}'}</code> dan pautan dengan{' '}
                    <code>{'{url}'}</code>.
                </li>
                <li>
                    <b>Cuti</b> — hari yang tidak dikira oleh jam SLA. Waktu
                    bekerja ditetapkan pada pelayan.
                </li>
                <li>
                    <b>Peti mel</b> — sambungkan peti mel sokongan atau jualan
                    (untuk Gmail: imap.gmail.com, port 993, SSL dan kata laluan
                    aplikasi). Pilih sama ada e-melnya membuka kes dan sama ada
                    permintaan sebut harga menjadi draf sebut harga. Gunakan{' '}
                    <b>Uji sambungan</b>, kemudian hidupkannya; ia dibaca setiap
                    5 minit.
                </li>
                <li>
                    <b>Webhook</b> — maklumkan sistem lain apabila rekod
                    berubah. Pilih acara, berikan rahsia tandatangan kepada
                    penerima, dan gunakan <b>Hantar ujian</b>.
                </li>
            </ul>
        ),
    },
];
