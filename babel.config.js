module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@components': './components',
            '@constants': './constants',
            '@screens': './screens',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
