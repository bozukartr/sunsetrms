// Uygulama veri modeli
const restoran = {
    masalar: [],
    garsonlar: [
        { id: 1, ad: 'Ahmet Yılmaz' },
        { id: 2, ad: 'Ayşe Kaya' },
        { id: 3, ad: 'Mehmet Demir' }
    ],
    seciliMasa: null,
    masaId: 1
};

// Yerel depolama işlevleri
const depolama = {
    kaydet: function() {
        localStorage.setItem('rms_data', JSON.stringify({
            masalar: restoran.masalar,
            garsonlar: restoran.garsonlar,
            masaId: restoran.masaId
        }));
    },
    yukle: function() {
        const data = localStorage.getItem('rms_data');
        if (data) {
            const parsedData = JSON.parse(data);
            restoran.masalar = parsedData.masalar || [];
            restoran.garsonlar = parsedData.garsonlar || [];
            restoran.masaId = parsedData.masaId || 1;
        }
    }
};

// DOM elemanları
const DOM = {
    masaContainer: document.getElementById('masa-container'),
    bosLabel: document.getElementById('bos-masa'),
    doluLabel: document.getElementById('dolu-masa'),
    toplamLabel: document.getElementById('toplam-masa'),
    
    // Modal elemanları
    modal: document.getElementById('masa-modal'),
    modalTitle: document.getElementById('modal-title'),
    masaNo: document.getElementById('masa-no'),
    masaDurumu: document.getElementById('masa-durumu'),
    misafirForm: document.getElementById('misafir-form'),
    misafirSayisi: document.getElementById('misafir-sayisi'),
    villaForm: document.getElementById('villa-form'),
    villaNo: document.getElementById('villa-no'),
    masaGarson: document.getElementById('masa-garson'),
    masaNotlar: document.getElementById('masa-notlar'),
    masaZaman: document.getElementById('misafir-zaman'),
    girisZamani: document.getElementById('giris-zamani'),
    gecenSure: document.getElementById('gecen-sure'),
    
    // Müşteri ekle modal elemanları
    misafirModal: document.getElementById('misafir-modal'),
    misafirModalKapat: document.getElementById('misafir-modal-kapat'),
    musteriVillaNo: document.getElementById('musteri-villa-no'),
    musteriSayisi: document.getElementById('musteri-sayisi'),
    musteriGarson: document.getElementById('musteri-garson'),
    musteriNot: document.getElementById('musteri-not'),
    musteriKaydet: document.getElementById('musteri-kaydet'),
    
    // Butonlar
    masaEkleBtn: document.getElementById('masa-ekle'),
    modalKapatBtn: document.getElementById('modal-kapat'),
    masaKaydetBtn: document.getElementById('masa-kaydet'),
    masaSilBtn: document.getElementById('masa-sil'),
    misafirEkleBtn: document.getElementById('misafir-ekle'),
    misafirKaldirBtn: document.getElementById('misafir-kaldir'),
    
    // Menü
    menuItems: document.querySelectorAll('.menu li a'),
    views: document.querySelectorAll('.view')
};

// Uygulama işlevleri
const app = {
    init: function() {
        // Verileri yükle
        depolama.yukle();
        
        // Tabloları oluştur
        UI.masalariGoster();
        UI.garsonlariGoster();
        UI.durumuGuncelle();
        
        // Olay dinleyicileri ekle
        this.olayDinleyicileriEkle();
        
        // Otomatik masa süre güncelleme
        setInterval(function() {
            UI.masaSureleriniGuncelle();
        }, 60000); // Her dakika güncelle
    },
    
    olayDinleyicileriEkle: function() {
        // Masa Ekle Butonu
        DOM.masaEkleBtn.addEventListener('click', () => {
            restoran.seciliMasa = null;
            UI.masaModaliniAc('yeni');
        });
        
        // Modal Kapat Butonu
        DOM.modalKapatBtn.addEventListener('click', UI.masaModaliniKapat);
        
        // Masa Kaydet Butonu
        DOM.masaKaydetBtn.addEventListener('click', UI.masaKaydet);
        
        // Masa Sil Butonu
        DOM.masaSilBtn.addEventListener('click', UI.masaSil);
        
        // Misafir Ekle Butonu - Artık yeni modalı açacak
        DOM.misafirEkleBtn.addEventListener('click', UI.misafirModaliniAc);
        
        // Misafir Modalı Kapat Butonu
        DOM.misafirModalKapat.addEventListener('click', UI.misafirModaliniKapat);
        
        // Misafir Kaydet Butonu
        DOM.musteriKaydet.addEventListener('click', UI.misafirKaydetVeEkle);
        
        // Misafir Kaldır Butonu
        DOM.misafirKaldirBtn.addEventListener('click', UI.misafirKaldir);
        
        // Menü Tıklama
        DOM.menuItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Aktif sekmeyi değiştir
                DOM.menuItems.forEach(menuItem => {
                    menuItem.parentElement.classList.remove('active');
                });
                this.parentElement.classList.add('active');
                
                // İlgili görünümü göster
                const view = this.getAttribute('data-view');
                DOM.views.forEach(v => {
                    v.classList.remove('active');
                });
                document.getElementById(view).classList.add('active');
            });
        });
        
        // Masa durumu değişikliği
        DOM.masaDurumu.addEventListener('change', function() {
            const durum = this.value;
            if (durum === 'dolu') {
                DOM.misafirForm.style.display = 'block';
                DOM.villaForm.style.display = 'block';
                DOM.misafirEkleBtn.style.display = 'none';
                DOM.misafirKaldirBtn.style.display = 'none';
            } else {
                DOM.misafirForm.style.display = 'none';
                DOM.villaForm.style.display = 'none';
                DOM.masaZaman.style.display = 'none';
                if (durum === 'bos') {
                    DOM.misafirEkleBtn.style.display = 'inline-block';
                    DOM.misafirKaldirBtn.style.display = 'none';
                } else { // rezerve
                    DOM.misafirEkleBtn.style.display = 'none';
                    DOM.misafirKaldirBtn.style.display = 'none';
                }
            }
        });
    }
};

// Kullanıcı Arayüzü işlevleri
const UI = {
    masalariGoster: function() {
        DOM.masaContainer.innerHTML = '';
        
        // Masaları numara sırasına göre sıralayalım
        const masaSirasi = [...restoran.masalar].sort((a, b) => a.no - b.no);
        
        masaSirasi.forEach(masa => {
            const masaElement = document.createElement('div');
            masaElement.className = `masa ${masa.durum}`;
            masaElement.setAttribute('data-id', masa.id);
            
            let masaIcerik = `
                <div class="masa-no">Masa ${masa.no}</div>
                <div class="masa-durum ${masa.durum}">${MasaYardimci.durumMetni(masa.durum)}</div>`;
            
            // Doluysa müşteri bilgisi ekleme
            if (masa.durum === 'dolu') {
                const sure = MasaYardimci.gecenSureyiHesapla(masa.girisZamani);
                masaIcerik += `
                <div class="sure">${sure}</div>
                <div class="masa-bilgi">
                    <span class="misafir">Müşteri: ${masa.misafirSayisi || 1} kişi</span>
                    ${masa.villaNo ? `<span class="villa">Villa: ${masa.villaNo}</span>` : ''}
                </div>`;
            }
            
            // Garson bilgisi ekleme
            masaIcerik += `<div class="masa-garson">${masa.garsonId ? MasaYardimci.garsonuBul(masa.garsonId).ad : '-'}</div>`;
            
            masaElement.innerHTML = masaIcerik;
            
            masaElement.addEventListener('click', function() {
                const masaId = parseInt(this.getAttribute('data-id'));
                restoran.seciliMasa = masaId;
                UI.masaModaliniAc('duzenle');
            });
            
            DOM.masaContainer.appendChild(masaElement);
        });
    },
    
    garsonlariGoster: function() {
        // Masa Garson Seçenekleri
        DOM.masaGarson.innerHTML = '<option value="">Seçiniz</option>';
        
        restoran.garsonlar.forEach(garson => {
            const option = document.createElement('option');
            option.value = garson.id;
            option.textContent = garson.ad;
            DOM.masaGarson.appendChild(option);
        });
        
        // Garson Listesi (Ayarlar sekmesinde)
        const garsonListesi = document.getElementById('garson-listesi');
        if (garsonListesi) {
            garsonListesi.innerHTML = '';
            
            restoran.garsonlar.forEach(garson => {
                const garsonElement = document.createElement('div');
                garsonElement.className = 'garson-item';
                garsonElement.innerHTML = `
                    <div class="garson-bilgi">
                        <div class="avatar">${garson.ad.charAt(0)}</div>
                        <span>${garson.ad}</span>
                    </div>
                    <button class="sil-btn" data-id="${garson.id}"><i class="fas fa-trash"></i></button>
                `;
                
                const silBtn = garsonElement.querySelector('.sil-btn');
                silBtn.addEventListener('click', function() {
                    const garsonId = parseInt(this.getAttribute('data-id'));
                    UI.garsonSil(garsonId);
                });
                
                garsonListesi.appendChild(garsonElement);
            });
        }
        
        // Garson Ekleme Formu
        const garsonEkleForm = document.getElementById('garson-ekle-form');
        if (garsonEkleForm) {
            garsonEkleForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const garsonAdi = document.getElementById('garson-adi').value.trim();
                
                if (garsonAdi) {
                    const yeniGarson = {
                        id: Date.now(),
                        ad: garsonAdi
                    };
                    
                    restoran.garsonlar.push(yeniGarson);
                    depolama.kaydet();
                    UI.garsonlariGoster();
                    document.getElementById('garson-adi').value = '';
                }
            });
        }
    },
    
    durumuGuncelle: function() {
        const masalar = restoran.masalar;
        const bosMasalar = masalar.filter(masa => masa.durum === 'bos').length;
        const doluMasalar = masalar.filter(masa => masa.durum === 'dolu').length;
        
        DOM.bosLabel.textContent = bosMasalar;
        DOM.doluLabel.textContent = doluMasalar;
        DOM.toplamLabel.textContent = masalar.length;
    },
    
    masaModaliniAc: function(mod) {
        if (mod === 'yeni') {
            DOM.modalTitle.textContent = 'Yeni Masa Ekle';
            DOM.masaNo.value = restoran.masaId;
            DOM.masaDurumu.value = 'bos';
            DOM.masaGarson.value = '';
            DOM.masaNotlar.value = '';
            DOM.misafirSayisi.value = 1;
            DOM.villaNo.value = '';
            DOM.misafirForm.style.display = 'none';
            DOM.villaForm.style.display = 'none';
            DOM.masaZaman.style.display = 'none';
            DOM.masaSilBtn.style.display = 'none';
            DOM.misafirEkleBtn.style.display = 'inline-block';
            DOM.misafirKaldirBtn.style.display = 'none';
        } else if (mod === 'duzenle') {
            const masa = MasaYardimci.masayiBul(restoran.seciliMasa);
            
            if (masa) {
                DOM.modalTitle.textContent = `Masa ${masa.no} Düzenle`;
                DOM.masaNo.value = masa.no;
                DOM.masaDurumu.value = masa.durum;
                DOM.masaGarson.value = masa.garsonId || '';
                DOM.masaNotlar.value = masa.notlar || '';
                DOM.villaNo.value = masa.villaNo || '';
                DOM.masaSilBtn.style.display = 'inline-block';
                
                if (masa.durum === 'dolu') {
                    DOM.misafirForm.style.display = 'block';
                    DOM.villaForm.style.display = 'block';
                    DOM.misafirSayisi.value = masa.misafirSayisi || 1;
                    DOM.misafirEkleBtn.style.display = 'none';
                    DOM.misafirKaldirBtn.style.display = 'inline-block';
                    
                    // Zaman bilgisini göster
                    DOM.masaZaman.style.display = 'block';
                    if (masa.girisZamani) {
                        const girisTarihi = new Date(masa.girisZamani);
                        DOM.girisZamani.textContent = girisTarihi.toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        const sure = MasaYardimci.gecenSureyiHesapla(masa.girisZamani);
                        DOM.gecenSure.textContent = sure;
                    }
                } else {
                    DOM.misafirForm.style.display = 'none';
                    DOM.villaForm.style.display = 'none';
                    DOM.masaZaman.style.display = 'none';
                    
                    if (masa.durum === 'bos') {
                        DOM.misafirEkleBtn.style.display = 'inline-block';
                        DOM.misafirKaldirBtn.style.display = 'none';
                    } else { // rezerve
                        DOM.misafirEkleBtn.style.display = 'none';
                        DOM.misafirKaldirBtn.style.display = 'none';
                    }
                }
            }
        }
        
        DOM.modal.classList.add('active');
    },
    
    masaModaliniKapat: function() {
        DOM.modal.classList.remove('active');
    },
    
    masaKaydet: function() {
        const no = parseInt(DOM.masaNo.value);
        const durum = DOM.masaDurumu.value;
        const garsonId = DOM.masaGarson.value ? parseInt(DOM.masaGarson.value) : null;
        const notlar = DOM.masaNotlar.value.trim();
        const villaNo = DOM.villaNo.value.trim();
        
        if (restoran.seciliMasa === null) {
            // Yeni masa ekleme
            const yeniMasa = {
                id: Date.now(),
                no: no,
                durum: durum,
                garsonId: garsonId,
                notlar: notlar,
                villaNo: villaNo
            };
            
            if (durum === 'dolu') {
                yeniMasa.misafirSayisi = parseInt(DOM.misafirSayisi.value) || 1;
                yeniMasa.girisZamani = new Date().toISOString();
            }
            
            restoran.masalar.push(yeniMasa);
            restoran.masaId++; // Sonraki masa numarası için artır
        } else {
            // Mevcut masayı güncelleme
            const masa = MasaYardimci.masayiBul(restoran.seciliMasa);
            if (masa) {
                // Eğer durum 'dolu'dan başka bir duruma değişiyorsa
                const eskiDurum = masa.durum;
                masa.durum = durum;
                masa.notlar = notlar;
                
                if (durum === 'dolu') {
                    masa.misafirSayisi = parseInt(DOM.misafirSayisi.value) || 1;
                    masa.garsonId = garsonId;
                    masa.villaNo = villaNo;
                    
                    // Eğer daha önce giriş zamanı yoksa şimdi ekle
                    if (!masa.girisZamani) {
                        masa.girisZamani = new Date().toISOString();
                    }
                } else {
                    // Dolu değilse ilgili alanları temizle
                    if (eskiDurum === 'dolu') {
                        // İstatistikler için kullanım verilerini kaydet
                        MasaYardimci.masaKullanımKaydet(masa);
                    }
                    
                    delete masa.misafirSayisi;
                    delete masa.girisZamani;
                    delete masa.villaNo;
                    masa.garsonId = null; // Garson bilgisini temizle
                }
            }
        }
        
        // Verileri kaydet ve UI'ı güncelle
        depolama.kaydet();
        UI.masalariGoster();
        UI.durumuGuncelle();
        UI.masaModaliniKapat();
        
        // İstatistikleri güncelle (eğer mevcutsa)
        if (typeof istatistikler !== 'undefined' && istatistikler.guncelle) {
            istatistikler.guncelle();
        }
    },
    
    masaSil: function() {
        if (restoran.seciliMasa !== null) {
            if (confirm('Bu masayı silmek istediğinize emin misiniz?')) {
                const index = restoran.masalar.findIndex(masa => masa.id === restoran.seciliMasa);
                
                if (index !== -1) {
                    // Kullanım istatistikleri için veri kaydet
                    const masa = restoran.masalar[index];
                    if (masa.durum === 'dolu' && masa.girisZamani) {
                        MasaYardimci.masaKullanımKaydet(masa);
                    }
                    
                    restoran.masalar.splice(index, 1);
                    depolama.kaydet();
                    UI.masalariGoster();
                    UI.durumuGuncelle();
                    UI.masaModaliniKapat();
                    
                    // İstatistikleri güncelle (eğer mevcutsa)
                    if (typeof istatistikler !== 'undefined' && istatistikler.guncelle) {
                        istatistikler.guncelle();
                    }
                }
            }
        }
    },
    
    misafirModaliniAc: function() {
        // Misafir ekleme modalını aç ve formu sıfırla
        DOM.musteriVillaNo.value = '';
        DOM.musteriSayisi.value = '1';
        DOM.musteriNot.value = '';
        
        // Garson seçeneğini doldur
        DOM.musteriGarson.innerHTML = '<option value="">Seçiniz</option>';
        restoran.garsonlar.forEach(garson => {
            const option = document.createElement('option');
            option.value = garson.id;
            option.textContent = garson.ad;
            DOM.musteriGarson.appendChild(option);
        });
        
        DOM.misafirModal.classList.add('active');
    },
    
    misafirModaliniKapat: function() {
        DOM.misafirModal.classList.remove('active');
    },
    
    misafirKaydetVeEkle: function() {
        // Form değerlerini al
        const villaNo = DOM.musteriVillaNo.value.trim();
        const misafirSayisi = parseInt(DOM.musteriSayisi.value) || 1;
        const garsonId = DOM.musteriGarson.value ? parseInt(DOM.musteriGarson.value) : null;
        const not = DOM.musteriNot.value.trim();
        
        // Formu doğrula
        if (!villaNo) {
            alert('Lütfen villa numarasını giriniz.');
            return;
        }
        
        if (restoran.seciliMasa !== null) {
            const masa = MasaYardimci.masayiBul(restoran.seciliMasa);
            
            if (masa) {
                masa.durum = 'dolu';
                masa.misafirSayisi = misafirSayisi;
                masa.villaNo = villaNo;
                masa.garsonId = garsonId;
                masa.girisZamani = new Date().toISOString();
                
                // Not ekle
                if (not) {
                    masa.notlar = not;
                }
                
                depolama.kaydet();
                UI.masalariGoster();
                UI.durumuGuncelle();
                UI.misafirModaliniKapat();
                UI.masaModaliniKapat();
            }
        }
    },
    
    misafirKaldir: function() {
        if (restoran.seciliMasa !== null) {
            if (confirm('Misafirleri kaldırmak istediğinize emin misiniz?')) {
                const masa = MasaYardimci.masayiBul(restoran.seciliMasa);
                
                if (masa && masa.durum === 'dolu') {
                    // İstatistikler için kullanım verilerini kaydet
                    MasaYardimci.masaKullanımKaydet(masa);
                    
                    // Masayı boşalt
                    masa.durum = 'bos';
                    delete masa.misafirSayisi;
                    delete masa.girisZamani;
                    delete masa.villaNo; // Villa numarasını temizle
                    masa.garsonId = null; // Garson bilgisini temizle
                    
                    depolama.kaydet();
                    UI.masalariGoster();
                    UI.durumuGuncelle();
                    UI.masaModaliniKapat();
                    
                    // İstatistikleri güncelle (eğer mevcutsa)
                    if (typeof istatistikler !== 'undefined' && istatistikler.guncelle) {
                        istatistikler.guncelle();
                    }
                }
            }
        }
    },
    
    garsonSil: function(garsonId) {
        if (confirm('Bu garsonu silmek istediğinize emin misiniz?')) {
            const index = restoran.garsonlar.findIndex(g => g.id === garsonId);
            
            if (index !== -1) {
                restoran.garsonlar.splice(index, 1);
                
                // Bu garsona ait masaları güncelle
                restoran.masalar.forEach(masa => {
                    if (masa.garsonId === garsonId) {
                        masa.garsonId = null;
                    }
                });
                
                depolama.kaydet();
                UI.garsonlariGoster();
                UI.masalariGoster();
            }
        }
    },
    
    masaSureleriniGuncelle: function() {
        const doluMasalar = document.querySelectorAll('.masa.dolu');
        
        doluMasalar.forEach(masaElement => {
            const masaId = parseInt(masaElement.getAttribute('data-id'));
            const masa = MasaYardimci.masayiBul(masaId);
            
            if (masa && masa.girisZamani) {
                const sureElement = masaElement.querySelector('.sure');
                if (sureElement) {
                    const sure = MasaYardimci.gecenSureyiHesapla(masa.girisZamani);
                    sureElement.textContent = sure;
                }
            }
        });
    },
    
    masaBilgileriniGoster: function(masa) {
        // Detaylı görünüm için hazırlanmış şablon - şu an aktif olarak kullanılmıyor
        // Gelecekteki detaylı görünüm ekranı için hazır
        let masaDetaylari = `
            <div class="masa-detay">
                <h3>Masa ${masa.no}</h3>
                <ul>
                    <li>
                        <strong>Durum:</strong> 
                        <span class="durum-${masa.durum}">${MasaYardimci.durumMetni(masa.durum)}</span>
                    </li>`;
                    
        if (masa.durum === 'dolu') {
            const girisZamani = new Date(masa.girisZamani);
            let sureBilgisi = MasaYardimci.gecenSureyiHesapla(masa.girisZamani);
            
            masaDetaylari += `
                    <li><strong>Müşteri Sayısı:</strong> ${masa.misafirSayisi || 1}</li>
                    ${masa.villaNo ? `<li><strong>Villa No:</strong> ${masa.villaNo}</li>` : ''}
                    <li>
                        <strong>Giriş Zamanı:</strong> 
                        ${girisZamani.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}
                    </li>
                    <li>
                        <strong>Geçen Süre:</strong> 
                        <span class="gecen-sure" data-zaman="${masa.girisZamani}">${sureBilgisi}</span>
                    </li>`;
        }
        
        if (masa.garsonId) {
            const garson = MasaYardimci.garsonuBul(masa.garsonId);
            if (garson) {
                masaDetaylari += `
                    <li>
                        <strong>Garson:</strong> 
                        ${garson.ad}
                    </li>`;
            }
        }
        
        if (masa.notlar) {
            masaDetaylari += `
                    <li>
                        <strong>Notlar:</strong> 
                        <span class="notlar">${masa.notlar}</span>
                    </li>`;
        }
        
        masaDetaylari += `
                </ul>
                <div class="masa-butonlar">
                    <button class="btn btn-duzenle" onclick="UI.masaModaliniAc('duzenle', ${masa.id})">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                </div>
            </div>`;
            
        return masaDetaylari;
    }
};

// Yardımcı fonksiyonlar
const MasaYardimci = {
    masayiBul: function(masaId) {
        return restoran.masalar.find(masa => masa.id === masaId);
    },
    
    garsonuBul: function(garsonId) {
        return restoran.garsonlar.find(garson => garson.id === garsonId) || { ad: 'Bilinmiyor' };
    },
    
    durumMetni: function(durum) {
        switch (durum) {
            case 'bos': return 'Boş';
            case 'dolu': return 'Dolu';
            case 'rezerve': return 'Rezerve';
            default: return 'Bilinmiyor';
        }
    },
    
    gecenSureyiHesapla: function(girisZamani) {
        const simdi = new Date();
        const giris = new Date(girisZamani);
        const farkMs = simdi - giris;
        
        const dakika = Math.floor(farkMs / 60000);
        const saat = Math.floor(dakika / 60);
        
        if (saat > 0) {
            return `${saat} sa ${dakika % 60} dk`;
        } else {
            return `${dakika} dk`;
        }
    },
    
    masaKullanımKaydet: function(masa) {
        if (!masa.girisZamani) return;
        
        const giris = new Date(masa.girisZamani);
        const cikis = new Date();
        const sureDakika = Math.floor((cikis - giris) / 60000);
        
        // İstatistikler için kullanılan kullanım verileri
        const kullanimVerisi = {
            masaNo: masa.no,
            girisZamani: giris.toISOString(),
            cikisZamani: cikis.toISOString(),
            sure: sureDakika,
            misafirSayisi: masa.misafirSayisi || 1,
            garsonId: masa.garsonId
        };
        
        // Kullanım verilerini kaydet
        let kullanımVerileri = JSON.parse(localStorage.getItem('rms_kullanim') || '[]');
        kullanımVerileri.push(kullanimVerisi);
        localStorage.setItem('rms_kullanim', JSON.stringify(kullanımVerileri));
    }
};

// Demo veri yükleme
const demo = {
    yukle: function() {
        // Demo masalar
        restoran.masalar = [
            { id: 1, no: 1, durum: 'bos', garsonId: 1, notlar: '' },
            { id: 2, no: 2, durum: 'dolu', garsonId: 2, notlar: 'Pencere kenarı tercih edildi', misafirSayisi: 2, girisZamani: new Date(Date.now() - 45 * 60000).toISOString() },
            { id: 3, no: 3, durum: 'dolu', garsonId: 1, notlar: '', misafirSayisi: 4, girisZamani: new Date(Date.now() - 15 * 60000).toISOString() },
            { id: 4, no: 4, durum: 'rezerve', garsonId: 3, notlar: 'Doğum günü kutlaması, 20:00' },
            { id: 5, no: 5, durum: 'bos', garsonId: null, notlar: '' },
            { id: 6, no: 6, durum: 'bos', garsonId: null, notlar: '' }
        ];
        restoran.masaId = 7;
        
        // Kullanım verileri için örnek veriler
        const bugun = new Date();
        const kullanımVerileri = [];
        
        // Son 10 gün için rastgele veriler
        for (let i = 0; i < 50; i++) {
            const rastgeleMasaNo = Math.floor(Math.random() * 6) + 1;
            const rastgeleMisafirSayisi = Math.floor(Math.random() * 6) + 1;
            const rastgeleSureDakika = Math.floor(Math.random() * 120) + 30; // 30-150 dakika arası
            const rastgeleGunFark = Math.floor(Math.random() * 10); // 0-9 gün önce
            const rastgeleGarsonId = Math.floor(Math.random() * 3) + 1;
            
            const rastgeleGiris = new Date(bugun);
            rastgeleGiris.setDate(bugun.getDate() - rastgeleGunFark);
            rastgeleGiris.setHours(Math.floor(Math.random() * 12) + 10); // 10:00 - 22:00 arası
            
            const rastgeleCikis = new Date(rastgeleGiris.getTime() + rastgeleSureDakika * 60000);
            
            kullanımVerileri.push({
                masaNo: rastgeleMasaNo,
                girisZamani: rastgeleGiris.toISOString(),
                cikisZamani: rastgeleCikis.toISOString(),
                sure: rastgeleSureDakika,
                misafirSayisi: rastgeleMisafirSayisi,
                garsonId: rastgeleGarsonId
            });
        }
        
        localStorage.setItem('rms_kullanim', JSON.stringify(kullanımVerileri));
        depolama.kaydet();
        
        UI.masalariGoster();
        UI.durumuGuncelle();
        
        // İstatistikleri güncelle (eğer mevcutsa)
        if (typeof istatistikler !== 'undefined' && istatistikler.guncelle) {
            istatistikler.guncelle();
        }
        
        alert('Demo veriler yüklendi!');
    }
};

// Demo veri butonu olayı
const demoBtn = document.getElementById('demo-veri');
if (demoBtn) {
    demoBtn.addEventListener('click', demo.yukle);
}

// Düzeni sıfırlama butonu olayı
const duzenSifirlaBtn = document.getElementById('duzeni-sifirla');
if (duzenSifirlaBtn) {
    duzenSifirlaBtn.addEventListener('click', function() {
        if (confirm('Masa düzenini sıfırlamak istediğinize emin misiniz? Tüm masalar silinecek.')) {
            restoran.masalar = [];
            restoran.masaId = 1;
            depolama.kaydet();
            UI.masalariGoster();
            UI.durumuGuncelle();
            
            // İstatistikleri güncelle (eğer mevcutsa)
            if (typeof istatistikler !== 'undefined' && istatistikler.guncelle) {
                istatistikler.guncelle();
            }
        }
    });
}

// Uygulamayı başlat
document.addEventListener('DOMContentLoaded', app.init.bind(app)); 