/**
 * Security Headers Middleware
 * 
 * Provides comprehensive security headers for the application
 */

// Express types for middleware
interface Request {
  secure: boolean;
  headers: Record<string, string | string[] | undefined>;
}

interface Response {
  setHeader: (name: string, value: string) => void;
}

type NextFunction = () => void;

export interface SecurityHeadersConfig {
  csp?: {
    directives: {
      'default-src'?: string[];
      'script-src'?: string[];
      'style-src'?: string[];
      'img-src'?: string[];
      'connect-src'?: string[];
      'font-src'?: string[];
      'object-src'?: string[];
      'media-src'?: string[];
      'frame-src'?: string[];
      'worker-src'?: string[];
      'manifest-src'?: string[];
      'form-action'?: string[];
      'frame-ancestors'?: string[];
      'base-uri'?: string[];
      'upgrade-insecure-requests'?: boolean;
    };
    reportUri?: string;
  };
  hsts?: {
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  cors?: {
    origin: string | string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
  };
}

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  csp: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://www.googleapis.com"],
      'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      'img-src': ["'self'", "data:", "https:", "blob:"],
      'connect-src': ["'self'", "https://*.firebaseio.com", "https://*.googleapis.com", "wss://*.firebaseio.com"],
      'font-src': ["'self'", "https://fonts.gstatic.com"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'frame-src': ["'none'"],
      'worker-src': ["'self'", "blob:"],
      'manifest-src': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'upgrade-insecure-requests': true,
    },
  },
  hsts: {
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
  },
};

/**
 * Generate Content Security Policy header
 */
export function generateCSP(config: SecurityHeadersConfig['csp'] = DEFAULT_CONFIG.csp!): string {
  const directives = config.directives;
  const cspParts: string[] = [];

  for (const [directive, values] of Object.entries(directives)) {
    if (values === true) {
      cspParts.push(directive);
    } else if (Array.isArray(values) && values.length > 0) {
      cspParts.push(`${directive} ${values.join(' ')}`);
    }
  }

  if (config.reportUri) {
    cspParts.push(`report-uri ${config.reportUri}`);
  }

  return cspParts.join('; ');
}

/**
 * Generate HSTS header
 */
export function generateHSTS(config: SecurityHeadersConfig['hsts'] = DEFAULT_CONFIG.hsts!): string {
  const parts = [`max-age=${config.maxAge}`];
  
  if (config.includeSubDomains) {
    parts.push('includeSubDomains');
  }
  
  if (config.preload) {
    parts.push('preload');
  }
  
  return parts.join('; ');
}

/**
 * Express middleware for security headers
 */
export function securityHeadersMiddleware(config: SecurityHeadersConfig = DEFAULT_CONFIG) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy
    const csp = generateCSP(config.csp);
    res.setHeader('Content-Security-Policy', csp);
    
    // HTTP Strict Transport Security
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      const hsts = generateHSTS(config.hsts);
      res.setHeader('Strict-Transport-Security', hsts);
    }
    
    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');
    
    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy
    res.setHeader('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    );
    
    // CORS headers
    if (config.cors) {
      const origin = req.headers.origin;
      const allowedOrigins = Array.isArray(config.cors.origin) 
        ? config.cors.origin 
        : [config.cors.origin];
      
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', config.cors.credentials.toString());
        res.setHeader('Access-Control-Allow-Methods', config.cors.methods.join(', '));
        res.setHeader('Access-Control-Allow-Headers', config.cors.allowedHeaders.join(', '));
      }
    }
    
    next();
  };
}

/**
 * Helmet.js configuration for additional security
 */
export const helmetConfig = {
  contentSecurityPolicy: {
    directives: DEFAULT_CONFIG.csp!.directives,
  },
  hsts: DEFAULT_CONFIG.hsts,
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
};
