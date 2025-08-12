<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
require_once '../includes/functions.php';

$database = new Database();
$db = $database->getConnection();

// Veritabanı yoksa oluştur
if (!$database->databaseExists()) {
    $database->createDatabase();
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Admin kontrolü
if (!isAdmin()) {
    errorResponse('Yetkisiz erişim', 403);
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'users':
        handleUsers($db);
        break;
    case 'calculations':
        handleCalculations($db);
        break;
    case 'factors':
        handleFactors($db);
        break;
    case 'statistics':
        handleStatistics($db);
        break;
    default:
        errorResponse('Geçersiz işlem');
}

function handleUsers($db) {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            getUsers($db);
            break;
        case 'PUT':
            updateUser($db);
            break;
        case 'DELETE':
            deleteUser($db);
            break;
        default:
            errorResponse('Geçersiz HTTP metodu');
    }
}

function getUsers($db) {
    try {
        $stmt = $db->prepare("
            SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.phone, u.birth_date, 
                   u.user_type, u.company_name, u.created_at,
                   (SELECT COUNT(*) FROM carbon_calculations WHERE user_id = u.id) as calculation_count
            FROM users u
            ORDER BY u.created_at DESC
        ");
        
        $stmt->execute();
        $users = $stmt->fetchAll();
        
        successResponse('Kullanıcılar alındı', $users);
        
    } catch (PDOException $e) {
        writeLog("Kullanıcı listesi hatası: " . $e->getMessage(), 'ERROR');
        errorResponse('Kullanıcılar alınamadı');
    }
}

function updateUser($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        errorResponse('Geçersiz veri');
    }
    
    $user_id = (int)($input['id'] ?? 0);
    $user_type = sanitizeInput($input['user_type'] ?? 'user');
    $company_name = sanitizeInput($input['company_name'] ?? '');
    
    if ($user_id <= 0) {
        errorResponse('Geçersiz kullanıcı ID');
    }
    
    try {
        $stmt = $db->prepare("
            UPDATE users 
            SET user_type = ?, company_name = ?, updated_at = datetime('now') 
            WHERE id = ?
        ");
        
        $stmt->execute([$user_type, $company_name, $user_id]);
        
        writeLog("Kullanıcı güncellendi: ID {$user_id}", 'ADMIN');
        
        successResponse('Kullanıcı güncellendi');
        
    } catch (PDOException $e) {
        writeLog("Kullanıcı güncelleme hatası: " . $e->getMessage(), 'ERROR');
        errorResponse('Kullanıcı güncellenemedi');
    }
}

function deleteUser($db) {
    $user_id = (int)($_GET['id'] ?? 0);
    
    if ($user_id <= 0) {
        errorResponse('Geçersiz kullanıcı ID');
    }
    
    try {
        $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        
        writeLog("Kullanıcı silindi: ID {$user_id}", 'ADMIN');
        
        successResponse('Kullanıcı silindi');
        
    } catch (PDOException $e) {
        writeLog("Kullanıcı silme hatası: " . $e->getMessage(), 'ERROR');
        errorResponse('Kullanıcı silinemedi');
    }
}

function handleCalculations($db) {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            getAllCalculations($db);
            break;
        case 'DELETE':
            deleteCalculation($db);
            break;
        default:
            errorResponse('Geçersiz HTTP metodu');
    }
}

function getAllCalculations($db) {
    $limit = (int)($_GET['limit'] ?? 50);
    $offset = (int)($_GET['offset'] ?? 0);
    
    try {
        $stmt = $db->prepare("
            SELECT cc.id, cc.calculation_date, cc.total_carbon_footprint, 
                   cc.electricity_usage, cc.natural_gas_usage, cc.water_usage, 
                   cc.waste_production, cc.transportation, cc.notes,
                   u.username, u.first_name, u.last_name, u.company_name
            FROM carbon_calculations cc
            JOIN users u ON cc.user_id = u.id
            ORDER BY cc.calculation_date DESC 
            LIMIT ? OFFSET ?
        ");
        
        $stmt->execute([$limit, $offset]);
        $calculations = $stmt->fetchAll();
        
        successResponse('Hesaplamalar alındı', $calculations);
        
    } catch (PDOException $e) {
        writeLog("Hesaplama listesi hatası: " . $e->getMessage(), 'ERROR');
        errorResponse('Hesaplamalar alınamadı');
    }
}

function deleteCalculation($db) {
    $calculation_id = (int)($_GET['id'] ?? 0);
    
    if ($calculation_id <= 0) {
        errorResponse('Geçersiz hesaplama ID');
    }
    
    try {
        $stmt = $db->prepare("DELETE FROM carbon_calculations WHERE id = ?");
        $stmt->execute([$calculation_id]);
        
        writeLog("Hesaplama silindi: ID {$calculation_id}", 'ADMIN');
        
        successResponse('Hesaplama silindi');
        
    } catch (PDOException $e) {
        writeLog("Hesaplama silme hatası: " . $e->getMessage(), 'ERROR');
        errorResponse('Hesaplama silinemedi');
    }
}

function handleFactors($db) {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            getFactors($db);
            break;
        case 'POST':
            addFactor($db);
            break;
        case 'PUT':
            updateFactor($db);
            break;
        case 'DELETE':
            deleteFactor($db);
            break;
        default:
            errorResponse('Geçersiz HTTP metodu');
    }
}

function getFactors($db) {
    try {
        $stmt = $db->prepare("
            SELECT id, factor_name, factor_value, unit, category, description, is_active, created_at
            FROM carbon_factors 
            ORDER BY category, factor_name
        ");
        
        $stmt->execute();
        $factors = $stmt->fetchAll();
        
        successResponse('Karbon faktörleri alındı', $factors);
        
    } catch (PDOException $e) {
        writeLog("Karbon faktörleri hatası: " . $e->getMessage(), 'ERROR');
        errorResponse('Karbon faktörleri alınamadı');
    }
}

function addFactor($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        errorResponse('Geçersiz veri');
    }
    
    $factor_name = sanitizeInput($input['factor_name'] ?? '');
    $factor_value = (float)($input['factor_value'] ?? 0);
    $unit = sanitizeInput($input['unit'] ?? '');
    $category = sanitizeInput($input['category'] ?? '');
    $description = sanitizeInput($input['description'] ?? '');
    
    if (empty($factor_name) || $factor_value <= 0 || empty($unit) || empty($category)) {
        errorResponse('Tüm zorunlu alanları doldurun');
    }
    
    try {
        $stmt = $db->prepare("
            INSERT INTO carbon_factors (factor_name, factor_value, unit, category, description)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([$factor_name, $factor_value, $unit, $category, $description]);
        
        $factor_id = $db->lastInsertId();
        
        writeLog("Karbon faktörü eklendi: ID {$factor_id}", 'ADMIN');
        
        successResponse('Karbon faktörü eklendi', ['id' => $factor_id]);
        
    } catch (PDOException $e) {
        writeLog("Karbon faktörü ekleme hatası: " . $e->getMessage(), 'ERROR');
        errorResponse('Karbon faktörü eklenemedi');
    }
}

function updateFactor($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        errorResponse('Geçersiz veri');
    }
    
    $factor_id = (int)($input['id'] ?? 0);
    $factor_name = sanitizeInput($input['factor_name'] ?? '');
    $factor_value = (float)($input['factor_value'] ?? 0);
    $unit = sanitizeInput($input['unit'] ?? '');
    $category = sanitizeInput($input['category'] ?? '');
    $description = sanitizeInput($input['description'] ?? '');
    $is_active = (bool)($input['is_active'] ?? true);
    
    if ($factor_id <= 0) {
        errorResponse('Geçersiz faktör ID');
    }
    
    try {
        $stmt = $db->prepare("
            UPDATE carbon_factors 
            SET factor_name = ?, factor_value = ?, unit = ?, category = ?, 
                description = ?, is_active = ?, updated_at = datetime('now')
            WHERE id = ?
        ");
        
        $stmt->execute([$factor_name, $factor_value, $unit, $category, $description, $is_active, $factor_id]);
        
        writeLog("Karbon faktörü güncellendi: ID {$factor_id}", 'ADMIN');
        
        successResponse('Karbon faktörü güncellendi');
        
    } catch (PDOException $e) {
        writeLog("Karbon faktörü güncelleme hatası: " . $e->getMessage(), 'ERROR');
        errorResponse('Karbon faktörü güncellenemedi');
    }
}

function deleteFactor($db) {
    $factor_id = (int)($_GET['id'] ?? 0);
    
    if ($factor_id <= 0) {
        errorResponse('Geçersiz faktör ID');
    }
    
    try {
        $stmt = $db->prepare("DELETE FROM carbon_factors WHERE id = ?");
        $stmt->execute([$factor_id]);
        
        writeLog("Karbon faktörü silindi: ID {$factor_id}", 'ADMIN');
        
        successResponse('Karbon faktörü silindi');
        
    } catch (PDOException $e) {
        writeLog("Karbon faktörü silme hatası: " . $e->getMessage(), 'ERROR');
        errorResponse('Karbon faktörü silinemedi');
    }
}

function handleStatistics($db) {
    try {
        // Genel istatistikler
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN user_type = 'admin' THEN 1 END) as admin_count,
                COUNT(CASE WHEN user_type = 'user' THEN 1 END) as user_count
            FROM users
        ");
        $stmt->execute();
        $user_stats = $stmt->fetch();
        
        // Hesaplama istatistikleri
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total_calculations,
                AVG(total_carbon_footprint) as average_footprint,
                MIN(total_carbon_footprint) as min_footprint,
                MAX(total_carbon_footprint) as max_footprint,
                SUM(total_carbon_footprint) as total_footprint
            FROM carbon_calculations
        ");
        $stmt->execute();
        $calculation_stats = $stmt->fetch();
        
        // Aylık hesaplama sayısı
        $stmt = $db->prepare("
            SELECT 
                strftime('%Y-%m', calculation_date) as month,
                COUNT(*) as calculation_count,
                AVG(total_carbon_footprint) as avg_footprint
            FROM carbon_calculations 
            WHERE calculation_date >= datetime('now', '-12 months')
            GROUP BY strftime('%Y-%m', calculation_date)
            ORDER BY month DESC
        ");
        $stmt->execute();
        $monthly_stats = $stmt->fetchAll();
        
        // En aktif kullanıcılar
        $stmt = $db->prepare("
            SELECT 
                u.username, u.first_name, u.last_name, u.company_name,
                COUNT(cc.id) as calculation_count,
                AVG(cc.total_carbon_footprint) as avg_footprint
            FROM users u
            LEFT JOIN carbon_calculations cc ON u.id = cc.user_id
            GROUP BY u.id
            HAVING calculation_count > 0
            ORDER BY calculation_count DESC
            LIMIT 10
        ");
        $stmt->execute();
        $top_users = $stmt->fetchAll();
        
        successResponse('İstatistikler alındı', [
            'user_statistics' => $user_stats,
            'calculation_statistics' => $calculation_stats,
            'monthly_statistics' => $monthly_stats,
            'top_users' => $top_users
        ]);
        
    } catch (PDOException $e) {
        writeLog("İstatistik hatası: " . $e->getMessage(), 'ERROR');
        errorResponse('İstatistikler alınamadı');
    }
}
?> 