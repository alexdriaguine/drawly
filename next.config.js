const path = require('path/posix')
const webpack = require('webpack')

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  webpack: (config, options) => {
    config.plugins.push(
      new webpack.BannerPlugin({
        banner: '/** @jsxImportSource @emotion/react */',
      })
    )
    config.resolve.alias = {
      ...config.resolve.alias,
      '@components': path.resolve(__dirname, 'client/components'),
      '@socket': path.resolve(__dirname, 'client/socket'),
      '@shared': path.resolve(__dirname, 'shared'),
    }

    return config
  },
}
