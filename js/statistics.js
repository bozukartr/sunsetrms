// İstatistikler modülü
const istatistikler = {
    kullanımVerileri: [],
    filtre: 'gunluk',
    
    // Grafik nesneleri
    kullanımGrafik: null,
    yogunlukGrafik: null,
    garsonGrafik: null,
    
    init: function() {
        this.olayDinleyicileriEkle();
        this.verileriYukle();
        this.grafikleriCiz();
    },
    
    olayDinleyicileriEkle: function() {
        const filtreSelect = document.getElementById('istatistik-filtre');
        if (filtreSelect) {
            filtreSelect.addEventListener('change', (e) => {
                this.filtre = e.target.value;
                this.grafikleriCiz();
            });
        }
        
        const raporBtn = document.getElementById('rapor-indir');
        if (raporBtn) {
            raporBtn.addEventListener('click', this.raporIndir.bind(this));
        }
    },
    
    verileriYukle: function() {
        // Kayıtlı kullanım verilerini yükle
        const veriler = localStorage.getItem('rms_kullanim');
        if (veriler) {
            this.kullanımVerileri = JSON.parse(veriler);
        }
    },
    
    guncelle: function() {
        this.verileriYukle();
        this.grafikleriCiz();
    },
    
    filtreliVerileriAl: function() {
        const simdi = new Date();
        let minTarih;
        
        switch (this.filtre) {
            case 'gunluk':
                minTarih = new Date(simdi);
                minTarih.setHours(0, 0, 0, 0);
                break;
            case 'haftalik':
                minTarih = new Date(simdi);
                minTarih.setDate(simdi.getDate() - 7);
                break;
            case 'aylik':
                minTarih = new Date(simdi);
                minTarih.setMonth(simdi.getMonth() - 1);
                break;
            default:
                minTarih = new Date(0); // Tüm veriler
        }
        
        return this.kullanımVerileri.filter(veri => {
            const tarih = new Date(veri.cikisZamani);
            return tarih >= minTarih;
        });
    },
    
    grafikleriCiz: function() {
        const filtreliVeriler = this.filtreliVerileriAl();
        
        // Ortalama kullanım süresini göster
        this.ortalamaKullanımSuresiGoster(filtreliVeriler);
        
        // Kullanım süresi dağılımı grafiği
        this.kullanımGrafiğiniCiz(filtreliVeriler);
        
        // Yoğunluk grafiği
        this.yogunlukGrafiğiniCiz(filtreliVeriler);
        
        // Garson performans grafiği
        this.garsonGrafiğiniCiz(filtreliVeriler);
    },
    
    ortalamaKullanımSuresiGoster: function(veriler) {
        const ortKullanimElement = document.getElementById('ort-kullanim');
        
        if (veriler.length === 0) {
            ortKullanimElement.textContent = '0 dk';
            return;
        }
        
        // Ortalama kullanım süresini hesapla
        const toplamSure = veriler.reduce((toplam, veri) => toplam + veri.sure, 0);
        const ortalamaSure = Math.round(toplamSure / veriler.length);
        
        // Saat ve dakika olarak formatla
        const saat = Math.floor(ortalamaSure / 60);
        const dakika = ortalamaSure % 60;
        
        if (saat > 0) {
            ortKullanimElement.textContent = `${saat} sa ${dakika} dk`;
        } else {
            ortKullanimElement.textContent = `${dakika} dk`;
        }
    },
    
    kullanımGrafiğiniCiz: function(veriler) {
        const canvas = document.getElementById('kullanim-grafik');
        if (!canvas) return;
        
        // Kullanım süre aralıklarını belirle
        const sureler = [
            { label: '0-30 dk', count: 0 },
            { label: '30-60 dk', count: 0 },
            { label: '1-2 saat', count: 0 },
            { label: '2+ saat', count: 0 }
        ];
        
        // Verileri kategorize et
        veriler.forEach(veri => {
            const sure = veri.sure;
            
            if (sure <= 30) {
                sureler[0].count++;
            } else if (sure <= 60) {
                sureler[1].count++;
            } else if (sure <= 120) {
                sureler[2].count++;
            } else {
                sureler[3].count++;
            }
        });
        
        // Grafiği çiz
        if (this.kullanımGrafik) {
            this.kullanımGrafik.destroy();
        }
        
        this.kullanımGrafik = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: sureler.map(s => s.label),
                datasets: [{
                    label: 'Masa Kullanım Süresi',
                    data: sureler.map(s => s.count),
                    backgroundColor: [
                        'rgba(189, 147, 249, 0.6)',
                        'rgba(98, 114, 164, 0.6)',
                        'rgba(139, 233, 253, 0.6)',
                        'rgba(255, 85, 85, 0.6)'
                    ],
                    borderColor: [
                        'rgba(189, 147, 249, 1)',
                        'rgba(98, 114, 164, 1)',
                        'rgba(139, 233, 253, 1)',
                        'rgba(255, 85, 85, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },
    
    yogunlukGrafiğiniCiz: function(veriler) {
        const canvas = document.getElementById('yogunluk-grafik');
        if (!canvas) return;
        
        // Saatlik yoğunluk analizi
        const saatAralıkları = [];
        for (let i = 10; i <= 22; i++) {
            saatAralıkları.push({
                label: `${i}:00`,
                count: 0
            });
        }
        
        // Verileri saatlere göre grupla
        veriler.forEach(veri => {
            const girisTarihi = new Date(veri.girisZamani);
            const saat = girisTarihi.getHours();
            
            // 10:00 - 22:00 arası saatler için veri topluyoruz
            if (saat >= 10 && saat <= 22) {
                saatAralıkları[saat - 10].count++;
            }
        });
        
        // Grafiği çiz
        if (this.yogunlukGrafik) {
            this.yogunlukGrafik.destroy();
        }
        
        this.yogunlukGrafik = new Chart(canvas, {
            type: 'line',
            data: {
                labels: saatAralıkları.map(s => s.label),
                datasets: [{
                    label: 'Masa Açılma Sayısı',
                    data: saatAralıkları.map(s => s.count),
                    fill: true,
                    backgroundColor: 'rgba(80, 250, 123, 0.2)',
                    borderColor: 'rgba(80, 250, 123, 1)',
                    tension: 0.3,
                    pointBackgroundColor: 'rgba(80, 250, 123, 1)',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },
    
    garsonGrafiğiniCiz: function(veriler) {
        const canvas = document.getElementById('garson-grafik');
        if (!canvas) return;
        
        // Garson verilerini grupla
        const garsonVerileri = {};
        
        veriler.forEach(veri => {
            const garsonId = veri.garsonId;
            if (garsonId) {
                if (!garsonVerileri[garsonId]) {
                    const garson = MasaYardimci.garsonuBul(garsonId);
                    garsonVerileri[garsonId] = {
                        ad: garson.ad,
                        masaSayisi: 0
                    };
                }
                garsonVerileri[garsonId].masaSayisi++;
            }
        });
        
        const garsonlar = Object.values(garsonVerileri).sort((a, b) => b.masaSayisi - a.masaSayisi);
        
        // Grafiği çiz
        if (this.garsonGrafik) {
            this.garsonGrafik.destroy();
        }
        
        this.garsonGrafik = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: garsonlar.map(g => g.ad),
                datasets: [{
                    data: garsonlar.map(g => g.masaSayisi),
                    backgroundColor: [
                        'rgba(189, 147, 249, 0.8)',
                        'rgba(80, 250, 123, 0.8)',
                        'rgba(255, 85, 85, 0.8)',
                        'rgba(139, 233, 253, 0.8)',
                        'rgba(255, 184, 108, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });
    },
    
    raporIndir: function() {
        const filtreliVeriler = this.filtreliVerileriAl();
        if (filtreliVeriler.length === 0) {
            alert('İndirilecek rapor verisi bulunmamaktadır.');
            return;
        }
        
        // Rapor başlığını hazırla
        let rapor = 'Restoran Yönetim Sistemi - İstatistik Raporu\n';
        rapor += `Tarih: ${new Date().toLocaleDateString('tr-TR')}\n`;
        rapor += `Filtre: ${this.filtreAdiGetir()}\n\n`;
        
        // Ortalama kullanım süresi
        const toplamSure = filtreliVeriler.reduce((toplam, veri) => toplam + veri.sure, 0);
        const ortalamaSure = Math.round(toplamSure / filtreliVeriler.length);
        rapor += `Ortalama Masa Kullanım Süresi: ${Math.floor(ortalamaSure / 60)} saat ${ortalamaSure % 60} dakika\n\n`;
        
        // Garson bazında masa sayıları
        rapor += 'Garson Başına Masa Sayısı:\n';
        const garsonVerileri = {};
        
        filtreliVeriler.forEach(veri => {
            const garsonId = veri.garsonId;
            if (garsonId) {
                if (!garsonVerileri[garsonId]) {
                    const garson = MasaYardimci.garsonuBul(garsonId);
                    garsonVerileri[garsonId] = {
                        ad: garson.ad,
                        masaSayisi: 0
                    };
                }
                garsonVerileri[garsonId].masaSayisi++;
            }
        });
        
        Object.values(garsonVerileri).forEach(garson => {
            rapor += `- ${garson.ad}: ${garson.masaSayisi} masa\n`;
        });
        
        // Masa kullanım detayları
        rapor += '\nMasa Kullanım Detayları:\n';
        rapor += 'Masa No, Giriş Zamanı, Çıkış Zamanı, Süre (dk), Misafir Sayısı, Garson\n';
        
        filtreliVeriler.forEach(veri => {
            const giris = new Date(veri.girisZamani).toLocaleString('tr-TR');
            const cikis = new Date(veri.cikisZamani).toLocaleString('tr-TR');
            const garson = veri.garsonId ? MasaYardimci.garsonuBul(veri.garsonId).ad : '-';
            
            rapor += `${veri.masaNo}, ${giris}, ${cikis}, ${veri.sure}, ${veri.misafirSayisi}, ${garson}\n`;
        });
        
        // Raporu indir
        const blob = new Blob([rapor], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `restoran-rapor-${this.filtre}-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    filtreAdiGetir: function() {
        switch (this.filtre) {
            case 'gunluk': return 'Günlük';
            case 'haftalik': return 'Haftalık';
            case 'aylik': return 'Aylık';
            default: return 'Tümü';
        }
    }
};

// Sayfa yüklendiğinde istatistik modülünü başlat
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('istatistikler')) {
        istatistikler.init();
    }
}); 