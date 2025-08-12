<?php
session_start();

// Güvenli şifre hashleme
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

// Şifre doğrulama
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

// Kullanıcı giriş kontrolü
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

// Admin kontrolü
function isAdmin() {
    return isset($_SESSION['user_type']) && $_SESSION['user_type'] === 'admin';
}

// Güvenli input temizleme
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// CSRF token oluşturma
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// CSRF token doğrulama
function verifyCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// Tarih formatı
function formatDate($date) {
    return date('d.m.Y', strtotime($date));
}

// Karbon ayak izi hesaplama
function calculateCarbonFootprint($data, $factors) {
    $total = 0;
    $breakdown = [];
    
    // Elektrik
    if (isset($data['electricity']) && $data['electricity'] > 0) {
        $electricity_factor = $factors['electricity'] ?? 0.5;
        $electricity_emission = $data['electricity'] * $electricity_factor;
        $total += $electricity_emission;
        $breakdown['electricity'] = $electricity_emission;
    }
    
    // Doğal gaz
    if (isset($data['natural_gas']) && $data['natural_gas'] > 0) {
        $gas_factor = $factors['natural_gas'] ?? 2.1;
        $gas_emission = $data['natural_gas'] * $gas_factor;
        $total += $gas_emission;
        $breakdown['natural_gas'] = $gas_emission;
    }
    
    // Su
    if (isset($data['water']) && $data['water'] > 0) {
        $water_factor = $factors['water'] ?? 0.3;
        $water_emission = $data['water'] * $water_factor;
        $total += $water_emission;
        $breakdown['water'] = $water_emission;
    }
    
    // Atık
    if (isset($data['waste']) && $data['waste'] > 0) {
        $waste_factor = $factors['waste'] ?? 0.5;
        $waste_emission = $data['waste'] * $waste_factor;
        $total += $waste_emission;
        $breakdown['waste'] = $waste_emission;
    }
    
    // Ulaşım
    if (isset($data['transportation']) && $data['transportation'] > 0) {
        $transport_factor = $factors['transportation'] ?? 2.3;
        $transport_emission = $data['transportation'] * $transport_factor;
        $total += $transport_emission;
        $breakdown['transportation'] = $transport_emission;
    }
    
    return [
        'total' => round($total, 2),
        'breakdown' => $breakdown
    ];
}

// JSON response
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Hata mesajı
function errorResponse($message, $status = 400) {
    jsonResponse(['error' => $message], $status);
}

// Başarı mesajı
function successResponse($message, $data = null) {
    $response = ['success' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    jsonResponse($response);
}

// Dosya yükleme kontrolü
function validateFileUpload($file, $allowedTypes = ['jpg', 'jpeg', 'png', 'gif'], $maxSize = 5242880) {
    if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
        return false;
    }
    
    $fileSize = $file['size'];
    $fileName = $file['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    if ($fileSize > $maxSize) {
        return false;
    }
    
    if (!in_array($fileExtension, $allowedTypes)) {
        return false;
    }
    
    return true;
}

// Log dosyasına yazma
function writeLog($message, $type = 'INFO') {
    $logFile = 'logs/app.log';
    $logDir = dirname($logFile);
    
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] [$type] $message" . PHP_EOL;
    
    file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
}
?> 