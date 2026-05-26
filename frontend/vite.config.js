import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Docker en Windows: el volumen no dispara inotify; sin polling no hay HMR ni recarga al guardar
    watch: {
      usePolling: true,
      interval: 1000,
    },
    hmr: {
      host: "localhost",
      port: 5173,
      clientPort: 5173,
    },
  },
});
