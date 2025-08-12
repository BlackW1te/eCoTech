<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
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

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'calculate':
        handleCalculate($db);
        break;
    case 'save':
        handleSave($db);
        break;
    case 'history':
        handleHistory($db);
        break;
    case 'factors':
        handleGetFactors($db);
        break;
    default:
        errorResponse('Geçersiz işlem');
}

function handleCalculate($db) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        errorResponse('Sadece POST metodu kabul edilir');
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        $input = $_POST;
    }
    
    // Karbon faktörlerini al
    $factors = getCarbonFactors($db);
    
    // Hesaplama yap
    $result = calculateCarbonFootprint($input, $factors);
    
    successResponse('Hesaplama başarılı', $result);
}

function handleSave($db) {
    if (!isLoggedIn()) {
        errorResponse('Giriş yapmanız gerekiyor', 401);
    }
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        errorResponse('Sadece POST metodu kabul edilir');
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        $input = $_POST;
    }
    
    $user_id = $_SESSION['user_id'];
    $notes = sanitizeInput($input['notes'] ?? '');
    
    // Karbon faktörlerini al
    $factors = getCarbonFactors($db);
    
    // Hesaplama yap
    $calculation = calculateCarbonFootprint($input, $factors);
    
    try {
        $stmt = $db->prepare("
            INSERT INTO carbon_calculations (
                user_id, total_carbon_footprint, electricity_usage, natural_gas_usage, 
                water_usage, waste_production, transportation, business_travel, 
                employee_commute, paper_usage, other_emissions, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $user_id,
            $calculation['total'],
            $input['electricity'] ?? 0,
            $input['natural_gas'] ?? 0,
            $input['water'] ?? 0,
            $input['waste'] ?? 0,
            $input['transportation'] ?? 0,
            $input['business_travel'] ?? 0,
            $input['employee_commute'] ?? 0,
            $input['paper_usage'] ?? 0,
            $input['other_emissions'] ?? 0,
            $notes
        ]);
        
        $calculation_id = $db->lastInsertId();
        
        writeLog("Karbon hesaplaması kaydedildi: Kullanıcı ID {$user_id}, Hesaplama ID {$calculation_id}", 'CALCULATION');
        
        successResponse('Hesaplama kaydedildi', [
            'calculation_id' => $calculation_id,
            'total_carbon_footprint' => $calculation['total'],
            'breakdown' => $calculation['breakdown']
        ]);
        
    } catch (PDOException $e) {
        writeLog("Hesaplama kaydetme hatası: " . $e->getMessage(), 'ERROR');
        errorResponse('Hesaplama kaydedilemedi');
    }
}

function handleHistory($db) {
    if (!isLoggedIn()) {
        errorResponse('Giriş yapmanız gerekiyor', 401);
    }
    
    $user_id = $_SESSION['user_id'];
    $limit = (int)($_GET['limit'] ?? 10);
    $offset = (int)($_GET['offset'] ?? 0);
    
    try {
        $stmt = $db->prepare("
            SELECT id, calculation_date, total_carbon_footprint, electricity_usage, 
                   natural_gas_usage, water_usage, waste_production, transportation, 
                   business_travel, employee_commute, paper_usage, other_emissions, notes
            FROM carbon_calculations 
            WHERE user_id = ? 
            ORDER BY calculation_date DESC 
            LIMIT ? OFFSET ?
        ");
        
        $stmt->execute([$user_id, $limit, $offset]);
        $calculations = $stmt->fetchAll();
        
        // İstatistikler
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total_calculations,
                AVG(total_carbon_footprint) as average_footprint,
                MIN(total_carbon_footprint) as min_footprint,
                MAX(total_carbon_footprint) as max_footprint,
                SUM(total_carbon_footprint) as total_footprint
            FROM carbon_calculations 
            WHERE user_id = ?
        ");
        
        $stmt->execute([$user_id]);
        $stats = $stmt->fetch();
        
        successResponse('Geçmiş hesaplamalar alındı', [
            'calculations' => $calculations,
            'statistics' => $stats
        ]);
        
    } catch (PDOException $e) {
        writeLog("Geçmiş hesaplamalar hatası: " . $e->getMessage(), 'ERROR');
        errorResponse('Geçmiş hesaplamalar alınamadı');
    }
}

function handleGetFactors($db) {
    try {
        $stmt = $db->prepare("
            SELECT factor_name, factor_value, unit, category, description 
            FROM carbon_factors 
            WHERE is_active = 1 
            ORDER BY category, factor_name
        ");
        
        $stmt->execute();
        $factors = $stmt->fetchAll();
        
        // Kategorilere göre grupla
        $grouped_factors = [];
        foreach ($factors as $factor) {
            $category = $factor['category'];
            if (!isset($grouped_factors[$category])) {
                $grouped_factors[$category] = [];
            }
            $grouped_factors[$category][] = $factor;
        }
        
        successResponse('Karbon faktörleri alındı', $grouped_factors);
        
    } catch (PDOException $e) {
        writeLog("Karbon faktörleri hatası: " . $e->getMessage(), 'ERROR');
        errorResponse('Karbon faktörleri alınamadı');
    }
}

function getCarbonFactors($db) {
    try {
        $stmt = $db->prepare("
            SELECT factor_name, factor_value 
            FROM carbon_factors 
            WHERE is_active = 1
        ");
        
        $stmt->execute();
        $factors = $stmt->fetchAll();
        
        $factor_array = [];
        foreach ($factors as $factor) {
            $factor_array[strtolower(str_replace(' ', '_', $factor['factor_name']))] = $factor['factor_value'];
        }
        
        return $factor_array;
        
    } catch (PDOException $e) {
        // Varsayılan faktörler
        return [
            'electricity' => 0.5,
            'natural_gas' => 2.1,
            'water' => 0.3,
            'waste' => 0.5,
            'transportation' => 2.3
        ];
    }
}
?> 