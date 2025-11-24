import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    uni(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src")
    }
  },
   server: {
      proxy: {
        '/api': {
          target: 'http://geologygis.com:8864',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
});
