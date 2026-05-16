export default function manifest() {
  return {
    name: "Keep Your Word",
    short_name: "Keep Word",
    description: "Daily practice. Keep your word to yourself.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#241712",
    theme_color: "#241712",
    icons: [
      {
        src: "/icon.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/apple-touch-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
