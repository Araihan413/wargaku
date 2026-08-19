import fs from 'fs';
import path from 'path';

interface EndpointReport {
  routePath: string;
  methods: string[];
  hasAuthGuard: boolean;
  hasZodValidation: boolean;
  isPublicRoute: boolean;
  warnings: string[];
  status: 'SECURE' | 'PUBLIC_OK' | 'WARNING';
}

const API_DIR = path.resolve(process.cwd(), 'app/api');

// Endpoint yang diizinkan untuk diakses publik tanpa login
const KNOWN_PUBLIC_ROUTES = [
  '/api/auth',
  '/api/openapi',
  '/api/public',
  '/api/qr-codes',
  '/api/complaints', // Publik form aduan (dilindungi Turnstile)
];

function getAllRouteFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllRouteFiles(filePath));
    } else if (file === 'route.ts' || file === 'route.js') {
      results.push(filePath);
    }
  }
  return results;
}

function analyzeRouteFile(filePath: string): EndpointReport {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);
  const routePath = '/' + relativePath
    .replace(/^app[\\/]/, '')
    .replace(/[\\/]route\.(ts|js)$/, '')
    .replace(/\\/g, '/');

  const methods: string[] = [];
  const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\b/g;
  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    methods.push(match[1]);
  }

  const isPublicRoute = KNOWN_PUBLIC_ROUTES.some((pub) => routePath.startsWith(pub));

  // Pengecekan auth guard
  const hasAuthGuard =
    content.includes('getSession') ||
    content.includes('requirePermission') ||
    content.includes('hasPermission') ||
    content.includes('auth.api') ||
    content.includes('headers()');

  // Pengecekan Zod schema parsing
  const hasZodValidation =
    content.includes('.safeParse(') ||
    content.includes('.parse(') ||
    content.includes('z.object');

  const warnings: string[] = [];
  const hasMutatingMethod = methods.some((m) => ['POST', 'PUT', 'DELETE', 'PATCH'].includes(m));

  if (!isPublicRoute && !hasAuthGuard) {
    warnings.push('Tidak ditemukan pengecekan session/auth guard');
  }

  if (hasMutatingMethod && !hasZodValidation && !routePath.startsWith('/api/auth')) {
    warnings.push('Memiliki method mutasi (POST/PUT/DELETE) tanpa validasi skema Zod eksplisit');
  }

  let status: 'SECURE' | 'PUBLIC_OK' | 'WARNING' = 'SECURE';
  if (warnings.length > 0) {
    status = 'WARNING';
  } else if (isPublicRoute) {
    status = 'PUBLIC_OK';
  }

  return {
    routePath,
    methods,
    hasAuthGuard,
    hasZodValidation,
    isPublicRoute,
    warnings,
    status,
  };
}

export function runApiSecurityScan(): { total: number; secure: number; warnings: number } {
  console.log('\n======================================================');
  console.log('🛡️  WARGAKU API ENDPOINT SECURITY SCANNER');
  console.log('======================================================');

  const routeFiles = getAllRouteFiles(API_DIR);
  console.log(`📁 Menemukan ${routeFiles.length} file API route di app/api/\n`);

  const reports: EndpointReport[] = routeFiles.map(analyzeRouteFile);

  let secureCount = 0;
  let warningCount = 0;

  for (const rep of reports) {
    const methodsStr = `[${rep.methods.join(', ')}]`;
    if (rep.status === 'SECURE') {
      secureCount++;
      console.log(` \x1b[32m✔ [SECURE]\x1b[0m ${rep.routePath.padEnd(35)} ${methodsStr}`);
    } else if (rep.status === 'PUBLIC_OK') {
      secureCount++;
      console.log(` \x1b[36mℹ [PUBLIC]\x1b[0m ${rep.routePath.padEnd(35)} ${methodsStr} (Public Endpoint)`);
    } else {
      warningCount++;
      console.log(` \x1b[33m⚠ [WARN]  \x1b[0m ${rep.routePath.padEnd(35)} ${methodsStr}`);
      for (const w of rep.warnings) {
        console.log(`           \x1b[33m↳ ${w}\x1b[0m`);
      }
    }
  }

  console.log('\n======================================================');
  console.log(`📊 HASIL SCAN: ${reports.length} Total Endpoints | \x1b[32m${secureCount} Aman\x1b[0m | \x1b[33m${warningCount} Perlu Ditinjau\x1b[0m`);
  console.log('======================================================\n');

  return {
    total: reports.length,
    secure: secureCount,
    warnings: warningCount,
  };
}

// Jalankan jika dieksekusi langsung
if (require.main === module || process.argv[1]?.includes('scan-api-security')) {
  const result = runApiSecurityScan();
  if (result.warnings > 0) {
    process.exitCode = 0; // Info / Warning non-blocking, exit 0
  }
}
