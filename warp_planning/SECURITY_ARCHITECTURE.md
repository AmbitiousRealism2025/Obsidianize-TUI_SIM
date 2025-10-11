# Obsidianize TUI - Security Architecture

**Version**: 1.0  
**Created**: October 11, 2024  
**Classification**: Security Implementation Guidelines  
**Location**: `warp_planning/` (Planning Phase Documentation)

## Table of Contents

1. [Security Overview](#security-overview)
2. [API Key Management](#api-key-management)
3. [Encryption Implementation](#encryption-implementation)
4. [Storage Security](#storage-security)
5. [Network Security](#network-security)
6. [Rate Limiting Security](#rate-limiting-security)
7. [Input Validation](#input-validation)
8. [Error Handling Security](#error-handling-security)
9. [Audit and Logging](#audit-and-logging)
10. [Security Testing](#security-testing)
11. [Compliance and Best Practices](#compliance-and-best-practices)

---

## Security Overview

### Security Principles

**1. Defense in Depth**
- Multiple layers of security controls
- No single point of failure
- Fail-secure design patterns

**2. Zero Trust Architecture**
- Never trust, always verify
- Least privilege access
- Assume breach scenarios

**3. Data Protection**
- Encryption at rest and in transit
- Minimal data collection
- Secure data lifecycle management

**4. User Privacy**
- No server-side API key storage
- Client-side encryption
- Transparent security practices

### Threat Model

**Primary Assets:**
- User API keys (Gemini)
- Processed content data
- User configuration data
- System availability

**Threat Actors:**
- Malicious users
- Network attackers
- Insider threats
- Automated attacks

**Attack Vectors:**
- API key theft
- Man-in-the-middle attacks
- Configuration tampering
- Denial of service
- Code injection

---

## API Key Management

### Key Storage Architecture

#### Web Interface Security

```typescript
interface WebKeyStorage {
  // Client-side encryption only
  storageType: 'sessionStorage' | 'localStorage' | 'memoryOnly';
  encryptionAlgorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2';
  iterations: 100000; // OWASP recommended minimum
  saltLength: 32; // bytes
  
  // Security policies
  autoExpire: boolean;
  sessionTimeout: number; // milliseconds
  clearOnClose: boolean;
}

class WebApiKeyManager {
  private readonly STORAGE_KEY = 'obsidianize_encrypted_key';
  private readonly SALT_KEY = 'obsidianize_key_salt';
  
  async encryptAndStoreKey(
    plainKey: string,
    userPassphrase?: string,
    options: WebKeyStorage = DEFAULT_WEB_STORAGE
  ): Promise<boolean> {
    try {
      // Generate secure passphrase if none provided
      const passphrase = userPassphrase || await this.generateSecurePassphrase();
      
      // Generate random salt
      const salt = crypto.getRandomValues(new Uint8Array(32));
      
      // Derive encryption key using PBKDF2
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(passphrase),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const encryptionKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: options.iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      // Encrypt the API key
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        encryptionKey,
        new TextEncoder().encode(plainKey)
      );
      
      // Store encrypted data
      const encryptedData = {
        encrypted: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv),
        algorithm: 'AES-256-GCM',
        iterations: options.iterations,
        timestamp: Date.now()
      };
      
      const storage = this.getStorage(options.storageType);
      storage.setItem(this.STORAGE_KEY, JSON.stringify(encryptedData));
      storage.setItem(this.SALT_KEY, Array.from(salt).join(','));
      
      // Set auto-expiration if enabled
      if (options.autoExpire) {
        setTimeout(() => {
          this.clearStoredKey();
        }, options.sessionTimeout);
      }
      
      return true;
    } catch (error) {
      console.error('Key encryption failed:', error);
      return false;
    }
  }
  
  private async generateSecurePassphrase(): Promise<string> {
    // Generate cryptographically secure random passphrase
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  private getStorage(type: string): Storage {
    switch (type) {
      case 'localStorage':
        return localStorage;
      case 'sessionStorage':
        return sessionStorage;
      default:
        throw new Error('Memory-only storage not implemented for web');
    }
  }
}
```

#### CLI Security

```typescript
interface CLIKeyStorage {
  configPath: string; // ~/.obsidianize/config.json
  filePermissions: 0o600; // Read/write for owner only
  encryptionAlgorithm: 'AES-256-GCM';
  keyDerivationFunction: 'scrypt';
  
  // Security settings
  backupEnabled: boolean;
  rotationEnabled: boolean;
  auditLogging: boolean;
}

class CLIApiKeyManager {
  private readonly CONFIG_DIR = path.join(os.homedir(), '.obsidianize');
  private readonly CONFIG_FILE = path.join(this.CONFIG_DIR, 'config.json');
  private readonly BACKUP_DIR = path.join(this.CONFIG_DIR, 'backups');
  
  async storeKey(
    plainKey: string,
    passphrase: string,
    options: CLIKeyStorage = DEFAULT_CLI_STORAGE
  ): Promise<boolean> {
    try {
      // Ensure config directory exists with secure permissions
      await this.ensureSecureDirectory();
      
      // Generate salt and encrypt key
      const salt = crypto.randomBytes(32);
      const encryptedData = await this.encryptKey(plainKey, passphrase, salt);
      
      // Create config object
      const config = {
        version: '1.0',
        encrypted: true,
        algorithm: 'AES-256-GCM',
        keyDerivation: 'scrypt',
        data: encryptedData,
        metadata: {
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          rotationDate: null
        }
      };
      
      // Backup existing config if it exists
      if (options.backupEnabled && fs.existsSync(this.CONFIG_FILE)) {
        await this.backupConfig();
      }
      
      // Write config with secure permissions
      await fs.promises.writeFile(
        this.CONFIG_FILE,
        JSON.stringify(config, null, 2),
        { mode: options.filePermissions }
      );
      
      // Verify file permissions
      await this.verifyFilePermissions(this.CONFIG_FILE, options.filePermissions);
      
      // Log security event
      if (options.auditLogging) {
        await this.logSecurityEvent('KEY_STORED', { timestamp: Date.now() });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to store key securely:', error);
      return false;
    }
  }
  
  private async encryptKey(
    plainKey: string,
    passphrase: string,
    salt: Buffer
  ): Promise<EncryptedKeyData> {
    // Use scrypt for key derivation (more secure than PBKDF2)
    const key = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(passphrase, salt, 32, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
    
    // Encrypt using AES-256-GCM
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm');
    cipher.setAAD(Buffer.from('obsidianize-api-key'));
    
    let encrypted = cipher.update(plainKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: 'AES-256-GCM'
    };
  }
  
  private async ensureSecureDirectory(): Promise<void> {
    if (!fs.existsSync(this.CONFIG_DIR)) {
      await fs.promises.mkdir(this.CONFIG_DIR, { mode: 0o700 });
    }
    
    // Verify directory permissions
    const stats = await fs.promises.stat(this.CONFIG_DIR);
    const mode = stats.mode & parseInt('777', 8);
    if (mode !== 0o700) {
      await fs.promises.chmod(this.CONFIG_DIR, 0o700);
    }
  }
}
```

### Key Validation Security

```typescript
interface KeyValidationSecurity {
  // Validation policies
  minKeyLength: number;
  requiredPrefix: string;
  allowedCharacters: RegExp;
  
  // Security checks
  entropyCheck: boolean;
  blacklistCheck: boolean;
  leakageCheck: boolean;
  
  // Rate limiting
  validationRateLimit: number;
  validationWindow: number;
}

class SecureKeyValidator {
  private readonly GEMINI_KEY_PATTERN = /^AIza[0-9A-Za-z_-]{35}$/;
  private readonly MIN_ENTROPY_BITS = 128;
  
  async validateKey(
    key: string,
    security: KeyValidationSecurity = DEFAULT_VALIDATION_SECURITY
  ): Promise<KeyValidationResult> {
    const result: KeyValidationResult = {
      valid: false,
      securityScore: 0,
      warnings: [],
      errors: []
    };
    
    try {
      // Format validation
      if (!this.GEMINI_KEY_PATTERN.test(key)) {
        result.errors.push('Invalid Gemini API key format');
        return result;
      }
      
      // Entropy check
      if (security.entropyCheck) {
        const entropy = this.calculateEntropy(key);
        if (entropy < security.entropyCheck) {
          result.warnings.push(`Low entropy: ${entropy} bits`);
          result.securityScore -= 20;
        }
      }
      
      // Blacklist check (common test keys, examples, etc.)
      if (security.blacklistCheck) {
        if (await this.isBlacklistedKey(key)) {
          result.errors.push('Key appears to be a test or example key');
          return result;
        }
      }
      
      // Network validation with rate limiting
      const networkResult = await this.validateKeyWithAPI(key);
      if (!networkResult.valid) {
        result.errors.push(networkResult.error || 'Key validation failed');
        return result;
      }
      
      result.valid = true;
      result.securityScore = Math.max(0, 100 + result.securityScore);
      result.permissions = networkResult.permissions;
      result.quotaInfo = networkResult.quotaInfo;
      
      return result;
    } catch (error) {
      result.errors.push('Validation process failed');
      return result;
    }
  }
  
  private calculateEntropy(text: string): number {
    const freq = new Map<string, number>();
    for (const char of text) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }
    
    let entropy = 0;
    for (const count of freq.values()) {
      const p = count / text.length;
      entropy -= p * Math.log2(p);
    }
    
    return entropy * text.length;
  }
  
  private async isBlacklistedKey(key: string): Promise<boolean> {
    const blacklist = [
      'AIzaSyDemoKey', // Common demo key
      'AIzaSyTest123', // Common test key
      'AIzaSyExample', // Example key
    ];
    
    return blacklist.some(blacklistedKey => 
      key.startsWith(blacklistedKey.substring(0, 10))
    );
  }
}
```

---

## Encryption Implementation

### Encryption Standards

```typescript
interface EncryptionStandards {
  // Symmetric encryption
  symmetricAlgorithm: 'AES-256-GCM';
  keySize: 256; // bits
  ivSize: 96; // bits for GCM
  tagSize: 128; // bits for GCM
  
  // Key derivation
  kdf: 'scrypt' | 'PBKDF2';
  iterations: number;
  saltSize: 256; // bits
  
  // Random number generation
  csprng: 'crypto.getRandomValues' | 'crypto.randomBytes';
  
  // Security parameters
  minPasswordEntropy: number;
  keyRotationInterval: number; // milliseconds
}

class EncryptionService {
  private readonly standards: EncryptionStandards = {
    symmetricAlgorithm: 'AES-256-GCM',
    keySize: 256,
    ivSize: 96,
    tagSize: 128,
    kdf: 'scrypt',
    iterations: 16384, // Recommended for scrypt
    saltSize: 256,
    csprng: 'crypto.randomBytes',
    minPasswordEntropy: 64,
    keyRotationInterval: 30 * 24 * 60 * 60 * 1000 // 30 days
  };
  
  async encrypt(
    plaintext: string,
    password: string,
    additionalData?: string
  ): Promise<EncryptedData> {
    // Generate cryptographically secure random values
    const salt = crypto.randomBytes(this.standards.saltSize / 8);
    const iv = crypto.randomBytes(this.standards.ivSize / 8);
    
    // Derive key using scrypt
    const key = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(password, salt, this.standards.keySize / 8, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
    
    // Encrypt using AES-256-GCM
    const cipher = crypto.createCipher(this.standards.symmetricAlgorithm);
    
    // Set additional authenticated data if provided
    if (additionalData) {
      cipher.setAAD(Buffer.from(additionalData, 'utf8'));
    }
    
    let encrypted = cipher.update(plaintext, 'utf8');
    const final = cipher.final();
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: Buffer.concat([encrypted, final]).toString('base64'),
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: this.standards.symmetricAlgorithm,
      iterations: this.standards.iterations,
      createdAt: new Date().toISOString()
    };
  }
  
  async decrypt(
    encryptedData: EncryptedData,
    password: string,
    additionalData?: string
  ): Promise<string> {
    // Reconstruct components
    const salt = Buffer.from(encryptedData.salt, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const encrypted = Buffer.from(encryptedData.encrypted, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    
    // Derive key
    const key = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(password, salt, this.standards.keySize / 8, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
    
    // Decrypt using AES-256-GCM
    const decipher = crypto.createDecipher(encryptedData.algorithm);
    decipher.setAuthTag(authTag);
    
    if (additionalData) {
      decipher.setAAD(Buffer.from(additionalData, 'utf8'));
    }
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // Secure key derivation with timing attack protection
  async deriveKey(
    password: string,
    salt: Buffer,
    keyLength: number = 32
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.scrypt(
        password,
        salt,
        keyLength,
        {
          N: 16384,    // CPU/memory cost
          r: 8,        // Block size
          p: 1,        // Parallelization
          maxmem: 64 * 1024 * 1024 // 64MB max memory
        },
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });
  }
}
```

---

## Storage Security

### Secure Configuration Storage

```typescript
interface SecureStorageConfig {
  // File system security
  filePermissions: number;
  directoryPermissions: number;
  ownerOnly: boolean;
  
  // Backup security
  encryptedBackups: boolean;
  backupRetention: number; // days
  backupRotation: boolean;
  
  // Integrity protection
  checksums: boolean;
  signatureValidation: boolean;
  tamperDetection: boolean;
  
  // Access control
  accessLogging: boolean;
  concurrentAccessProtection: boolean;
  lockFileTimeout: number; // milliseconds
}

class SecureConfigStorage {
  private readonly CONFIG_PERMISSIONS = 0o600; // rw-------
  private readonly DIR_PERMISSIONS = 0o700;    // rwx------
  
  async secureWrite(
    filePath: string,
    data: any,
    config: SecureStorageConfig = DEFAULT_STORAGE_CONFIG
  ): Promise<boolean> {
    const lockFile = `${filePath}.lock`;
    
    try {
      // Acquire exclusive lock
      await this.acquireLock(lockFile, config.lockFileTimeout);
      
      // Ensure directory exists with secure permissions
      const dir = path.dirname(filePath);
      await this.ensureSecureDirectory(dir, config.directoryPermissions);
      
      // Serialize data
      const jsonData = JSON.stringify(data, null, 2);
      
      // Calculate integrity checksum
      const checksum = crypto.createHash('sha256')
        .update(jsonData)
        .digest('hex');
      
      const securedData = {
        data,
        metadata: {
          checksum,
          timestamp: Date.now(),
          version: '1.0'
        }
      };
      
      // Create backup if enabled
      if (config.encryptedBackups && fs.existsSync(filePath)) {
        await this.createSecureBackup(filePath, config);
      }
      
      // Write to temporary file first (atomic operation)
      const tempFile = `${filePath}.tmp`;
      await fs.promises.writeFile(
        tempFile,
        JSON.stringify(securedData, null, 2),
        { mode: config.filePermissions }
      );
      
      // Verify file was written correctly
      const verification = await this.verifyFileIntegrity(tempFile, checksum);
      if (!verification.valid) {
        await fs.promises.unlink(tempFile);
        throw new Error('File integrity verification failed');
      }
      
      // Atomic move to final location
      await fs.promises.rename(tempFile, filePath);
      
      // Verify final file permissions
      await this.verifyFilePermissions(filePath, config.filePermissions);
      
      // Log access if enabled
      if (config.accessLogging) {
        await this.logFileAccess(filePath, 'WRITE', 'SUCCESS');
      }
      
      return true;
    } catch (error) {
      if (config.accessLogging) {
        await this.logFileAccess(filePath, 'WRITE', 'FAILED', error.message);
      }
      throw error;
    } finally {
      // Always release lock
      await this.releaseLock(lockFile);
    }
  }
  
  async secureRead(
    filePath: string,
    config: SecureStorageConfig = DEFAULT_STORAGE_CONFIG
  ): Promise<any> {
    try {
      // Check file exists and has correct permissions
      await this.verifyFilePermissions(filePath, config.filePermissions);
      
      // Read file content
      const content = await fs.promises.readFile(filePath, 'utf8');
      const parsed = JSON.parse(content);
      
      // Verify integrity if checksum is present
      if (parsed.metadata?.checksum) {
        const verification = await this.verifyDataIntegrity(parsed);
        if (!verification.valid) {
          throw new Error('Data integrity check failed - possible tampering');
        }
      }
      
      // Log access if enabled
      if (config.accessLogging) {
        await this.logFileAccess(filePath, 'READ', 'SUCCESS');
      }
      
      return parsed.data;
    } catch (error) {
      if (config.accessLogging) {
        await this.logFileAccess(filePath, 'READ', 'FAILED', error.message);
      }
      throw error;
    }
  }
  
  private async verifyDataIntegrity(data: any): Promise<{ valid: boolean; error?: string }> {
    try {
      const { metadata, data: actualData } = data;
      const expectedChecksum = metadata.checksum;
      
      const calculatedChecksum = crypto.createHash('sha256')
        .update(JSON.stringify(actualData, null, 2))
        .digest('hex');
      
      if (calculatedChecksum !== expectedChecksum) {
        return { 
          valid: false, 
          error: 'Checksum mismatch - file may have been tampered with' 
        };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}
```

---

## Network Security

### HTTPS Enforcement

```typescript
interface NetworkSecurityConfig {
  // TLS Configuration
  httpsOnly: boolean;
  minTlsVersion: string;
  cipherSuites: string[];
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
  };
  
  // API Security
  apiKeyHeader: string;
  requestTimeout: number;
  maxRequestSize: number;
  corsPolicy: CorsPolicy;
  
  // Rate limiting
  globalRateLimit: RateLimit;
  perKeyRateLimit: RateLimit;
  burstProtection: BurstProtection;
}

class NetworkSecurityManager {
  private readonly securityHeaders = {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
  
  configureSecureServer(config: NetworkSecurityConfig): Bun.Server {
    return Bun.serve({
      port: process.env.PORT || 3000,
      tls: {
        // Force HTTPS in production
        key: process.env.TLS_KEY,
        cert: process.env.TLS_CERT,
        minVersion: 'TLSv1.2'
      },
      
      async fetch(req) {
        const url = new URL(req.url);
        
        // Enforce HTTPS redirect in production
        if (config.httpsOnly && req.url.startsWith('http://')) {
          return new Response('', {
            status: 301,
            headers: {
              'Location': req.url.replace('http://', 'https://'),
              ...this.securityHeaders
            }
          });
        }
        
        // Apply security headers to all responses
        const response = await this.handleRequest(req, config);
        
        // Add security headers
        Object.entries(this.securityHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        
        return response;
      }
    });
  }
  
  private async handleRequest(req: Request, config: NetworkSecurityConfig): Promise<Response> {
    // Check request size limit
    if (req.headers.get('content-length')) {
      const contentLength = parseInt(req.headers.get('content-length')!);
      if (contentLength > config.maxRequestSize) {
        return new Response('Request too large', { status: 413 });
      }
    }
    
    // Apply rate limiting
    const clientId = this.getClientId(req);
    const rateLimitResult = await this.checkRateLimit(clientId, config.globalRateLimit);
    
    if (!rateLimitResult.allowed) {
      return new Response('Rate limit exceeded', { 
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
        }
      });
    }
    
    // Handle API requests
    if (req.url.includes('/api/')) {
      return await this.handleAPIRequest(req, config);
    }
    
    // Handle static content
    return await this.handleStaticRequest(req);
  }
  
  private async handleAPIRequest(req: Request, config: NetworkSecurityConfig): Promise<Response> {
    // Validate API key if required
    const apiKey = req.headers.get(config.apiKeyHeader);
    if (!apiKey) {
      return new Response('API key required', { status: 401 });
    }
    
    // Apply per-key rate limiting
    const keyRateLimit = await this.checkRateLimit(apiKey, config.perKeyRateLimit);
    if (!keyRateLimit.allowed) {
      return new Response('API key rate limit exceeded', { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': keyRateLimit.remaining.toString(),
          'X-RateLimit-Reset': keyRateLimit.resetTime.toISOString()
        }
      });
    }
    
    // Process API request
    return await this.processAPIRequest(req, apiKey);
  }
}
```

### API Request Security

```typescript
interface APISecurityConfig {
  // Request validation
  maxUrlLength: number;
  allowedContentTypes: string[];
  requireContentType: boolean;
  
  // Input sanitization
  sanitizeInputs: boolean;
  maxStringLength: number;
  allowedCharacters: RegExp;
  
  // Response security
  sanitizeOutputs: boolean;
  includeSecurityHeaders: boolean;
  logAllRequests: boolean;
}

class APISecurityValidator {
  async validateRequest(req: Request, config: APISecurityConfig): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      sanitizedData: null
    };
    
    try {
      // Validate URL length
      if (req.url.length > config.maxUrlLength) {
        result.errors.push('URL too long');
        result.valid = false;
      }
      
      // Validate content type
      const contentType = req.headers.get('content-type');
      if (config.requireContentType && !contentType) {
        result.errors.push('Content-Type header required');
        result.valid = false;
      }
      
      if (contentType && !config.allowedContentTypes.includes(contentType)) {
        result.errors.push('Content-Type not allowed');
        result.valid = false;
      }
      
      // Parse and validate request body
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const body = await req.text();
        const validationResult = await this.validateRequestBody(body, config);
        
        if (!validationResult.valid) {
          result.errors.push(...validationResult.errors);
          result.valid = false;
        } else {
          result.sanitizedData = validationResult.sanitizedData;
        }
      }
      
      return result;
    } catch (error) {
      result.valid = false;
      result.errors.push('Request validation failed');
      return result;
    }
  }
  
  private async validateRequestBody(body: string, config: APISecurityConfig): Promise<ValidationResult> {
    try {
      // Parse JSON
      const data = JSON.parse(body);
      
      // Sanitize inputs if enabled
      if (config.sanitizeInputs) {
        const sanitized = this.sanitizeObject(data, config);
        return {
          valid: true,
          errors: [],
          sanitizedData: sanitized
        };
      }
      
      return {
        valid: true,
        errors: [],
        sanitizedData: data
      };
    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid JSON format'],
        sanitizedData: null
      };
    }
  }
  
  private sanitizeObject(obj: any, config: APISecurityConfig): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj, config);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, config));
    }
    
    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeString(key, config);
        sanitized[sanitizedKey] = this.sanitizeObject(value, config);
      }
      return sanitized;
    }
    
    return obj;
  }
  
  private sanitizeString(str: string, config: APISecurityConfig): string {
    // Truncate to max length
    if (str.length > config.maxStringLength) {
      str = str.substring(0, config.maxStringLength);
    }
    
    // Remove disallowed characters
    if (config.allowedCharacters) {
      str = str.replace(config.allowedCharacters, '');
    }
    
    // HTML encode dangerous characters
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
}
```

---

## Rate Limiting Security

### Multi-Layer Rate Limiting

```typescript
interface RateLimitConfig {
  // Time windows
  windowSizeMs: number;
  slidingWindow: boolean;
  
  // Limits
  requestsPerWindow: number;
  tokensPerWindow: number;
  concurrentRequests: number;
  
  // Burst protection
  burstSize: number;
  burstRecoveryMs: number;
  
  // Penalties
  violationPenalty: number; // Additional delay
  escalationFactor: number; // Exponential backoff
  banThreshold: number;     // Automatic temporary ban
}

class AdvancedRateLimiter {
  private windowCounts = new Map<string, WindowCounter[]>();
  private violations = new Map<string, ViolationRecord>();
  private bannedClients = new Map<string, BanRecord>();
  
  async checkLimit(
    clientId: string,
    config: RateLimitConfig,
    requestType: 'api' | 'validation' | 'processing' = 'api'
  ): Promise<RateLimitResult> {
    const now = Date.now();
    
    // Check if client is banned
    const banRecord = this.bannedClients.get(clientId);
    if (banRecord && now < banRecord.expiresAt) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(banRecord.expiresAt),
        retryAfter: Math.ceil((banRecord.expiresAt - now) / 1000),
        reason: 'client_banned'
      };
    }
    
    // Remove expired ban
    if (banRecord && now >= banRecord.expiresAt) {
      this.bannedClients.delete(clientId);
    }
    
    // Get current window counts
    const windows = this.getWindowCounts(clientId, now, config);
    const currentRequests = this.countRequestsInWindow(windows, now, config.windowSizeMs);
    
    // Check request limit
    if (currentRequests >= config.requestsPerWindow) {
      await this.recordViolation(clientId, 'rate_limit_exceeded', config);
      
      const nextWindow = this.getNextWindowStart(now, config.windowSizeMs);
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(nextWindow),
        retryAfter: Math.ceil((nextWindow - now) / 1000),
        reason: 'rate_limit_exceeded'
      };
    }
    
    // Check burst protection
    const burstCount = this.countRequestsInBurst(windows, now, config.burstRecoveryMs);
    if (burstCount >= config.burstSize) {
      await this.recordViolation(clientId, 'burst_limit_exceeded', config);
      
      return {
        allowed: false,
        remaining: config.requestsPerWindow - currentRequests,
        resetTime: new Date(now + config.burstRecoveryMs),
        retryAfter: Math.ceil(config.burstRecoveryMs / 1000),
        reason: 'burst_limit_exceeded'
      };
    }
    
    // Record successful request
    this.recordRequest(clientId, now, requestType);
    
    return {
      allowed: true,
      remaining: config.requestsPerWindow - currentRequests - 1,
      resetTime: new Date(this.getNextWindowStart(now, config.windowSizeMs)),
      retryAfter: 0,
      reason: 'allowed'
    };
  }
  
  private async recordViolation(
    clientId: string,
    violationType: string,
    config: RateLimitConfig
  ): Promise<void> {
    const now = Date.now();
    let violation = this.violations.get(clientId);
    
    if (!violation) {
      violation = {
        count: 0,
        firstViolation: now,
        lastViolation: now,
        types: new Set()
      };
      this.violations.set(clientId, violation);
    }
    
    violation.count++;
    violation.lastViolation = now;
    violation.types.add(violationType);
    
    // Check for automatic ban
    if (violation.count >= config.banThreshold) {
      const banDuration = this.calculateBanDuration(violation, config);
      this.bannedClients.set(clientId, {
        reason: 'repeated_violations',
        bannedAt: now,
        expiresAt: now + banDuration,
        violationCount: violation.count
      });
      
      // Log security event
      await this.logSecurityEvent('CLIENT_BANNED', {
        clientId,
        violationCount: violation.count,
        banDuration,
        timestamp: now
      });
    }
  }
  
  private calculateBanDuration(violation: ViolationRecord, config: RateLimitConfig): number {
    // Exponential backoff based on violation count
    const baseDuration = 60000; // 1 minute
    const maxDuration = 24 * 60 * 60 * 1000; // 24 hours
    
    const duration = Math.min(
      baseDuration * Math.pow(config.escalationFactor, violation.count - config.banThreshold),
      maxDuration
    );
    
    return duration;
  }
}
```

---

## Security Testing

### Automated Security Testing

```typescript
interface SecurityTestConfig {
  // Test categories
  encryptionTests: boolean;
  keyManagementTests: boolean;
  networkSecurityTests: boolean;
  inputValidationTests: boolean;
  
  // Test parameters
  keyStrengthTests: KeyStrengthTest[];
  penetrationTests: PenetrationTest[];
  performanceTests: SecurityPerformanceTest[];
  
  // Reporting
  generateReport: boolean;
  reportFormat: 'json' | 'html' | 'markdown';
  includeRecommendations: boolean;
}

class SecurityTestSuite {
  async runAllTests(config: SecurityTestConfig): Promise<SecurityTestReport> {
    const report: SecurityTestReport = {
      timestamp: new Date().toISOString(),
      overallScore: 0,
      categories: {},
      vulnerabilities: [],
      recommendations: []
    };
    
    // Run encryption tests
    if (config.encryptionTests) {
      const encryptionResults = await this.testEncryption();
      report.categories.encryption = encryptionResults;
    }
    
    // Run key management tests
    if (config.keyManagementTests) {
      const keyMgmtResults = await this.testKeyManagement();
      report.categories.keyManagement = keyMgmtResults;
    }
    
    // Run network security tests
    if (config.networkSecurityTests) {
      const networkResults = await this.testNetworkSecurity();
      report.categories.networkSecurity = networkResults;
    }
    
    // Run input validation tests
    if (config.inputValidationTests) {
      const inputResults = await this.testInputValidation();
      report.categories.inputValidation = inputResults;
    }
    
    // Calculate overall security score
    report.overallScore = this.calculateOverallScore(report.categories);
    
    // Generate recommendations
    if (config.includeRecommendations) {
      report.recommendations = this.generateRecommendations(report);
    }
    
    return report;
  }
  
  private async testEncryption(): Promise<TestCategoryResult> {
    const tests: TestResult[] = [];
    
    // Test encryption strength
    tests.push(await this.testEncryptionStrength());
    
    // Test key derivation
    tests.push(await this.testKeyDerivation());
    
    // Test random number generation
    tests.push(await this.testRandomGeneration());
    
    // Test encryption performance
    tests.push(await this.testEncryptionPerformance());
    
    return {
      category: 'encryption',
      score: this.calculateCategoryScore(tests),
      tests,
      vulnerabilities: tests
        .filter(t => !t.passed)
        .map(t => ({ severity: t.severity, description: t.description }))
    };
  }
  
  private async testEncryptionStrength(): Promise<TestResult> {
    try {
      const encryptionService = new EncryptionService();
      const testData = 'test-encryption-data';
      const password = 'test-password-123';
      
      // Test encryption
      const encrypted = await encryptionService.encrypt(testData, password);
      
      // Verify encrypted data properties
      const checks = [
        { name: 'Algorithm is AES-256-GCM', pass: encrypted.algorithm === 'AES-256-GCM' },
        { name: 'Salt is present and sufficient length', pass: encrypted.salt.length >= 32 },
        { name: 'IV is present and correct length', pass: encrypted.iv.length >= 16 },
        { name: 'Auth tag is present', pass: !!encrypted.authTag },
        { name: 'Encrypted data differs from plaintext', pass: encrypted.encrypted !== testData }
      ];
      
      const failedChecks = checks.filter(c => !c.pass);
      
      return {
        name: 'Encryption Strength',
        passed: failedChecks.length === 0,
        score: failedChecks.length === 0 ? 100 : Math.max(0, 100 - failedChecks.length * 20),
        description: failedChecks.length > 0 
          ? `Failed checks: ${failedChecks.map(c => c.name).join(', ')}`
          : 'Encryption meets security requirements',
        severity: failedChecks.length > 0 ? 'HIGH' : 'NONE',
        details: checks
      };
    } catch (error) {
      return {
        name: 'Encryption Strength',
        passed: false,
        score: 0,
        description: `Encryption test failed: ${error.message}`,
        severity: 'CRITICAL'
      };
    }
  }
}
```

---

## Compliance and Best Practices

### Security Standards Compliance

```typescript
interface ComplianceStandards {
  // Standards
  owasp: OWASPCompliance;
  nist: NISTCompliance;
  iso27001: ISO27001Compliance;
  gdpr: GDPRCompliance;
  
  // Audit requirements
  auditLogging: boolean;
  retentionPeriod: number; // days
  logEncryption: boolean;
  
  // Documentation
  securityPolicy: boolean;
  incidentResponse: boolean;
  riskAssessment: boolean;
}

class ComplianceManager {
  async assessCompliance(standards: ComplianceStandards): Promise<ComplianceReport> {
    const report: ComplianceReport = {
      timestamp: new Date().toISOString(),
      standards: {},
      overallCompliance: 0,
      gaps: [],
      recommendations: []
    };
    
    // OWASP Top 10 compliance
    if (standards.owasp) {
      report.standards.owasp = await this.assessOWASPCompliance();
    }
    
    // NIST Cybersecurity Framework
    if (standards.nist) {
      report.standards.nist = await this.assessNISTCompliance();
    }
    
    // GDPR compliance for data protection
    if (standards.gdpr) {
      report.standards.gdpr = await this.assessGDPRCompliance();
    }
    
    return report;
  }
  
  private async assessOWASPCompliance(): Promise<StandardCompliance> {
    const checks: ComplianceCheck[] = [
      {
        id: 'A01-2021',
        name: 'Broken Access Control',
        description: 'API key validation and secure storage',
        compliant: true,
        evidence: 'API keys are validated and stored encrypted'
      },
      {
        id: 'A02-2021',
        name: 'Cryptographic Failures',
        description: 'Strong encryption implementation',
        compliant: true,
        evidence: 'AES-256-GCM with secure key derivation'
      },
      {
        id: 'A03-2021',
        name: 'Injection',
        description: 'Input validation and sanitization',
        compliant: true,
        evidence: 'All inputs validated and sanitized'
      },
      {
        id: 'A04-2021',
        name: 'Insecure Design',
        description: 'Security by design principles',
        compliant: true,
        evidence: 'Security controls built into architecture'
      },
      {
        id: 'A05-2021',
        name: 'Security Misconfiguration',
        description: 'Secure default configurations',
        compliant: true,
        evidence: 'Security headers and secure defaults implemented'
      },
      {
        id: 'A06-2021',
        name: 'Vulnerable and Outdated Components',
        description: 'Regular dependency updates',
        compliant: true,
        evidence: 'Dependency scanning and regular updates'
      },
      {
        id: 'A07-2021',
        name: 'Identification and Authentication Failures',
        description: 'Strong API key management',
        compliant: true,
        evidence: 'Secure key validation and storage'
      },
      {
        id: 'A08-2021',
        name: 'Software and Data Integrity Failures',
        description: 'Data integrity checks',
        compliant: true,
        evidence: 'Checksums and integrity verification'
      },
      {
        id: 'A09-2021',
        name: 'Security Logging and Monitoring Failures',
        description: 'Comprehensive security logging',
        compliant: true,
        evidence: 'Security events logged and monitored'
      },
      {
        id: 'A10-2021',
        name: 'Server-Side Request Forgery (SSRF)',
        description: 'URL validation and restrictions',
        compliant: true,
        evidence: 'URL validation and allowlist implemented'
      }
    ];
    
    const compliantCount = checks.filter(c => c.compliant).length;
    const complianceScore = (compliantCount / checks.length) * 100;
    
    return {
      standard: 'OWASP Top 10 2021',
      score: complianceScore,
      checks,
      gaps: checks.filter(c => !c.compliant),
      lastAssessed: new Date().toISOString()
    };
  }
}
```

---

This security architecture document provides comprehensive guidelines for implementing robust security measures throughout the Obsidianize TUI system. It covers all critical aspects from API key management to compliance standards, ensuring that the application meets enterprise-grade security requirements while maintaining usability and performance.

The security implementation should be reviewed and updated regularly as the system evolves and new security threats emerge.

<citations>
<document>
<document_type>RULE</document_type>
<document_id>/Users/ambrealismwork/Desktop/Coding-Projects/Obsidianize-TUI_SIM/agents.md</document_id>
</document>
</citations>