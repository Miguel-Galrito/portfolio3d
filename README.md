# Orbital Command Portfolio 🚀

![Build Status](https://img.shields.io/github/actions/workflow/status/Miguel-Galrito/portfolio3d/deploy.yml?branch=master)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-black?style=flat&logo=three.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

**Live Demo:** [https://miguel-galrito.github.io/portfolio3d/](https://miguel-galrito.github.io/portfolio3d/)

An interactive, high-performance 3D portfolio application visualizing GitHub repositories as an orbital telemetry system. Built specifically for showcasing engineering projects in Aerospace, Systems, and Artificial Intelligence.

## 🪐 Visual Architecture

The 3D environment procedurally generates celestial bodies based on repository metadata:
- **Central Core (Sun):** Represents the portfolio itself, acting as a glowing volumetric telemetry hub.
- **Aerospace & Systems (C++, Rust, MATLAB):** Metallic precision geometries with orbital rings (Cyan/Blue).
- **AI & Performance (Python, CUDA):** Data-pulse nodes with internal glowing cores (Amber/Orange).
- **Web & Automation (TypeScript, JS):** Crystalline, transmissive monoliths (Emerald/Green).

Powered by **Three.js** with advanced post-processing (`EffectComposer`, `UnrealBloomPass`, `FXAA`, and `MSAA`) ensuring a flawless visual experience.

## 🛠️ Technical Stack

- **Frontend:** Vite, Vanilla TypeScript, Three.js, Tailwind CSS.
- **Post-Processing:** Bloom Shaders, Fast Approximate Anti-Aliasing (FXAA), ACESFilmic Tone Mapping.
- **Data Pipeline:** Node.js GraphQL script pulling live pinned repositories.
- **CI/CD:** GitHub Actions for automated deployment to GitHub Pages (triggers on push and weekly cron).

## 🎮 Navigation & Controls

Navigate the telemetry space using your mouse or keyboard:

| Action | Shortcut / Input |
| :--- | :--- |
| **Rotate Camera** | `Mouse Drag` / `Touch Drag` |
| **Zoom** | `Scroll Wheel` / `Pinch` |
| **Inspect Node** | `Click` on any planet/satellite |
| **Cycle Repositories** | `Arrow Left` / `Arrow Right` (or `A` / `D`) |
| **Open Repository** | `Enter` (when a node is focused) |
| **Close HUD** | `Click X` on HUD |

## 🚀 Running Locally

Ensure you have Node.js 20+ installed.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Miguel-Galrito/portfolio3d.git
   cd portfolio3d
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

*(Optional)* To test the data extraction script, export a `GITHUB_TOKEN` and run `npm run fetch-repos`. If no token is provided, the script gracefully falls back to mock engineering data for immediate UI testing.

---
*Developed by Miguel-Galrito*
