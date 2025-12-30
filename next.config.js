/** @type {import('next').NextConfig} */

const nextConfig = {
  /**
   * 🔒 TypeScript
   * Backend (branao-backend) ko tsconfig.json me exclude kiya gaya hai,
   * isliye yahan errors ignore karne ki zarurat nahi
   */
  typescript: {
    ignoreBuildErrors: false,
  },

  /**
   * 🧩 SVG handling
   * - *.svg?url  → normal file
   * - *.svg      → React component
   */
  webpack(config) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find(
      (rule) => rule.test?.test?.(".svg")
    );

    config.module.rules.push(
      // *.svg?url → file
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      // *.svg → React component
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: {
          not: [...fileLoaderRule.resourceQuery.not, /url/],
        },
        use: ["@svgr/webpack"],
      }
    );

    // Prevent default loader from processing SVGs
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },

  /**
   * 🖼️ External image domains
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.lorem.space",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "a0.muscache.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

module.exports = nextConfig;
