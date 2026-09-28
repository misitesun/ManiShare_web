import type { NextConfig } from 'next'
const config: NextConfig = {
    agentRules: false,
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true },
    poweredByHeader: false,
    ...(process.env.NODE_ENV === 'development' && process.env.API_PROXY_TARGET
        ? {
              async rewrites(): Promise<{ source: string; destination: string }[]> {
                  return [
                      {
                          source: '/api/:path*',
                          destination:
                              process.env.API_PROXY_TARGET?.replace(/\/$/, '') + '/api/:path*',
                      },
                  ]
              },
          }
        : {}),
}
export default config
