import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Elellaan Beauty Salon",
    short_name: "Elellaan",
    description: "Book your beauty services at Elellaan",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF7FB",
    theme_color: "#9B7BA0",
    icons: [
      { src: "/elellaan.jpg", sizes: "512x512", type: "image/jpeg", purpose: "any" },
      { src: "/elellaan.jpg", sizes: "192x192", type: "image/jpeg", purpose: "any" },
    ],
  };
}
