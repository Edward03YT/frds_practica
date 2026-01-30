import type { NextConfig } from "next";
import type { Configuration } from "webpack";

const isAnalyze = process.env.ANALYZE === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [320, 420, 768, 1024, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 60,
    // Adaugă explicit domeniile de la care iei imagini
    domains: ["images.unsplash.com", "cdn.yoursite.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // sau specifică domenii pentru securitate
      },
    ],
    unoptimized: false,
  },


  experimental: {
    scrollRestoration: true,
    optimizeCss: true,

  },

  modularizeImports: {
    // Exemplu: importă doar funcțiile folosite din lodash
    lodash: {
      transform: "lodash/{{member}}",
    },
    "date-fns": {
      transform: "date-fns/{{member}}",
    },
  },

  ...(isAnalyze && {
    webpack(config: Configuration, { isServer }: { isServer: boolean }) {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins = config.plugins || [];
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          reportFilename: isServer
            ? "../analyze/server.html"
            : "./analyze/client.html",
        })
      );
      return config;
    },
  }),
};

export default nextConfig;