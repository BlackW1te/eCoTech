# eCoTech - Karbon Ayak İzi Hesaplama Projesi

Bu proje, firmaların ve bireylerin karbon ayak izlerini hesaplayabilmeleri için geliştirilmiş bir web uygulamasıdır. Kullanıcılar günlük faaliyetlerinin çevreye olan etkisini ölçebilir, geçmiş hesaplamalarını takip edebilir ve istatistiksel analizler yapabilirler.

## 🚀 Özellikler

### Kullanıcı Özellikleri
- **Kullanıcı Kaydı ve Girişi**: Güvenli kullanıcı kimlik doğrulama sistemi
- **Karbon Ayak İzi Hesaplayıcı**: Çok adımlı, kullanıcı dostu hesaplama aracı
- **Dashboard**: Kişisel istatistikler ve trend analizi
- **Geçmiş Hesaplamalar**: Tüm hesaplamaların detaylı görüntülenmesi
- **İstatistiksel Analiz**: Grafik ve tablo formatında veri görselleştirme
- **Rapor İndirme**: CSV formatında rapor indirme özelliği

### Admin Özellikleri
- **Kullanıcı Yönetimi**: Kullanıcı ekleme, düzenleme, silme
- **Hesaplama Yönetimi**: Tüm hesaplamaları görüntüleme ve silme
- **Karbon Faktörleri Yönetimi**: Hesaplama faktörlerini düzenleme
- **Sistem İstatistikleri**: Genel sistem istatistikleri ve analizler

## 🛠️ Teknolojiler

### Frontend
- **HTML5**: Semantik yapı
- **CSS3**: Modern tasarım ve responsive layout
- **JavaScript (ES6+)**: Dinamik etkileşimler
- **Bootstrap 5**: UI framework
- **Chart.js**: Grafik ve görselleştirme

### Backend
- **PHP 8.0+**: Server-side logic
- **SQLite 3.x**: Dosya tabanlı veritabanı
- **PDO**: Güvenli veritabanı bağlantısı
- **JSON API**: RESTful API endpoints

## 📋 Kurulum

### Gereksinimler
- PHP 8.0 veya üzeri
- PDO SQLite eklentisi
- Web sunucusu (Apache/Nginx)
- Composer (opsiyonel)

### Adım 1: Projeyi İndirin
```bash
git clone [repository-url]
cd demircelik
```

### Adım 2: Veritabanını Kurun
1. Web tarayıcınızda `install.php` dosyasını çalıştırın:
```
http://localhost/demircelik/install.php
```
2. Kurulum otomatik olarak SQLite veritabanını oluşturacaktır

### Adım 3: Veritabanı Bağlantısını Yapılandırın
SQLite kullandığımız için ek konfigürasyon gerekmez. Veritabanı dosyası otomatik olarak `database/carbon_footprint.db` konumunda oluşturulur.

### Adım 4: Web Sunucusunu Yapılandırın
Projeyi web sunucunuzun document root'una yerleştirin veya virtual host yapılandırın.

### Adım 5: Dosya İzinlerini Ayarlayın
```bash
chmod 755 logs/
chmod 755 database/
chmod 644 database/carbon_footprint.db
```

## 🔐 Varsayılan Kullanıcılar

### Admin Kullanıcısı
- **E-posta**: admin@ecotech.com
- **Şifre**: admin123

### Demo Kullanıcısı
- **E-posta**: demo@example.com
- **Şifre**: user123

## 📊 Karbon Faktörleri

Sistem aşağıdaki varsayılan karbon faktörlerini içerir:

| Faktör | Değer | Birim | Kategori |
|--------|-------|-------|----------|
| Elektrik | 0.5 | kg CO₂e/kWh | Enerji |
| Doğal Gaz | 2.1 | kg CO₂e/m³ | Enerji |
| Su | 0.3 | kg CO₂e/m³ | Su |
| Atık | 0.5 | kg CO₂e/kg | Atık |
| Benzin | 2.3 | kg CO₂e/litre | Ulaşım |
| Dizel | 2.7 | kg CO₂e/litre | Ulaşım |

## 🗂️ Proje Yapısı

```
demircelik/
├── api/                    # API endpoints
│   ├── auth.php           # Kimlik doğrulama
│   ├── carbon_calculation.php # Karbon hesaplama
│   └── admin.php          # Admin işlemleri
├── assets/                # Statik dosyalar
│   ├── css/              # Stil dosyaları
│   ├── js/               # JavaScript dosyaları
│   ├── img/              # Görseller
│   └── vendor/           # Üçüncü parti kütüphaneler
├── config/               # Konfigürasyon dosyaları
│   └── database.php      # Veritabanı bağlantısı
├── database/             # Veritabanı dosyaları
│   └── carbon_footprint.db # SQLite veritabanı
├── includes/             # Yardımcı dosyalar
│   └── functions.php     # Genel fonksiyonlar
├── logs/                 # Log dosyaları
├── *.html               # Ana sayfalar
├── database.sql         # Veritabanı şeması
├── install.php          # Kurulum dosyası
└── README.md           # Bu dosya
```

## 🔌 API Endpoints

### Kimlik Doğrulama
- `POST /api/auth.php?action=login` - Kullanıcı girişi
- `POST /api/auth.php?action=register` - Kullanıcı kaydı
- `GET /api/auth.php?action=logout` - Çıkış

### Karbon Hesaplama
- `POST /api/carbon_calculation.php?action=calculate` - Hesaplama yap
- `POST /api/carbon_calculation.php?action=save` - Hesaplamayı kaydet
- `GET /api/carbon_calculation.php?action=history` - Geçmiş hesaplamalar
- `GET /api/carbon_calculation.php?action=factors` - Karbon faktörleri

### Admin İşlemleri
- `GET /api/admin.php?action=users` - Kullanıcı listesi
- `PUT /api/admin.php?action=users` - Kullanıcı güncelle
- `DELETE /api/admin.php?action=users&id=X` - Kullanıcı sil
- `GET /api/admin.php?action=calculations` - Hesaplama listesi
- `GET /api/admin.php?action=factors` - Faktör listesi
- `POST /api/admin.php?action=factors` - Faktör ekle
- `GET /api/admin.php?action=statistics` - İstatistikler

## 🎨 Özelleştirme

### Tema Renkleri
Ana renkleri değiştirmek için `assets/css/main.css` dosyasındaki CSS değişkenlerini düzenleyin:

```css
:root {
  --accent-color: #10bc69; /* Ana renk */
  --heading-color: #5f687b; /* Başlık rengi */
  --default-color: #444444; /* Varsayılan metin rengi */
}
```

### Karbon Faktörleri
Admin panelinden karbon faktörlerini düzenleyebilir veya `database.sql` dosyasından varsayılan değerleri değiştirebilirsiniz.

## 🔒 Güvenlik

- **Şifre Hashleme**: PHP password_hash() fonksiyonu kullanılır
- **SQL Injection Koruması**: PDO prepared statements
- **XSS Koruması**: Input sanitization
- **CSRF Koruması**: Token tabanlı koruma
- **Session Güvenliği**: Güvenli session yönetimi

## 📝 Loglama

Sistem tüm önemli işlemleri `logs/app.log` dosyasına kaydeder:
- Kullanıcı girişleri
- Hesaplama işlemleri
- Admin işlemleri
- Hata mesajları

## 🚀 Performans

- **SQLite Optimizasyonu**: Dosya tabanlı hızlı veritabanı
- **Veritabanı İndeksleri**: Hızlı sorgu performansı
- **Önbellekleme**: Statik dosyalar için browser cache
- **Optimizasyon**: Minified CSS/JS dosyaları
- **Lazy Loading**: Görsel optimizasyonu

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 📞 İletişim

Proje hakkında sorularınız için:
- **E-posta**: info@ecotech.com
- **Website**: https://ecotech.com

## 🙏 Teşekkürler

- Bootstrap Made - UI template
- Chart.js - Grafik kütüphanesi
- Bootstrap Icons - İkon seti
- Tüm katkıda bulunanlara

---

**Not**: Bu proje eğitim amaçlı geliştirilmiştir. Prodüksiyon ortamında kullanmadan önce güvenlik testlerinden geçirin.