import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("chat-theme") || "coffee",
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },
}));

// Available themes for the settings page
export const availableThemes = [
  { name: "Light", value: "light" },
  { name: "Dark", value: "dark" },
  { name: "Cupcake", value: "cupcake" },
  { name: "Bumblebee", value: "bumblebee" },
  { name: "Emerald", value: "emerald" },
  { name: "Corporate", value: "corporate" },
  { name: "Synthwave", value: "synthwave" },
  { name: "Retro", value: "retro" },
  { name: "Cyberpunk", value: "cyberpunk" },
  { name: "Valentine", value: "valentine" },
  { name: "Halloween", value: "halloween" },
  { name: "Garden", value: "garden" },
  { name: "Forest", value: "forest" },
  { name: "Aqua", value: "aqua" },
  { name: "Lofi", value: "lofi" },
  { name: "Pastel", value: "pastel" },
  { name: "Fantasy", value: "fantasy" },
  { name: "Wireframe", value: "wireframe" },
  { name: "Black", value: "black" },
  { name: "Luxury", value: "luxury" },
  { name: "Dracula", value: "dracula" },
  { name: "Cmyk", value: "cmyk" },
  { name: "Autumn", value: "autumn" },
  { name: "Business", value: "business" },
  { name: "Acid", value: "acid" },
  { name: "Lemonade", value: "lemonade" },
  { name: "Night", value: "night" },
  { name: "Coffee", value: "coffee" },
  { name: "Winter", value: "winter" },
  { name: "Dim", value: "dim" },
  { name: "Nord", value: "nord" },
  { name: "Sunset", value: "sunset" },
];