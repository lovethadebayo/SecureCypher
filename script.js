let rsaEncryptor = null;
let rsaDecryptor = null;

// Tab Switching
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`${tab}Mode`).classList.add('active');
    event.target.classList.add('active');
}

// Password Visibility Toggle
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Copy to Clipboard
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    document.execCommand('copy');
    
    // Show feedback on button
    const button = event.target.closest('button');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => {
        button.innerHTML = originalText;
    }, 2000);
}

// Clear Field
function clearField(elementId) {
    document.getElementById(elementId).value = '';
}

// Show temporary notification
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${isError ? '#dc3545' : '#28a745'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations to style
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Save Result as File
function saveAsFile() {
    const content = document.getElementById('resultText').value;
    if (!content) {
        showNotification('No content to save!', true);
        return;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `securecypher_encrypted_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('File saved successfully!');
}

// RSA Key Generation
function generateRSAKeys() {
    const crypt = new JSEncrypt({ default_key_size: '2048' });
    const privateKey = crypt.getPrivateKey();
    const publicKey = crypt.getPublicKey();
    
    document.getElementById('privateKey').value = privateKey;
    document.getElementById('publicKey').value = publicKey;
    
    rsaEncryptor = new JSEncrypt();
    rsaEncryptor.setPublicKey(publicKey);
    rsaDecryptor = new JSEncrypt();
    rsaDecryptor.setPrivateKey(privateKey);
    
    showNotification('RSA key pair generated successfully!');
}

// Show/Hide RSA Section
if (document.getElementById('algorithm')) {
    document.getElementById('algorithm').addEventListener('change', function() {
        const rsaSection = document.getElementById('rsaKeySection');
        if (this.value === 'rsa') {
            rsaSection.style.display = 'block';
        } else {
            rsaSection.style.display = 'none';
        }
    });
}

// Encryption Function - Result goes to result field
function encrypt() {
    const text = document.getElementById('inputText').value;
    const algorithm = document.getElementById('algorithm').value;
    let key = document.getElementById('encryptionKey').value;
    
    if (!text) {
        showNotification('Please enter text to encrypt.', true);
        return;
    }
    
    let result = '';
    
    try {
        switch(algorithm) {
            case 'aes-256-cbc':
                if (!key) {
                    showNotification('Please enter an encryption key.', true);
                    return;
                }
                result = CryptoJS.AES.encrypt(text, key).toString();
                break;
                
            case 'aes-128-cbc':
                if (!key) {
                    showNotification('Please enter an encryption key.', true);
                    return;
                }
                result = CryptoJS.AES.encrypt(text, key).toString();
                break;
                
            case 'des':
                if (!key || key.length !== 8) {
                    showNotification('DES requires an 8-character key.', true);
                    return;
                }
                result = CryptoJS.DES.encrypt(text, key).toString();
                break;
                
            case 'triple-des':
                if (!key) {
                    showNotification('Please enter an encryption key.', true);
                    return;
                }
                result = CryptoJS.TripleDES.encrypt(text, key).toString();
                break;
                
            case 'blowfish':
                if (!key) {
                    showNotification('Please enter an encryption key.', true);
                    return;
                }
                result = CryptoJS.AES.encrypt(text, key + 'blowfish_salt').toString();
                break;
                
            case 'rsa':
                const publicKey = document.getElementById('publicKey').value;
                if (!publicKey) {
                    showNotification('Please generate or paste an RSA public key first.', true);
                    return;
                }
                const encryptor = new JSEncrypt();
                encryptor.setPublicKey(publicKey);
                result = encryptor.encrypt(text);
                if (!result) {
                    showNotification('RSA encryption failed. Text may be too long (max 190 chars for 2048-bit key).', true);
                    return;
                }
                break;
        }
        
        document.getElementById('resultText').value = result;
        showNotification('✓ Encrypted successfully!');
    } catch (error) {
        showNotification('Encryption failed: ' + error.message, true);
    }
}

// Decryption Function - Result goes to result field, input stays as is
function decrypt() {
    const encrypted = document.getElementById('inputText').value;
    const algorithm = document.getElementById('algorithm').value;
    let key = document.getElementById('encryptionKey').value;
    
    if (!encrypted) {
        showNotification('Please paste encrypted text in the input field.', true);
        return;
    }
    
    let result = '';
    
    try {
        switch(algorithm) {
            case 'aes-256-cbc':
            case 'aes-128-cbc':
                if (!key) {
                    showNotification('Please enter the encryption key.', true);
                    return;
                }
                const bytes = CryptoJS.AES.decrypt(encrypted, key);
                result = bytes.toString(CryptoJS.enc.Utf8);
                if (!result) throw new Error('Wrong key or corrupted data');
                break;
                
            case 'des':
                if (!key || key.length !== 8) {
                    showNotification('DES requires an 8-character key.', true);
                    return;
                }
                const desBytes = CryptoJS.DES.decrypt(encrypted, key);
                result = desBytes.toString(CryptoJS.enc.Utf8);
                break;
                
            case 'triple-des':
                if (!key) {
                    showNotification('Please enter the encryption key.', true);
                    return;
                }
                const tripleDesBytes = CryptoJS.TripleDES.decrypt(encrypted, key);
                result = tripleDesBytes.toString(CryptoJS.enc.Utf8);
                break;
                
            case 'blowfish':
                if (!key) {
                    showNotification('Please enter the encryption key.', true);
                    return;
                }
                const blowfishBytes = CryptoJS.AES.decrypt(encrypted, key + 'blowfish_salt');
                result = blowfishBytes.toString(CryptoJS.enc.Utf8);
                break;
                
            case 'rsa':
                const privateKey = document.getElementById('privateKey').value;
                if (!privateKey) {
                    showNotification('Please enter your RSA private key.', true);
                    return;
                }
                const decryptor = new JSEncrypt();
                decryptor.setPrivateKey(privateKey);
                result = decryptor.decrypt(encrypted);
                break;
        }
        
        if (!result) {
            showNotification('Decryption failed. Wrong key or corrupted data.', true);
        } else {
            document.getElementById('resultText').value = result;
            showNotification('✓ Decrypted successfully!');
        }
    } catch (error) {
        showNotification('Decryption failed: ' + error.message, true);
    }
}

// File Encryption/Decryption
let currentFileData = null;
let currentFileName = '';

if (document.getElementById('fileInput')) {
    document.getElementById('fileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            currentFileName = file.name;
            const reader = new FileReader();
            reader.onload = function(event) {
                currentFileData = event.target.result;
                document.getElementById('fileInfo').innerHTML = `
                    <i class="fas fa-file"></i> File: ${file.name}<br>
                    <i class="fas fa-database"></i> Size: ${(file.size / 1024).toFixed(2)} KB<br>
                    <i class="fas fa-check-circle" style="color:#28a745"></i> Ready
                `;
                showNotification(`File loaded: ${file.name}`);
            };
            reader.readAsDataURL(file);
        }
    });
}

function encryptFile() {
    if (!currentFileData) {
        showNotification('Please select a file first.', true);
        return;
    }
    
    const key = document.getElementById('fileEncryptionKey').value;
    const algorithm = document.getElementById('fileAlgorithm').value;
    
    if (!key) {
        showNotification('Please enter an encryption key.', true);
        return;
    }
    
    let encrypted;
    switch(algorithm) {
        case 'aes-256-cbc':
        case 'aes-128-cbc':
            encrypted = CryptoJS.AES.encrypt(currentFileData, key).toString();
            break;
        case 'des':
            encrypted = CryptoJS.DES.encrypt(currentFileData, key).toString();
            break;
        case 'triple-des':
            encrypted = CryptoJS.TripleDES.encrypt(currentFileData, key).toString();
            break;
        case 'blowfish':
            encrypted = CryptoJS.AES.encrypt(currentFileData, key + 'blowfish_salt').toString();
            break;
    }
    
    const blob = new Blob([encrypted], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentFileName}.encrypted`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('✓ File encrypted and saved!');
}

function decryptFile() {
    if (!currentFileData) {
        showNotification('Please select an encrypted file first.', true);
        return;
    }
    
    const key = document.getElementById('fileEncryptionKey').value;
    const algorithm = document.getElementById('fileAlgorithm').value;
    
    if (!key) {
        showNotification('Please enter the decryption key.', true);
        return;
    }
    
    let decrypted;
    try {
        switch(algorithm) {
            case 'aes-256-cbc':
            case 'aes-128-cbc':
                const bytes = CryptoJS.AES.decrypt(currentFileData, key);
                decrypted = bytes.toString(CryptoJS.enc.Utf8);
                break;
            case 'des':
                const desBytes = CryptoJS.DES.decrypt(currentFileData, key);
                decrypted = desBytes.toString(CryptoJS.enc.Utf8);
                break;
            case 'triple-des':
                const tripleDesBytes = CryptoJS.TripleDES.decrypt(currentFileData, key);
                decrypted = tripleDesBytes.toString(CryptoJS.enc.Utf8);
                break;
            case 'blowfish':
                const blowfishBytes = CryptoJS.AES.decrypt(currentFileData, key + 'blowfish_salt');
                decrypted = blowfishBytes.toString(CryptoJS.enc.Utf8);
                break;
        }
        
        if (!decrypted) throw new Error('Empty result');
        
        // Remove the data URL prefix if it exists
        if (decrypted.startsWith('data:')) {
            const parts = decrypted.split(',');
            if (parts.length > 1) {
                decrypted = parts[1];
            }
        }
        
        const blob = new Blob([decrypted], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const originalName = currentFileName.replace(/\.encrypted$/, '');
        a.download = `${originalName}_decrypted.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('✓ File decrypted and saved!');
    } catch (error) {
        showNotification('Decryption failed. Wrong key or corrupted file.', true);
    }
}