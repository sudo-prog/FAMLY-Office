// vite.config.ts
import { defineConfig } from "file:///home/thinkpad/Data/20_Projects/20.08_FAMLY_OFFICE/06_FAMLY-Office/node_modules/.pnpm/vite@5.4.11_@types+node@25.9.4_lightningcss@1.32.0_terser@5.48.0/node_modules/vite/dist/node/index.js";
import react from "file:///home/thinkpad/Data/20_Projects/20.08_FAMLY_OFFICE/06_FAMLY-Office/node_modules/.pnpm/@vitejs+plugin-react@4.3.4_vite@5.4.11_@types+node@25.9.4_lightningcss@1.32.0_terser@5.48.0_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import tailwindcss from "file:///home/thinkpad/Data/20_Projects/20.08_FAMLY_OFFICE/06_FAMLY-Office/node_modules/.pnpm/@tailwindcss+vite@4.3.1_vite@5.4.11_@types+node@25.9.4_lightningcss@1.32.0_terser@5.48.0_/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/home/thinkpad/Data/20_Projects/20.08_FAMLY_OFFICE/06_FAMLY-Office/artifacts/family-office";
var port = Number(process.env.PORT) || 5173;
var basePath = process.env.BASE_PATH || "/";
var vite_config_default = defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src")
    },
    dedupe: ["react", "react-dom"]
  },
  root: path.resolve(__vite_injected_original_dirname),
  build: {
    outDir: path.resolve(__vite_injected_original_dirname, "dist"),
    emptyOutDir: true
  },
  server: {
    port,
    host: "0.0.0.0",
    fs: {
      strict: true
    }
  },
  preview: {
    port,
    host: "0.0.0.0"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS90aGlua3BhZC9EYXRhLzIwX1Byb2plY3RzLzIwLjA4X0ZBTUxZX09GRklDRS8wNl9GQU1MWS1PZmZpY2UvYXJ0aWZhY3RzL2ZhbWlseS1vZmZpY2VcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3RoaW5rcGFkL0RhdGEvMjBfUHJvamVjdHMvMjAuMDhfRkFNTFlfT0ZGSUNFLzA2X0ZBTUxZLU9mZmljZS9hcnRpZmFjdHMvZmFtaWx5LW9mZmljZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS90aGlua3BhZC9EYXRhLzIwX1Byb2plY3RzLzIwLjA4X0ZBTUxZX09GRklDRS8wNl9GQU1MWS1PZmZpY2UvYXJ0aWZhY3RzL2ZhbWlseS1vZmZpY2Uvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJAdGFpbHdpbmRjc3Mvdml0ZVwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcblxuY29uc3QgcG9ydCA9IE51bWJlcihwcm9jZXNzLmVudi5QT1JUKSB8fCA1MTczO1xuY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmVudi5CQVNFX1BBVEggfHwgXCIvXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJhc2U6IGJhc2VQYXRoLFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICB0YWlsd2luZGNzcygpLFxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCJzcmNcIiksXG4gICAgfSxcbiAgICBkZWR1cGU6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCJdLFxuICB9LFxuICByb290OiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSksXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCJkaXN0XCIpLFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0LFxuICAgIGhvc3Q6IFwiMC4wLjAuMFwiLFxuICAgIGZzOiB7XG4gICAgICBzdHJpY3Q6IHRydWUsXG4gICAgfSxcbiAgfSxcbiAgcHJldmlldzoge1xuICAgIHBvcnQsXG4gICAgaG9zdDogXCIwLjAuMC4wXCIsXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ2MsU0FBUyxvQkFBb0I7QUFDN2QsT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sVUFBVTtBQUhqQixJQUFNLG1DQUFtQztBQUt6QyxJQUFNLE9BQU8sT0FBTyxRQUFRLElBQUksSUFBSSxLQUFLO0FBQ3pDLElBQU0sV0FBVyxRQUFRLElBQUksYUFBYTtBQUUxQyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsRUFDZDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQXFCLEtBQUs7QUFBQSxJQUM5QztBQUFBLElBQ0EsUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLEVBQy9CO0FBQUEsRUFDQSxNQUFNLEtBQUssUUFBUSxnQ0FBbUI7QUFBQSxFQUN0QyxPQUFPO0FBQUEsSUFDTCxRQUFRLEtBQUssUUFBUSxrQ0FBcUIsTUFBTTtBQUFBLElBQ2hELGFBQWE7QUFBQSxFQUNmO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTjtBQUFBLElBQ0EsTUFBTTtBQUFBLElBQ04sSUFBSTtBQUFBLE1BQ0YsUUFBUTtBQUFBLElBQ1Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUDtBQUFBLElBQ0EsTUFBTTtBQUFBLEVBQ1I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
