<?php
/**
 * eCoTech - Karbon Ayak İzi Hesaplama Projesi
 * SQLite Veritabanı Kurulum Dosyası
 */

// Hata raporlamayı etkinleştir
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>eCoTech - Veritabanı Kurulum</h1>";

try {
    // Veritabanı sınıfını dahil et
    require_once 'config/database.php';
    
    $database = new Database();
    
    // Veritabanı zaten varsa kontrol et
    if ($database->databaseExists()) {
        echo "<p style='color: green;'>✅ Veritabanı zaten mevcut!</p>";
        echo "<p>Veritabanı dosyası: <code>" . realpath('../database/carbon_footprint.db') . "</code></p>";
        
        // Veritabanı bağlantısını test et
        $db = $database->getConnection();
        if ($db) {
            echo "<p style='color: green;'>✅ Veritabanı bağlantısı başarılı!</p>";
            
            // Tablo sayısını kontrol et
            $stmt = $db->query("SELECT name FROM sqlite_master WHERE type='table'");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            echo "<p>Mevcut tablolar:</p>";
            echo "<ul>";
            foreach ($tables as $table) {
                echo "<li><code>$table</code></li>";
            }
            echo "</ul>";
            
            // Kullanıcı sayısını kontrol et
            $stmt = $db->query("SELECT COUNT(*) FROM users");
            $userCount = $stmt->fetchColumn();
            echo "<p>Toplam kullanıcı sayısı: <strong>$userCount</strong></p>";
            
            // Hesaplama sayısını kontrol et
            $stmt = $db->query("SELECT COUNT(*) FROM carbon_calculations");
            $calcCount = $stmt->fetchColumn();
            echo "<p>Toplam hesaplama sayısı: <strong>$calcCount</strong></p>";
            
        } else {
            echo "<p style='color: red;'>❌ Veritabanı bağlantısı başarısız!</p>";
        }
        
    } else {
        echo "<p>Veritabanı bulunamadı. Oluşturuluyor...</p>";
        
        // Veritabanını oluştur
        $db = $database->getConnection();
        
        if ($db) {
            echo "<p style='color: green;'>✅ Veritabanı bağlantısı başarılı!</p>";
            
            // SQL dosyasını oku ve çalıştır
            $sql = file_get_contents('database.sql');
            
            if ($sql) {
                // SQL komutlarını ayrı ayrı çalıştır
                $statements = explode(';', $sql);
                
                foreach ($statements as $statement) {
                    $statement = trim($statement);
                    if (!empty($statement)) {
                        try {
                            $db->exec($statement);
                        } catch (PDOException $e) {
                            // Bazı komutlar hata verebilir (örn: CREATE INDEX zaten varsa)
                            // Bu normal bir durum, devam et
                        }
                    }
                }
                
                echo "<p style='color: green;'>✅ Veritabanı tabloları oluşturuldu!</p>";
                
                // Tabloları kontrol et
                $stmt = $db->query("SELECT name FROM sqlite_master WHERE type='table'");
                $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                
                echo "<p>Oluşturulan tablolar:</p>";
                echo "<ul>";
                foreach ($tables as $table) {
                    echo "<li><code>$table</code></li>";
                }
                echo "</ul>";
                
                // Varsayılan verileri kontrol et
                $stmt = $db->query("SELECT COUNT(*) FROM users");
                $userCount = $stmt->fetchColumn();
                echo "<p>Kullanıcı sayısı: <strong>$userCount</strong></p>";
                
                $stmt = $db->query("SELECT COUNT(*) FROM carbon_factors");
                $factorCount = $stmt->fetchColumn();
                echo "<p>Karbon faktörü sayısı: <strong>$factorCount</strong></p>";
                
                echo "<p style='color: green;'>✅ Kurulum tamamlandı!</p>";
                
            } else {
                echo "<p style='color: red;'>❌ SQL dosyası okunamadı!</p>";
            }
            
        } else {
            echo "<p style='color: red;'>❌ Veritabanı oluşturulamadı!</p>";
        }
    }
    
    // Varsayılan kullanıcı bilgilerini göster
    echo "<h2>Varsayılan Kullanıcılar</h2>";
    echo "<div style='background: #f5f5f5; padding: 15px; border-radius: 5px;'>";
    echo "<h3>Admin Kullanıcısı</h3>";
    echo "<p><strong>E-posta:</strong> admin@ecotech.com</p>";
    echo "<p><strong>Şifre:</strong> admin123</p>";
    echo "<p><strong>Tip:</strong> Admin</p>";
    
    echo "<h3>Demo Kullanıcısı</h3>";
    echo "<p><strong>E-posta:</strong> demo@example.com</p>";
    echo "<p><strong>Şifre:</strong> user123</p>";
    echo "<p><strong>Tip:</strong> Normal Kullanıcı</p>";
    echo "</div>";
    
    // Sistem bilgileri
    echo "<h2>Sistem Bilgileri</h2>";
    echo "<div style='background: #f5f5f5; padding: 15px; border-radius: 5px;'>";
    echo "<p><strong>PHP Sürümü:</strong> " . PHP_VERSION . "</p>";
    echo "<p><strong>SQLite Sürümü:</strong> " . SQLite3::version()['versionString'] . "</p>";
    echo "<p><strong>PDO SQLite:</strong> " . (extension_loaded('pdo_sqlite') ? '✅ Yüklü' : '❌ Yüklü değil') . "</p>";
    echo "<p><strong>Veritabanı Dosyası:</strong> " . realpath('../database/carbon_footprint.db') . "</p>";
    echo "</div>";
    
    // Sonraki adımlar
    echo "<h2>Sonraki Adımlar</h2>";
    echo "<div style='background: #e8f5e8; padding: 15px; border-radius: 5px;'>";
    echo "<p>✅ Kurulum tamamlandı! Şimdi şu adımları takip edin:</p>";
    echo "<ol>";
    echo "<li><a href='index.html'>Ana sayfaya git</a></li>";
    echo "<li>Admin kullanıcısı ile giriş yapın</li>";
    echo "<li>Sistemi test edin</li>";
    echo "</ol>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Hata: " . $e->getMessage() . "</p>";
    echo "<p>Lütfen şunları kontrol edin:</p>";
    echo "<ul>";
    echo "<li>PHP'nin yüklü olduğundan emin olun</li>";
    echo "<li>PDO SQLite eklentisinin etkin olduğundan emin olun</li>";
    echo "<li>Dosya yazma izinlerinin doğru olduğundan emin olun</li>";
    echo "</ul>";
}

echo "<hr>";
echo "<p><small>eCoTech - Karbon Ayak İzi Hesaplama Projesi</small></p>";
?> 