/** Retry only a PKCE transport failure, before Supabase discards its verifier. */
export function createPkceFetch(
  transport: typeof fetch,
  ready: () => Promise<void>,
  pause: () => Promise<void> = () => new Promise(resolve => setTimeout(resolve, 500)),
): typeof fetch {
  return async (input, init) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw);
    const pkce = init?.method?.toUpperCase() === 'POST'
      && url.pathname.endsWith('/auth/v1/token')
      && url.searchParams.get('grant_type') === 'pkce';
    if (!pkce) return transport(input, init);
    for (let attempt = 0; ; attempt++) {
      await ready();
      try { return await transport(input, init); }
      catch (error) {
        const failure = error as { name?: string; message?: string };
        const transient = failure?.name === 'TypeError'
          || /network request failed|fetch failed|cancelled/i.test(failure?.message ?? '');
        if (!transient || init?.signal?.aborted || attempt >= 2) throw error;
        await pause();
      }
    }
  };
}
