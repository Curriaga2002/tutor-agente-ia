import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

  if (supabaseUrl === "https://placeholder.supabase.co" || supabaseAnonKey === "placeholder-key") {
    console.warn("[v0] Supabase environment variables not found, using fallback mode")

    const createMockQueryBuilder = () => ({
      select: (columns?: string) =>
        Promise.resolve({
          data: [],
          error: null,
        }),
      insert: (values: any) => ({
        select: (columns?: string) =>
          Promise.resolve({
            data: Array.isArray(values) ? values : [values],
            error: null,
          }),
        then: (resolve: any) =>
          resolve({
            data: Array.isArray(values) ? values : [values],
            error: null,
          }),
      }),
      update: (values: any) => ({
        eq: (column: string, value: any) => ({
          select: (columns?: string) =>
            Promise.resolve({
              data: [{ ...values, id: value }],
              error: null,
            }),
          then: (resolve: any) =>
            resolve({
              data: [{ ...values, id: value }],
              error: null,
            }),
        }),
      }),
      delete: () => ({
        eq: (column: string, value: any) =>
          Promise.resolve({
            data: null,
            error: null,
          }),
      }),
      eq: (column: string, value: any) =>
        Promise.resolve({
          data: [],
          error: null,
        }),
      order: (column: string, options?: any) =>
        Promise.resolve({
          data: [],
          error: null,
        }),
    })

    return {
      from: (table: string) => createMockQueryBuilder(),
    } as any
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
