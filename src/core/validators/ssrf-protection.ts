/**
 * SSRF (Server-Side Request Forgery) Protection Module
 * Prevents requests to internal/private IP ranges and other security-sensitive endpoints
 *
 * Based on Opus Code Review recommendations (SEC-1.1, SEC-1.2)
 * Version: 1.0.0
 */

/**
 * IP Range configuration for SSRF protection
 */
export interface IPRangeConfig {
  /** CIDR notation or specific IP */
  range: string;
  /** Description of why this range is blocked */
  description: string;
  /** Whether this range can be overridden by configuration */
  overridable: boolean;
}

/**
 * SSRF validation result
 */
export interface SSRFValidationResult {
  /** Whether the URL is safe to request */
  safe: boolean;
  /** Error message if not safe */
  error?: string;
  /** The IP address that was resolved (if applicable) */
  resolvedIP?: string;
  /** The blocked range that matched (if any) */
  blockedRange?: string;
}

/**
 * Default blocked IP ranges for SSRF protection
 * These ranges should never be accessible from server-side requests
 */
const DEFAULT_BLOCKED_RANGES: IPRangeConfig[] = [
  // Loopback addresses
  { range: '127.0.0.0/8', description: 'Loopback addresses', overridable: false },
  { range: '::1/128', description: 'IPv6 loopback', overridable: false },

  // Private networks (RFC 1918)
  { range: '10.0.0.0/8', description: 'Private Class A network', overridable: true },
  { range: '172.16.0.0/12', description: 'Private Class B network', overridable: true },
  { range: '192.168.0.0/16', description: 'Private Class C network', overridable: true },

  // Link-local addresses (including AWS metadata service)
  { range: '169.254.0.0/16', description: 'Link-local/AWS metadata service', overridable: false },
  { range: 'fe80::/10', description: 'IPv6 link-local', overridable: false },

  // Other special ranges
  { range: '0.0.0.0/8', description: 'Current network', overridable: false },
  { range: '100.64.0.0/10', description: 'Carrier-grade NAT', overridable: true },
  { range: '192.0.0.0/24', description: 'IETF protocol assignments', overridable: false },
  { range: '192.0.2.0/24', description: 'TEST-NET-1', overridable: false },
  { range: '198.51.100.0/24', description: 'TEST-NET-2', overridable: false },
  { range: '203.0.113.0/24', description: 'TEST-NET-3', overridable: false },
  { range: '224.0.0.0/4', description: 'Multicast', overridable: false },
  { range: '240.0.0.0/4', description: 'Reserved for future use', overridable: false },
  { range: '255.255.255.255/32', description: 'Broadcast', overridable: false },
];

/**
 * Blocked hostnames that could be used to access internal services
 */
const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'metadata.google.internal',
  'metadata.goog',
  '169.254.169.254', // AWS/GCP metadata service
  'instance-data', // AWS instance data
];

/**
 * Parse an IP address into its numeric components
 */
function parseIPv4(ip: string): number[] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;

  const nums = parts.map(p => parseInt(p, 10));
  if (nums.some(n => isNaN(n) || n < 0 || n > 255)) return null;

  return nums;
}

/**
 * Convert IPv4 address to a 32-bit number
 */
function ipv4ToNumber(ip: string): number | null {
  const parts = parseIPv4(ip);
  if (!parts) return null;

  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

/**
 * Parse CIDR notation and return base IP and mask
 */
function parseCIDR(cidr: string): { ip: number; mask: number } | null {
  const [ipPart, maskPart] = cidr.split('/');

  const ip = ipv4ToNumber(ipPart);
  if (ip === null) return null;

  const maskBits = parseInt(maskPart, 10);
  if (isNaN(maskBits) || maskBits < 0 || maskBits > 32) return null;

  // Create mask: e.g., /24 -> 0xFFFFFF00
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;

  return { ip: ip >>> 0, mask };
}

/**
 * Check if an IP address falls within a CIDR range
 */
function isIPInRange(ip: string, cidr: string): boolean {
  // Handle IPv6 ranges (simplified - just check for exact match or known ranges)
  if (cidr.includes(':')) {
    // For IPv6, we do a simplified check
    const normalizedIP = ip.toLowerCase();
    const normalizedRange = cidr.split('/')[0].toLowerCase();
    return normalizedIP === normalizedRange || normalizedIP.startsWith(normalizedRange);
  }

  const ipNum = ipv4ToNumber(ip);
  if (ipNum === null) return false;

  const range = parseCIDR(cidr);
  if (!range) return false;

  return ((ipNum >>> 0) & range.mask) === ((range.ip >>> 0) & range.mask);
}

/**
 * Check if hostname looks like an IP address
 */
function isIPAddress(hostname: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^[\da-fA-F:]+$/;

  return ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname);
}

/**
 * SSRF Protection class for URL validation
 */
export class SSRFProtection {
  private blockedRanges: IPRangeConfig[];
  private blockedHostnames: Set<string>;
  private allowedOverrides: Set<string>;

  constructor(options: {
    additionalBlockedRanges?: IPRangeConfig[];
    allowedInternalRanges?: string[];
    additionalBlockedHostnames?: string[];
  } = {}) {
    // Initialize with default blocked ranges
    this.blockedRanges = [...DEFAULT_BLOCKED_RANGES];

    // Add any additional blocked ranges
    if (options.additionalBlockedRanges) {
      this.blockedRanges.push(...options.additionalBlockedRanges);
    }

    // Initialize blocked hostnames
    this.blockedHostnames = new Set(BLOCKED_HOSTNAMES.map(h => h.toLowerCase()));

    // Add any additional blocked hostnames
    if (options.additionalBlockedHostnames) {
      options.additionalBlockedHostnames.forEach(h => this.blockedHostnames.add(h.toLowerCase()));
    }

    // Set up allowed overrides (for internal APIs that should be accessible)
    this.allowedOverrides = new Set(options.allowedInternalRanges || []);
  }

  /**
   * Validate a URL for SSRF vulnerabilities
   */
  validateURL(url: string): SSRFValidationResult {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      // Check protocol - only allow HTTP and HTTPS
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return {
          safe: false,
          error: `Unsupported protocol: ${parsed.protocol}. Only HTTP and HTTPS are allowed.`
        };
      }

      // Check blocked hostnames
      if (this.blockedHostnames.has(hostname)) {
        return {
          safe: false,
          error: `Blocked hostname: ${hostname}`,
          blockedRange: hostname
        };
      }

      // If hostname is an IP address, check against blocked ranges
      if (isIPAddress(hostname)) {
        return this.validateIP(hostname);
      }

      // For hostnames, check for suspicious patterns
      const suspiciousPatterns = [
        /^0x[\da-f]+$/i, // Hexadecimal IP encoding
        /^\d+$/, // Decimal IP encoding
        /^0\d+\./, // Octal IP encoding
        /internal/i, // Internal service patterns
        /local/i,
        /private/i,
        /intranet/i,
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(hostname)) {
          return {
            safe: false,
            error: `Suspicious hostname pattern detected: ${hostname}`
          };
        }
      }

      // Check for DNS rebinding vectors (multiple @ symbols, etc.)
      if (parsed.username || parsed.password) {
        return {
          safe: false,
          error: 'URLs with authentication credentials are not allowed'
        };
      }

      return { safe: true };

    } catch (error) {
      return {
        safe: false,
        error: `Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate an IP address against blocked ranges
   */
  validateIP(ip: string): SSRFValidationResult {
    // Check if IP is in allowed overrides
    if (this.allowedOverrides.has(ip)) {
      return { safe: true, resolvedIP: ip };
    }

    // Check against each blocked range
    for (const range of this.blockedRanges) {
      if (isIPInRange(ip, range.range)) {
        // Check if this range can be overridden
        if (range.overridable && this.allowedOverrides.has(range.range)) {
          continue;
        }

        return {
          safe: false,
          error: `IP address ${ip} is in blocked range: ${range.description}`,
          resolvedIP: ip,
          blockedRange: range.range
        };
      }
    }

    return { safe: true, resolvedIP: ip };
  }

  /**
   * Add a hostname to the block list
   */
  addBlockedHostname(hostname: string): void {
    this.blockedHostnames.add(hostname.toLowerCase());
  }

  /**
   * Add an IP range to the block list
   */
  addBlockedRange(config: IPRangeConfig): void {
    this.blockedRanges.push(config);
  }

  /**
   * Allow an internal range override (use with caution)
   */
  allowInternalRange(range: string): void {
    this.allowedOverrides.add(range);
  }

  /**
   * Get the list of blocked ranges
   */
  getBlockedRanges(): IPRangeConfig[] {
    return [...this.blockedRanges];
  }

  /**
   * Get the list of blocked hostnames
   */
  getBlockedHostnames(): string[] {
    return Array.from(this.blockedHostnames);
  }
}

// Default SSRF protection instance
export const ssrfProtection = new SSRFProtection();

/**
 * Quick validation helper function
 */
export function isURLSafe(url: string): boolean {
  return ssrfProtection.validateURL(url).safe;
}

/**
 * Validate and throw if unsafe
 */
export function assertURLSafe(url: string): void {
  const result = ssrfProtection.validateURL(url);
  if (!result.safe) {
    throw new Error(`SSRF Protection: ${result.error}`);
  }
}
