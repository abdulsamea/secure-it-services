const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "https://images.pexels.com", "data:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 contact form submissions per hour
    message: 'Too many contact form submissions, please try again later.'
});

app.use(limiter);
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Email transporter setup
let transporter;
try {
    transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    
    // Verify transporter connection
    transporter.verify((error, success) => {
        if (error) {
            console.log('Email transporter error:', error);
        } else {
            console.log('Email server is ready to send messages');
        }
    });
} catch (error) {
    console.error('Failed to create email transporter:', error);
}

// Input sanitization
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .trim();
}

// Validation functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^(\+91|0)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
}

function validateName(name) {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name);
}

// Save lead to CSV
function saveLeadToCSV(leadData) {
    const csvPath = path.join(dataDir, 'leads.csv');
    const csvHeaders = 'Timestamp,IP,Full Name,Email,Phone,Service,Preferred DateTime,Message,Status\n';
    
    // Create CSV file with headers if it doesn't exist
    if (!fs.existsSync(csvPath)) {
        fs.writeFileSync(csvPath, csvHeaders);
    }
    
    // Prepare CSV row
    const timestamp = new Date().toISOString();
    const csvRow = [
        timestamp,
        leadData.ip || 'Unknown',
        `"${leadData.fullName}"`,
        leadData.email,
        leadData.phone,
        `"${leadData.service}"`,
        leadData.preferredDateTime || 'Not specified',
        `"${leadData.message.replace(/"/g, '""')}"`, // Escape quotes in message
        'New'
    ].join(',') + '\n';
    
    // Append to CSV file
    fs.appendFileSync(csvPath, csvRow);
}

// Contact form endpoint
app.post('/api/contact', contactLimiter, async (req, res) => {
    try {
        const { fullName, email, phone, service, preferredDateTime, message, consent } = req.body;
        
        // Input validation
        const errors = [];
        
        if (!fullName || !validateName(fullName)) {
            errors.push('Invalid full name. Please enter 2-50 characters, letters only.');
        }
        
        if (!email || !validateEmail(email)) {
            errors.push('Invalid email address.');
        }
        
        if (!phone || !validatePhone(phone)) {
            errors.push('Invalid phone number. Please enter a valid Indian phone number.');
        }
        
        if (!service) {
            errors.push('Please select a service.');
        }
        
        if (!message || message.trim().length < 10) {
            errors.push('Message must be at least 10 characters long.');
        }
        
        if (!consent) {
            errors.push('You must agree to be contacted.');
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors
            });
        }
        
        // Sanitize inputs
        const sanitizedData = {
            fullName: sanitizeInput(fullName),
            email: sanitizeInput(email.toLowerCase()),
            phone: sanitizeInput(phone.replace(/\s+/g, '')),
            service: sanitizeInput(service),
            preferredDateTime: preferredDateTime ? sanitizeInput(preferredDateTime) : null,
            message: sanitizeInput(message),
            ip: req.ip || req.connection.remoteAddress
        };
        
        // Save lead to CSV
        try {
            saveLeadToCSV(sanitizedData);
        } catch (csvError) {
            console.error('Error saving to CSV:', csvError);
            // Continue processing even if CSV save fails
        }
        
        // Send email notification
        if (transporter) {
            try {
                const mailOptions = {
                    from: process.env.SMTP_USER,
                    to: 'goatfarmbabar@gmail.com',
                    subject: `New IT Service Inquiry - ${sanitizedData.service}`,
                    html: `
                        <h2>New Contact Form Submission</h2>
                        <p><strong>Service:</strong> ${sanitizedData.service}</p>
                        <p><strong>Name:</strong> ${sanitizedData.fullName}</p>
                        <p><strong>Email:</strong> <a href="mailto:${sanitizedData.email}">${sanitizedData.email}</a></p>
                        <p><strong>Phone:</strong> <a href="tel:${sanitizedData.phone}">${sanitizedData.phone}</a></p>
                        ${sanitizedData.preferredDateTime ? `<p><strong>Preferred Date/Time:</strong> ${sanitizedData.preferredDateTime}</p>` : ''}
                        <p><strong>Message:</strong></p>
                        <p>${sanitizedData.message}</p>
                        <hr>
                        <p><small>Submitted on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</small></p>
                        <p><small>IP Address: ${sanitizedData.ip}</small></p>
                        
                        <h3>Quick Actions:</h3>
                        <p>
                            <a href="tel:${sanitizedData.phone}" style="background: #25D366; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; margin-right: 10px;">Call ${sanitizedData.fullName}</a>
                            <a href="https://wa.me/91${sanitizedData.phone.replace(/^\+?91/, '')}" style="background: #25D366; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">WhatsApp</a>
                        </p>
                    `,
                    text: `
New IT Service Inquiry

Service: ${sanitizedData.service}
Name: ${sanitizedData.fullName}
Email: ${sanitizedData.email}
Phone: ${sanitizedData.phone}
${sanitizedData.preferredDateTime ? `Preferred Date/Time: ${sanitizedData.preferredDateTime}` : ''}

Message:
${sanitizedData.message}

Submitted on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
IP Address: ${sanitizedData.ip}
                    `
                };
                
                await transporter.sendMail(mailOptions);
                console.log('Email notification sent successfully');
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                // Don't fail the request if email fails
            }
        }
        
        // Success response
        res.json({
            success: true,
            message: 'Thank you for your inquiry! We will contact you within 2 hours.',
            data: {
                whatsappUrl: `https://wa.me/919022283313?text=${encodeURIComponent(`Hi, I submitted a contact form for ${sanitizedData.service}. My name is ${sanitizedData.fullName}.`)}`
            }
        });
        
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your request. Please try again.'
        });
    }
});

// Simple admin panel for viewing leads (password protected)
app.get('/admin/leads', (req, res) => {
    const password = req.query.password;
    const adminPassword = process.env.ADMIN_PASSWORD || 'secure123';
    
    if (password !== adminPassword) {
        return res.status(401).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Admin Access - Secure I.T. Services</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 500px; margin: 100px auto; padding: 20px; }
                    input[type="password"] { width: 100%; padding: 10px; margin: 10px 0; }
                    button { background: #fca21a; color: black; padding: 10px 20px; border: none; cursor: pointer; }
                </style>
            </head>
            <body>
                <h2>Admin Access Required</h2>
                <form method="GET">
                    <input type="password" name="password" placeholder="Enter admin password" required>
                    <br><br>
                    <button type="submit">Access Leads</button>
                </form>
            </body>
            </html>
        `);
    }
    
    // Read and parse CSV data
    const csvPath = path.join(dataDir, 'leads.csv');
    let leads = [];
    
    if (fs.existsSync(csvPath)) {
        try {
            const csvData = fs.readFileSync(csvPath, 'utf8');
            const rows = csvData.split('\n').filter(row => row.trim());
            const headers = rows[0].split(',');
            
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const values = [];
                let currentValue = '';
                let inQuotes = false;
                
                for (let j = 0; j < row.length; j++) {
                    const char = row[j];
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        values.push(currentValue.trim());
                        currentValue = '';
                    } else {
                        currentValue += char;
                    }
                }
                values.push(currentValue.trim());
                
                if (values.length === headers.length) {
                    const lead = {};
                    headers.forEach((header, index) => {
                        lead[header.trim()] = values[index] ? values[index].replace(/^"|"$/g, '') : '';
                    });
                    leads.push(lead);
                }
            }
            
            // Sort by timestamp, newest first
            leads.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
        } catch (error) {
            console.error('Error reading CSV:', error);
        }
    }
    
    // Generate HTML table
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Leads Dashboard - Secure I.T. Services</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { box-sizing: border-box; }
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: #f5f5f5; 
                }
                .header { 
                    background: white; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin-bottom: 20px; 
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .stats { 
                    display: flex; 
                    gap: 20px; 
                    margin-bottom: 20px; 
                    flex-wrap: wrap;
                }
                .stat-card { 
                    background: #fca21a; 
                    color: black; 
                    padding: 15px; 
                    border-radius: 8px; 
                    text-align: center; 
                    min-width: 120px;
                }
                .table-container { 
                    background: white; 
                    border-radius: 8px; 
                    overflow: hidden; 
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    overflow-x: auto;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    min-width: 800px;
                }
                th, td { 
                    padding: 12px; 
                    text-align: left; 
                    border-bottom: 1px solid #ddd; 
                    font-size: 14px;
                }
                th { 
                    background: #f8f9fa; 
                    font-weight: bold; 
                    position: sticky; 
                    top: 0;
                }
                tr:hover { background: #f8f9fa; }
                .message { 
                    max-width: 200px; 
                    overflow: hidden; 
                    text-overflow: ellipsis; 
                    white-space: nowrap; 
                }
                .action-buttons a { 
                    display: inline-block; 
                    padding: 4px 8px; 
                    margin: 2px; 
                    border-radius: 4px; 
                    text-decoration: none; 
                    font-size: 12px;
                }
                .call-btn { background: #28a745; color: white; }
                .whatsapp-btn { background: #25D366; color: white; }
                .email-btn { background: #007bff; color: white; }
                @media (max-width: 768px) {
                    .stats { flex-direction: column; }
                    .stat-card { text-align: left; }
                    th, td { padding: 8px; font-size: 12px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Leads Dashboard - Secure I.T. Services</h1>
                <div class="stats">
                    <div class="stat-card">
                        <div style="font-size: 24px; font-weight: bold;">${leads.length}</div>
                        <div>Total Leads</div>
                    </div>
                    <div class="stat-card">
                        <div style="font-size: 24px; font-weight: bold;">${leads.filter(lead => {
                            const leadDate = new Date(lead.Timestamp);
                            const today = new Date();
                            return leadDate.toDateString() === today.toDateString();
                        }).length}</div>
                        <div>Today</div>
                    </div>
                    <div class="stat-card">
                        <div style="font-size: 24px; font-weight: bold;">${leads.filter(lead => {
                            const leadDate = new Date(lead.Timestamp);
                            const weekAgo = new Date();
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            return leadDate >= weekAgo;
                        }).length}</div>
                        <div>This Week</div>
                    </div>
                </div>
                <button onclick="window.location.reload()" style="background: #fca21a; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Refresh</button>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date/Time</th>
                            <th>Name</th>
                            <th>Service</th>
                            <th>Contact</th>
                            <th>Message</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    leads.forEach(lead => {
        const date = new Date(lead.Timestamp).toLocaleString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const phone = lead.Phone.replace(/^\+?91/, '');
        
        html += `
            <tr>
                <td>${date}</td>
                <td><strong>${lead['Full Name']}</strong></td>
                <td><span style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${lead.Service}</span></td>
                <td>
                    <div style="font-size: 12px;">
                        <div>📧 ${lead.Email}</div>
                        <div>📞 ${lead.Phone}</div>
                    </div>
                </td>
                <td class="message" title="${lead.Message}">${lead.Message}</td>
                <td class="action-buttons">
                    <a href="tel:${lead.Phone}" class="call-btn">Call</a>
                    <a href="https://wa.me/91${phone}" class="whatsapp-btn" target="_blank">WhatsApp</a>
                    <a href="mailto:${lead.Email}" class="email-btn">Email</a>
                </td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
                Last updated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                <br>
                <a href="?password=${password}&download=csv" style="color: #fca21a;">Download CSV</a>
            </div>
        </body>
        </html>
    `;
    
    res.send(html);
});

// Download CSV endpoint
app.get('/admin/leads/download', (req, res) => {
    const password = req.query.password;
    const adminPassword = process.env.ADMIN_PASSWORD || 'secure123';
    
    if (password !== adminPassword) {
        return res.status(401).send('Unauthorized');
    }
    
    const csvPath = path.join(dataDir, 'leads.csv');
    if (fs.existsSync(csvPath)) {
        res.download(csvPath, `leads_${new Date().toISOString().split('T')[0]}.csv`);
    } else {
        res.status(404).send('No leads data found');
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access admin panel at: http://localhost:${PORT}/admin/leads?password=${process.env.ADMIN_PASSWORD || 'secure123'}`);
});

module.exports = app;