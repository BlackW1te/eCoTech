<?php
// Veritabanı bağlantı konfigürasyonu - SQLite
class Database {
    private $db_path = __DIR__ . '/../database/carbon_footprint.db';
    private $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            // Veritabanı dizinini oluştur
            $db_dir = dirname($this->db_path);
            if (!is_dir($db_dir)) {
                mkdir($db_dir, 0755, true);
            }

            // SQLite veritabanına bağlan
            $this->conn = new PDO('sqlite:' . $this->db_path);
            
            // SQLite ayarları
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Foreign key desteğini etkinleştir
            $this->conn->exec('PRAGMA foreign_keys = ON');
            
            // UTF-8 desteği
            $this->conn->exec('PRAGMA encoding = "UTF-8"');
            
        } catch(PDOException $exception) {
            echo "Bağlantı hatası: " . $exception->getMessage();
        }

        return $this->conn;
    }

    // Veritabanını oluştur (ilk kurulum için)
    public function createDatabase() {
        try {
            $sql = file_get_contents('../database.sql');
            $this->conn->exec($sql);
            return true;
        } catch(PDOException $exception) {
            echo "Veritabanı oluşturma hatası: " . $exception->getMessage();
            return false;
        }
    }

    // Veritabanı dosyasının varlığını kontrol et
    public function databaseExists() {
        return file_exists($this->db_path);
    }
}
?> 