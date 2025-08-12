<?php
// Hata raporlamasını etkinleştir
error_reporting(E_ALL);
ini_set('display_errors', 1);

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

// Debug bilgisi
error_log("Auth API called with action: " . $action);
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);

switch ($action) {
    case 'login':
        handleLogin($db);
        break;
    case 'register':
        handleRegister($db);
        break;
    case 'logout':
        handleLogout();
        break;
    default:
        errorResponse('Geçersiz işlem: ' . $action);
}

function handleLogin($db) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        errorResponse('Sadece POST metodu kabul edilir');
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        $input = $_POST;
    }
    
    // Debug bilgisi
    error_log("Login attempt for email: " . ($input['email'] ?? 'not provided'));
    
    $email = sanitizeInput($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        errorResponse('E-posta ve şifre gereklidir');
    }
    
    try {
        $stmt = $db->prepare("SELECT id, username, first_name, last_name, email, password_hash, user_type, company_name FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        error_log("User found: " . ($user ? 'yes' : 'no'));
        if ($user) {
            error_log("Password verification: " . (verifyPassword($password, $user['password_hash']) ? 'success' : 'failed'));
            error_log("Input password: " . $password);
            error_log("Stored hash: " . $user['password_hash']);
        }
        
        if (!$user || !verifyPassword($password, $user['password_hash'])) {
            errorResponse('Geçersiz e-posta veya şifre');
        }
        
        // Session'a kullanıcı bilgilerini kaydet
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['first_name'] = $user['first_name'];
        $_SESSION['last_name'] = $user['last_name'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['user_type'] = $user['user_type'];
        $_SESSION['company_name'] = $user['company_name'];
        
        writeLog("Kullanıcı giriş yaptı: {$user['email']}", 'LOGIN');
        
        successResponse('Giriş başarılı', [
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name'],
                'email' => $user['email'],
                'user_type' => $user['user_type'],
                'company_name' => $user['company_name']
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        writeLog("Giriş hatası: " . $e->getMessage(), 'ERROR');
        errorResponse('Giriş işlemi başarısız: ' . $e->getMessage());
    }
}

function handleRegister($db) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        errorResponse('Sadece POST metodu kabul edilir');
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        $input = $_POST;
    }
    
    // Debug bilgisi
    error_log("Register attempt for email: " . ($input['email'] ?? 'not provided'));
    
    $username = sanitizeInput($input['username'] ?? '');
    $first_name = sanitizeInput($input['first_name'] ?? '');
    $last_name = sanitizeInput($input['last_name'] ?? '');
    $email = sanitizeInput($input['email'] ?? '');
    $phone = sanitizeInput($input['phone'] ?? '');
    $birth_date = $input['birth_date'] ?? '';
    $password = $input['password'] ?? '';
    $company_name = sanitizeInput($input['company_name'] ?? '');
    
    // Validasyon
    if (empty($username) || empty($first_name) || empty($last_name) || empty($email) || empty($password)) {
        errorResponse('Tüm zorunlu alanları doldurun');
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        errorResponse('Geçerli bir e-posta adresi girin');
    }
    
    if (strlen($password) < 6) {
        errorResponse('Şifre en az 6 karakter olmalıdır');
    }
    
    try {
        // E-posta ve kullanıcı adı kontrolü
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
        $stmt->execute([$email, $username]);
        
        if ($stmt->fetch()) {
            errorResponse('Bu e-posta veya kullanıcı adı zaten kullanılıyor');
        }
        
        // Yeni kullanıcı oluştur
        $password_hash = hashPassword($password);
        
        $stmt = $db->prepare("
            INSERT INTO users (username, first_name, last_name, email, password_hash, phone, birth_date, company_name) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $username, $first_name, $last_name, $email, $password_hash, 
            $phone, $birth_date, $company_name
        ]);
        
        $user_id = $db->lastInsertId();
        
        writeLog("Yeni kullanıcı kaydı: {$email}", 'REGISTER');
        
        successResponse('Kayıt başarılı', [
            'user_id' => $user_id,
            'message' => 'Hesabınız başarıyla oluşturuldu. Giriş yapabilirsiniz.'
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        writeLog("Kayıt hatası: " . $e->getMessage(), 'ERROR');
        errorResponse('Kayıt işlemi başarısız: ' . $e->getMessage());
    }
}

function handleLogout() {
    session_destroy();
    successResponse('Çıkış başarılı');
}
?> 