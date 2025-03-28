import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- ADD THIS SERVER CONFIGURATION ---
  server: {
    proxy: {
      // Requests starting with /api will be forwarded to your backend
      "/api": {
        target: "http://localhost:5001", // Your backend server URL
        changeOrigin: true, // Recommended, helps with certain backend setups/CORS
        // secure: false, // Keep uncommented if backend is HTTP (usually is for localhost)
        // No 'rewrite' needed because your backend routes already include '/api/v1/...'
      },
    },
  },
  // --- END OF ADDED SECTION ---
});
