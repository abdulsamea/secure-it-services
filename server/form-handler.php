<?php
/**
 * PHP Fallback Form Handler for Secure I.T. Services
 * Use this if Node.js is not available on your hosting server
 * 
 * Requirements:
 * - PHP 7.0 or higher
 * - mail() function configured (or SMTP setup)
 * - Write permissions for leads.csv file
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Configuration
$config = [
    'email_to' => 'goatfarmbabar@gmail.com',
    'email_from' => 'qrazee24@gmail.com',
    'leads_file' => __DIR__ . '/data/leads.csv',
    'rate_limit' => 5, // Max submissions per hour per IP
    'admin_password' => 'secure123' // Change this!
];

// Create data directory if it doesn't exist
$dataDir = dirname($config['leads_file']);
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Rate limiting (simple IP-based)
function checkRateLimit($ip, $limit = 5) {
    $rateLimitFile = __DIR__ . '/data/rate_limit.json';
    $now = time();
    $hourAgo = $now - 3600;
    
    // Load existing rate limit data
    $rateLimitData = [];
    if (file_exists($rateLimitFile)) {
        $rateLimitData = json_decode(file_get_contents($rateLimitFile), true) ?: [];
    }
    
    // Clean old entries
    foreach ($rateLimitData as $checkIp => $timestamps) {
        $rateLimitData[$checkIp] = array_filter($timestamps, function($timestamp) use ($hourAgo) {
            return $timestamp > $hourAgo;
        });
        if (empty($rateLimitData[$checkIp])) {
            unset($rateLimitData[$checkIp]);
        }
    }
    
    // Check current IP
    $currentCount = isset($rateLimitData[$ip]) ? count($rateLimitData[$ip]) : 0;
    if ($currentCount >= $limit) {
        return false;
    }
    
    // Add current request
    if (!isset($rateLimitData[$ip])) {
        $rateLimitData[$ip] = [];
    }
    $rateLimitData[$ip][] = $now;
    
    // Save rate limit data
    file_put_contents($rateLimitFile, json_encode($rateLimitData));
    
    return true;
}

// Input validation functions
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function validatePhone($phone) {
    $cleanPhone = preg_replace('/\s+/', '', $phone);
    return preg_match('/^(\+91|0)?[6-9]\d{9}$/', $cleanPhone);
}

function validateName($name) {
    return preg_match('/^[a-zA-Z\s]{2,50}$/', $name);
}

function sanitizeInput($input) {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

// Save lead to CSV
function saveLeadToCSV($data, $filename) {
    $csvExists = file_exists($filename);
    $handle = fopen($filename, 'a');
    
    if (!$csvExists) {
        // Write headers
        fputcsv($handle, ['Timestamp', 'IP', 'Full Name', 'Email', 'Phone', 'Service', 'Preferred DateTime', 'Message', 'Status']);
    }
    
    // Write data
    fputcsv($handle, [
        date('Y-m-d H:i:s'),
        $data['ip'],
        $data['fullName'],
        $data['email'],
        $data['phone'],
        $data['service'],
        $data['preferredDateTime'] ?: 'Not specified',
        $data['message'],
        'New'
    ]);
    
    fclose($handle);
}

// Send email notification
function sendEmailNotification($data, $config) {
    $subject = "New IT Service Inquiry - " . $data['service'];
    
    $message = "New Contact Form Submission\n\n";
    $message .= "Service: " . $data['service'] . "\n";
    $message .= "Name: " . $data['fullName'] . "\n";
    $message .= "Email: " . $data['email'] . "\n";
    $message .= "Phone: " . $data['phone'] . "\n";
    if ($data['preferredDateTime']) {
        $message .= "Preferred Date/Time: " . $data['preferredDateTime'] . "\n";
    }
    $message .= "\nMessage:\n" . $data['message'] . "\n";
    $message .= "\nSubmitted on: " . date('Y-m-d H:i:s') . "\n";
    $message .= "IP Address: " . $data['ip'] . "\n";
    
    $headers = "From: " . $config['email_from'] . "\r\n";
    $headers .= "Reply-To: " . $data['email'] . "\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    
    return mail($config['email_to'], $subject, $message, $headers);
}

// Main processing
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    // Rate limiting check
    if (!checkRateLimit($ip, $config['rate_limit'])) {
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'message' => 'Too many submissions. Please try again later.'
        ]);
        exit;
    }
    
    // Get and validate input
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    
    $fullName = sanitizeInput($input['fullName'] ?? '');
    $email = sanitizeInput($input['email'] ?? '');
    $phone = sanitizeInput($input['phone'] ?? '');
    $service = sanitizeInput($input['service'] ?? '');
    $preferredDateTime = sanitizeInput($input['preferredDateTime'] ?? '');
    $message = sanitizeInput($input['message'] ?? '');
    $consent = !empty($input['consent']);
    
    // Validation
    $errors = [];
    
    if (!validateName($fullName)) {
        $errors[] = 'Invalid full name. Please enter 2-50 characters, letters only.';
    }
    
    if (!validateEmail($email)) {
        $errors[] = 'Invalid email address.';
    }
    
    if (!validatePhone($phone)) {
        $errors[] = 'Invalid phone number. Please enter a valid Indian phone number.';
    }
    
    if (empty($service)) {
        $errors[] = 'Please select a service.';
    }
    
    if (strlen($message) < 10) {
        $errors[] = 'Message must be at least 10 characters long.';
    }
    
    if (!$consent) {
        $errors[] = 'You must agree to be contacted.';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Validation errors',
            'errors' => $errors
        ]);
        exit;
    }
    
    // Prepare data
    $leadData = [
        'fullName' => $fullName,
        'email' => strtolower($email),
        'phone' => preg_replace('/\s+/', '', $phone),
        'service' => $service,
        'preferredDateTime' => $preferredDateTime,
        'message' => $message,
        'ip' => $ip
    ];
    
    try {
        // Save to CSV
        saveLeadToCSV($leadData, $config['leads_file']);
        
        // Send email notification
        $emailSent = sendEmailNotification($leadData, $config);
        
        // Success response
        $whatsappMessage = "Hi, I submitted a contact form for {$service}. My name is {$fullName}.";
        $whatsappUrl = "https://wa.me/919022283313?text=" . urlencode($whatsappMessage);
        
        echo json_encode([
            'success' => true,
            'message' => 'Thank you for your inquiry! We will contact you within 2 hours.',
            'data' => [
                'whatsappUrl' => $whatsappUrl
            ]
        ]);
        
    } catch (Exception $e) {
        error_log('Contact form error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred while processing your request. Please try again.'
        ]);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['admin'])) {
    // Simple admin panel
    $password = $_GET['password'] ?? '';
    
    if ($password !== $config['admin_password']) {
        echo '<!DOCTYPE html>
        <html>
        <head><title>Admin Access</title></head>
        <body>
            <h2>Admin Access Required</h2>
            <form method="GET">
                <input type="hidden" name="admin" value="1">
                <input type="password" name="password" placeholder="Enter admin password" required>
                <button type="submit">Access Leads</button>
            </form>
        </body>
        </html>';
        exit;
    }
    
    // Display leads
    echo '<!DOCTYPE html>
    <html>
    <head>
        <title>Leads Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .refresh-btn { background: #fca21a; border: none; padding: 10px 20px; margin-bottom: 20px; cursor: pointer; }
        </style>
    </head>
    <body>
        <h1>Leads Dashboard - Secure I.T. Services</h1>
        <button onclick="location.reload()" class="refresh-btn">Refresh</button>';
    
    if (file_exists($config['leads_file'])) {
        $csvData = file_get_contents($config['leads_file']);
        $lines = explode("\n", $csvData);
        
        if (count($lines) > 1) {
            echo '<table><thead><tr>';
            $headers = str_getcsv($lines[0]);
            foreach ($headers as $header) {
                echo '<th>' . htmlspecialchars($header) . '</th>';
            }
            echo '<th>Actions</th></tr></thead><tbody>';
            
            // Display leads (skip header row and reverse order for newest first)
            for ($i = count($lines) - 1; $i >= 1; $i--) {
                if (empty(trim($lines[$i]))) continue;
                
                $data = str_getcsv($lines[$i]);
                if (count($data) >= count($headers)) {
                    echo '<tr>';
                    foreach ($data as $cell) {
                        echo '<td>' . htmlspecialchars($cell) . '</td>';
                    }
                    
                    // Action buttons
                    $phone = isset($data[4]) ? preg_replace('/^\+?91/', '', $data[4]) : '';
                    $email = isset($data[3]) ? $data[3] : '';
                    
                    echo '<td>';
                    if ($phone) echo '<a href="tel:' . $data[4] . '" style="margin-right:5px;">Call</a>';
                    if ($phone) echo '<a href="https://wa.me/91' . $phone . '" target="_blank" style="margin-right:5px;">WhatsApp</a>';
                    if ($email) echo '<a href="mailto:' . $email . '">Email</a>';
                    echo '</td>';
                    
                    echo '</tr>';
                }
            }
            echo '</tbody></table>';
        } else {
            echo '<p>No leads found.</p>';
        }
    } else {
        echo '<p>No leads file found.</p>';
    }
    
    echo '<p style="margin-top: 20px; font-size: 12px; color: #666;">
        Last updated: ' . date('Y-m-d H:i:s') . '<br>
        <a href="?admin=1&password=' . $password . '&download=1">Download CSV</a>
    </p>';
    echo '</body></html>';
    
} elseif (isset($_GET['download']) && $_GET['password'] === $config['admin_password']) {
    // Download CSV
    if (file_exists($config['leads_file'])) {
        header('Content-Type: application/csv');
        header('Content-Disposition: attachment; filename="leads_' . date('Y-m-d') . '.csv"');
        readfile($config['leads_file']);
    } else {
        echo 'No leads data found';
    }
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
}
?>