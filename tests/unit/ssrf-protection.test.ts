import { describe, it, expect, beforeEach } from 'bun:test';
import {
  SSRFProtection,
  isURLSafe,
  assertURLSafe,
  type SSRFValidationResult,
  type IPRangeConfig
} from '../../src/core/validators/ssrf-protection';

describe('SSRF Protection', () => {
  let ssrfProtection: SSRFProtection;

  beforeEach(() => {
    ssrfProtection = new SSRFProtection();
  });

  describe('URL Protocol Validation', () => {
    it('should allow HTTP URLs', () => {
      const result = ssrfProtection.validateURL('http://example.com');
      expect(result.safe).toBe(true);
    });

    it('should allow HTTPS URLs', () => {
      const result = ssrfProtection.validateURL('https://example.com');
      expect(result.safe).toBe(true);
    });

    it('should block FTP protocol', () => {
      const result = ssrfProtection.validateURL('ftp://example.com');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Unsupported protocol');
    });

    it('should block file:// protocol', () => {
      const result = ssrfProtection.validateURL('file:///etc/passwd');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Unsupported protocol');
    });

    it('should block gopher protocol', () => {
      const result = ssrfProtection.validateURL('gopher://example.com');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Unsupported protocol');
    });
  });

  describe('Blocked Hostnames', () => {
    it('should block localhost', () => {
      const result = ssrfProtection.validateURL('http://localhost');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Blocked hostname');
      expect(result.blockedRange).toBe('localhost');
    });

    it('should block localhost.localdomain', () => {
      const result = ssrfProtection.validateURL('http://localhost.localdomain');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Blocked hostname');
    });

    it('should block AWS metadata service IP', () => {
      const result = ssrfProtection.validateURL('http://169.254.169.254');
      expect(result.safe).toBe(false);
    });

    it('should block metadata.google.internal', () => {
      const result = ssrfProtection.validateURL('http://metadata.google.internal');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Blocked hostname');
    });

    it('should block metadata.goog', () => {
      const result = ssrfProtection.validateURL('http://metadata.goog');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Blocked hostname');
    });

    it('should be case insensitive for hostnames', () => {
      const result = ssrfProtection.validateURL('http://LOCALHOST');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Blocked hostname');
    });
  });

  describe('Loopback Address Blocking', () => {
    it('should block 127.0.0.1', () => {
      const result = ssrfProtection.validateIP('127.0.0.1');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Loopback addresses');
      expect(result.resolvedIP).toBe('127.0.0.1');
    });

    it('should block any address in 127.0.0.0/8 range', () => {
      const testCases = ['127.0.0.1', '127.1.1.1', '127.255.255.255'];
      testCases.forEach(ip => {
        const result = ssrfProtection.validateIP(ip);
        expect(result.safe).toBe(false);
        expect(result.error).toContain('Loopback addresses');
      });
    });

    it('should block IPv6 loopback ::1', () => {
      const result = ssrfProtection.validateIP('::1');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('IPv6 loopback');
    });
  });

  describe('Private Network Blocking', () => {
    it('should block 10.0.0.0/8 range', () => {
      const testCases = ['10.0.0.1', '10.123.45.67', '10.255.255.255'];
      testCases.forEach(ip => {
        const result = ssrfProtection.validateIP(ip);
        expect(result.safe).toBe(false);
        expect(result.error).toContain('Private Class A network');
      });
    });

    it('should block 172.16.0.0/12 range', () => {
      const testCases = ['172.16.0.1', '172.20.1.1', '172.31.255.255'];
      testCases.forEach(ip => {
        const result = ssrfProtection.validateIP(ip);
        expect(result.safe).toBe(false);
        expect(result.error).toContain('Private Class B network');
      });
    });

    it('should block 192.168.0.0/16 range', () => {
      const testCases = ['192.168.0.1', '192.168.1.1', '192.168.255.255'];
      testCases.forEach(ip => {
        const result = ssrfProtection.validateIP(ip);
        expect(result.safe).toBe(false);
        expect(result.error).toContain('Private Class C network');
      });
    });

    it('should allow public IPs', () => {
      const testCases = ['8.8.8.8', '1.1.1.1', '93.184.216.34'];
      testCases.forEach(ip => {
        const result = ssrfProtection.validateIP(ip);
        expect(result.safe).toBe(true);
        expect(result.resolvedIP).toBe(ip);
      });
    });
  });

  describe('Link-Local and AWS Metadata Blocking', () => {
    it('should block 169.254.0.0/16 range (link-local/AWS metadata)', () => {
      const testCases = ['169.254.0.1', '169.254.169.254', '169.254.255.255'];
      testCases.forEach(ip => {
        const result = ssrfProtection.validateIP(ip);
        expect(result.safe).toBe(false);
        expect(result.error).toContain('Link-local/AWS metadata service');
      });
    });

    it('should block IPv6 link-local addresses', () => {
      const result = ssrfProtection.validateIP('fe80::1');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('IPv6 link-local');
    });
  });

  describe('Special IP Ranges', () => {
    it('should block 0.0.0.0/8 (current network)', () => {
      const result = ssrfProtection.validateIP('0.0.0.1');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Current network');
    });

    it('should block carrier-grade NAT (100.64.0.0/10)', () => {
      const result = ssrfProtection.validateIP('100.64.0.1');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Carrier-grade NAT');
    });

    it('should block multicast addresses (224.0.0.0/4)', () => {
      const result = ssrfProtection.validateIP('224.0.0.1');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Multicast');
    });

    it('should block broadcast address (255.255.255.255)', () => {
      const result = ssrfProtection.validateIP('255.255.255.255');
      expect(result.safe).toBe(false);
      // Note: 255.255.255.255 is in 240.0.0.0/4 range, so it may match that first
      expect(result.error).toMatch(/Broadcast|Reserved for future use/);
    });

    it('should block TEST-NET ranges', () => {
      const testCases = [
        { ip: '192.0.2.1', description: 'TEST-NET-1' },
        { ip: '198.51.100.1', description: 'TEST-NET-2' },
        { ip: '203.0.113.1', description: 'TEST-NET-3' }
      ];
      testCases.forEach(({ ip, description }) => {
        const result = ssrfProtection.validateIP(ip);
        expect(result.safe).toBe(false);
        expect(result.error).toContain(description);
      });
    });
  });

  describe('Suspicious Patterns', () => {
    it('should block URLs with hexadecimal IP encoding', () => {
      const result = ssrfProtection.validateURL('http://0x7f000001');
      expect(result.safe).toBe(false);
      // The hex encoding gets parsed and blocked as loopback, which is the right outcome
      expect(result.error).toMatch(/Suspicious hostname pattern|Loopback addresses/);
    });

    it('should block URLs with decimal IP encoding', () => {
      const result = ssrfProtection.validateURL('http://2130706433');
      expect(result.safe).toBe(false);
      // The decimal encoding gets parsed and blocked as loopback, which is the right outcome
      expect(result.error).toMatch(/Suspicious hostname pattern|Loopback addresses/);
    });

    it('should block URLs with "internal" in hostname', () => {
      const result = ssrfProtection.validateURL('http://internal.example.com');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Suspicious hostname pattern');
    });

    it('should block URLs with "local" in hostname', () => {
      const result = ssrfProtection.validateURL('http://local.example.com');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Suspicious hostname pattern');
    });

    it('should block URLs with "private" in hostname', () => {
      const result = ssrfProtection.validateURL('http://private.example.com');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Suspicious hostname pattern');
    });

    it('should block URLs with "intranet" in hostname', () => {
      const result = ssrfProtection.validateURL('http://intranet.example.com');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Suspicious hostname pattern');
    });
  });

  describe('URL Authentication Credentials', () => {
    it('should block URLs with username', () => {
      const result = ssrfProtection.validateURL('http://user@example.com');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('authentication credentials');
    });

    it('should block URLs with username and password', () => {
      const result = ssrfProtection.validateURL('http://user:pass@example.com');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('authentication credentials');
    });
  });

  describe('Invalid URLs', () => {
    it('should handle malformed URLs', () => {
      const result = ssrfProtection.validateURL('not-a-url');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Invalid URL');
    });

    it('should handle empty URLs', () => {
      const result = ssrfProtection.validateURL('');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Invalid URL');
    });
  });

  describe('Configuration and Extension', () => {
    it('should allow adding custom blocked ranges', () => {
      const customRange: IPRangeConfig = {
        range: '198.18.0.0/15',
        description: 'Network benchmark testing',
        overridable: false
      };
      ssrfProtection.addBlockedRange(customRange);

      const result = ssrfProtection.validateIP('198.18.1.1');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Network benchmark testing');
    });

    it('should allow adding custom blocked hostnames', () => {
      ssrfProtection.addBlockedHostname('evil.example.com');

      const result = ssrfProtection.validateURL('http://evil.example.com');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Blocked hostname');
    });

    it('should allow internal range overrides for trusted ranges', () => {
      ssrfProtection.allowInternalRange('10.0.0.0/8');

      const result = ssrfProtection.validateIP('10.0.0.1');
      // The range 10.0.0.0/8 is overridable, so adding it to allowedOverrides allows it
      expect(result.safe).toBe(true);
    });

    it('should allow specific IP overrides', () => {
      const customProtection = new SSRFProtection({
        allowedInternalRanges: ['10.0.0.5']
      });

      const result = customProtection.validateIP('10.0.0.5');
      expect(result.safe).toBe(true);
    });

    it('should get blocked ranges', () => {
      const ranges = ssrfProtection.getBlockedRanges();
      expect(ranges.length).toBeGreaterThan(0);
      expect(ranges.some(r => r.range === '127.0.0.0/8')).toBe(true);
    });

    it('should get blocked hostnames', () => {
      const hostnames = ssrfProtection.getBlockedHostnames();
      expect(hostnames.length).toBeGreaterThan(0);
      expect(hostnames.includes('localhost')).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    describe('isURLSafe', () => {
      it('should return true for safe URLs', () => {
        expect(isURLSafe('https://example.com')).toBe(true);
      });

      it('should return false for unsafe URLs', () => {
        expect(isURLSafe('http://localhost')).toBe(false);
        expect(isURLSafe('http://127.0.0.1')).toBe(false);
      });
    });

    describe('assertURLSafe', () => {
      it('should not throw for safe URLs', () => {
        expect(() => assertURLSafe('https://example.com')).not.toThrow();
      });

      it('should throw for unsafe URLs', () => {
        expect(() => assertURLSafe('http://localhost')).toThrow('SSRF Protection');
        expect(() => assertURLSafe('http://127.0.0.1')).toThrow('SSRF Protection');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle URLs with ports', () => {
      const result = ssrfProtection.validateURL('https://example.com:8080');
      expect(result.safe).toBe(true);
    });

    it('should block localhost with port', () => {
      const result = ssrfProtection.validateURL('http://localhost:8080');
      expect(result.safe).toBe(false);
    });

    it('should handle URLs with paths', () => {
      const result = ssrfProtection.validateURL('https://example.com/path/to/resource');
      expect(result.safe).toBe(true);
    });

    it('should handle URLs with query parameters', () => {
      const result = ssrfProtection.validateURL('https://example.com/path?param=value&foo=bar');
      expect(result.safe).toBe(true);
    });

    it('should handle URLs with fragments', () => {
      const result = ssrfProtection.validateURL('https://example.com/path#section');
      expect(result.safe).toBe(true);
    });

    it('should handle URLs with octal-like patterns in hostname', () => {
      // This tests the octal pattern detection (starts with 0 followed by digits)
      const result = ssrfProtection.validateURL('http://0127.example.com');
      expect(result.safe).toBe(false);
      expect(result.error).toContain('Suspicious hostname pattern');
    });
  });

  describe('Constructor Options', () => {
    it('should initialize with additional blocked ranges', () => {
      const customProtection = new SSRFProtection({
        additionalBlockedRanges: [{
          range: '203.0.113.0/24',
          description: 'Custom blocked range',
          overridable: false
        }]
      });

      const ranges = customProtection.getBlockedRanges();
      expect(ranges.some(r => r.description === 'Custom blocked range')).toBe(true);
    });

    it('should initialize with additional blocked hostnames', () => {
      const customProtection = new SSRFProtection({
        additionalBlockedHostnames: ['badhost.com', 'malicious.org']
      });

      const hostnames = customProtection.getBlockedHostnames();
      expect(hostnames.includes('badhost.com')).toBe(true);
      expect(hostnames.includes('malicious.org')).toBe(true);
    });

    it('should initialize with allowed internal ranges', () => {
      const customProtection = new SSRFProtection({
        allowedInternalRanges: ['192.168.1.100', '10.0.0.50']
      });

      const result1 = customProtection.validateIP('192.168.1.100');
      expect(result1.safe).toBe(true);

      const result2 = customProtection.validateIP('10.0.0.50');
      expect(result2.safe).toBe(true);
    });
  });

  describe('CIDR Range Validation', () => {
    it('should correctly validate IPs at the edge of ranges', () => {
      // Test 192.168.0.0/16 boundary
      const result1 = ssrfProtection.validateIP('192.168.0.0');
      expect(result1.safe).toBe(false);

      const result2 = ssrfProtection.validateIP('192.168.255.255');
      expect(result2.safe).toBe(false);

      // Just outside the range
      const result3 = ssrfProtection.validateIP('192.167.255.255');
      expect(result3.safe).toBe(true);

      const result4 = ssrfProtection.validateIP('192.169.0.0');
      expect(result4.safe).toBe(true);
    });

    it('should correctly validate IPs in 172.16.0.0/12 range boundaries', () => {
      // Inside the range
      const result1 = ssrfProtection.validateIP('172.16.0.0');
      expect(result1.safe).toBe(false);

      const result2 = ssrfProtection.validateIP('172.31.255.255');
      expect(result2.safe).toBe(false);

      // Just outside the range
      const result3 = ssrfProtection.validateIP('172.15.255.255');
      expect(result3.safe).toBe(true);

      const result4 = ssrfProtection.validateIP('172.32.0.0');
      expect(result4.safe).toBe(true);
    });
  });
});
