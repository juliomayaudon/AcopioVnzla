import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que el navegador muestre versiones viejas tras un despliegue:
  // el HTML y los archivos públicos se revalidan siempre (304 si no cambió,
  // versión nueva al instante tras un deploy), mientras que los recursos con
  // hash en el nombre (JS/CSS) sí se cachean a largo plazo.
  async headers() {
    // Solo en producción: en desarrollo interfiere con el hot-reload (HMR).
    if (process.env.NODE_ENV !== "production") return [];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        // Estos llevan hash en la URL y cambian en cada build → caché inmutable
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
