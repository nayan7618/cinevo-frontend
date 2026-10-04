import { useEffect } from "react";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const SiteBranding = () => {
  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/settings/public`
        );

        const settings = response.data?.settings || {};

        // ✅ Browser tab title
        document.title = settings.siteName || "CINEVO";

        // ✅ Favicon
        if (settings.faviconUrl) {
          let favicon = document.querySelector(
            "link[rel='icon']"
          );

          if (!favicon) {
            favicon = document.createElement("link");
            favicon.rel = "icon";
            document.head.appendChild(favicon);
          }

          favicon.href = settings.faviconUrl;
        }

        // ✅ Meta description / tagline
        let description = document.querySelector(
          "meta[name='description']"
        );

        if (!description) {
          description = document.createElement("meta");
          description.name = "description";
          document.head.appendChild(description);
        }

        description.content =
          settings.tagline ||
          "Your World of Entertainment";
      } catch (error) {
        console.error(
          "Site settings load error:",
          error
        );
      }
    };

    loadSiteSettings();
  }, []);

  return null;
};

export default SiteBranding;