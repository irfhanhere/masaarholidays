require.cache[require.resolve('server-only')] = {
  id: require.resolve('server-only'),
  filename: require.resolve('server-only'),
  loaded: true,
  exports: {}
};

try {
  const nextHeadersPath = require.resolve('next/headers');
  require.cache[nextHeadersPath] = {
    id: nextHeadersPath,
    filename: nextHeadersPath,
    loaded: true,
    exports: {
      cookies: async () => ({
        getAll: () => [],
        set: () => {},
        get: () => undefined,
      }),
      headers: async () => new Headers(),
    }
  };
} catch {}
