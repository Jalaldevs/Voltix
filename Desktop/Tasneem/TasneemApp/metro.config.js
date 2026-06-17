const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'db' to the list of asset extensions so SQLite files are bundled
config.resolver.assetExts.push('db', 'tafseer');

module.exports = config;
