// Metro config. Only addition to Expo's defaults: expo-sqlite on web (the `npm run web`
// preview), per the SDK 57 docs: serve .wasm files, and send the COEP / COOP headers that
// SharedArrayBuffer needs. iOS bundles are unaffected.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    }
    return middleware(req, res, next);
  };
};

module.exports = config;
