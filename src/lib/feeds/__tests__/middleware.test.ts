import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

function makeRequest(hostname: string, pathname: string = '/') {
  const url = `http://${hostname}${pathname}`
  const req = new NextRequest(url, {
    headers: { host: hostname },
  })
  return req
}

describe('middleware', () => {
  it('rewrites situation subdomain to /situation', () => {
    const req = makeRequest('situation.icarustechnologies.co.uk')
    const res = middleware(req)
    // Rewrite response has x-middleware-rewrite header
    expect(res.headers.get('x-middleware-rewrite')).toContain('/situation')
  })

  it('passes through www hostname without rewrite', () => {
    const req = makeRequest('www.icarustechnologies.co.uk')
    const res = middleware(req)
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('passes through API routes without rewrite', () => {
    const req = makeRequest('situation.icarustechnologies.co.uk', '/api/events')
    const res = middleware(req)
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
  })
})
