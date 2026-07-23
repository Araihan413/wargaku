import { NextResponse } from 'next/server';
import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wargaku API Documentation',
      version: '1.0.0',
      description: 'REST API Documentation for Wargaku (RT/RW Management System) kependudukan modules.',
    },
    servers: [
      {
        url: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
        description: 'Server Development Lokal',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'better-auth.session_token',
          description: 'Token Sesi Better Auth yang disimpan dalam Cookie',
        },
      },
    },
  },
  // Scan berkas TS di dalam app/api secara rekursif
  apis: ['./app/api/**/*.ts'],
};

const spec = swaggerJSDoc(options);

export async function GET() {
  try {
    return NextResponse.json(spec);
  } catch (error: any) {
    console.error('Error generating OpenAPI spec:', error);
    return NextResponse.json({ error: 'Gagal menghasilkan spesifikasi OpenAPI' }, { status: 500 });
  }
}
