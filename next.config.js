/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add other Next.js configurations here if needed
  experimental: {
    // Suppress the warning about cross-origin requests in development
    // Replace with your actual development origin(s) if different
    allowedDevOrigins: [
        "*.cloudworkstations.dev",
        // Add other allowed origins if necessary, e.g., "http://localhost:3000"
    ],
  },
};

module.exports = nextConfig;
