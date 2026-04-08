# Frontend Calendar

An advanced, highly interactive 3D wall calendar built with React, GSAP, Three.js, and Zustand. The project features hyper-realistic page turning mechanics, interactive note-taking, dynamic monthly themes, and gesture-based interactions.

## 🌟 Key Functionality

- **Immersive 3D Peeling Effect**: Calendar pages can be fully interacted with. Dragging the corner produces a mathematically continuous, hyper-realistic peel effect, utilizing complex CSS `clip-path` calculations synchronized with GSAP.
- **Ambient 3D Scene**: Powered by `@react-three/fiber` and Three.js, delivering ambient visual elements like floating dust particles and dynamic lighting orbs running behind the calendar.
- **Gesture Control**: Fully supports pointer touch/drag to playfully peel the corners of the calendar and flip pages using `@use-gesture/react`.
- **Date Range Selection**: Click and drag to select single dates or wider date ranges intuitively. Built-in "Undo" and "Clear" selection hooks.
- **Persistent Notes**: Save personal notes on specific dates or date ranges. Integrated seamlessly with `localStorage` for persistent states across sessions.
- **Dynamic Theming**: Each month transitions automatically into a beautifully curated color gradient and thematic aesthetic.
- **Holiday Indicators**: Built-in support to render local weekends and holidays differently on the grid dynamically.
- **Lenis Smooth Scrolling**: Incorporates `@studio-freight/lenis` for smooth page dynamics across the viewport.

## 🚀 Setup and Run Instructions

This project is built using [Vite](https://vitejs.dev/) for extremely fast development and optimized builds. 

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone this repository or download the source code wrapper.
2. Navigate to the project directory:
   ```bash
   cd Frontend_Calender
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```

Your app will be available at `http://localhost:5173` (or the port Vite provides in your terminal).

### Building for Production

To create an optimized production build:
```bash
npm run build
```
This command outputs the production-ready application to the `dist` folder. You can preview it locally using:
```bash
npm run preview
```

## 🏗️ Architecture & Technical Scope

This application balances complex animation states across a 3D Canvas context and conventional DOM elements.

### Core Stack
- **React 19**: Component architecture.
- **Vite**: Build tooling.
- **Tailwind CSS v4 & Vanilla CSS**: Core layout styling alongside programmatic CSS variables injected dynamically by JavaScript.
- **Zustand**: Fast and scalable global state management overriding typical React re-rendering caveats.
- **GSAP**: Timeline orchestration and complex mathematical tween handling for paper-folding animations.
- **Three.js & React Three Fiber**: Ambient generative canvas scenes.
- **date-fns**: Robust utility-based date logic modeling.

### Component Structure

- `App.jsx`: The root component mounting the `WallCalendar`.
- `src/components/WallCalendar.jsx`: The primary container logic. It drives the "page flipping" algorithms, listening to touch gestures, animating front/back layers natively and injecting the 3D canvas backdrop.
- `src/components/CalendarPage.jsx`: Represents a single 2D page (month view). Contains the grid of `DateCell` calculations, layout rendering (days of week, numbers), and houses the dynamic local notes viewer via `textarea` nodes and saved modally viewed dictionaries.
- `src/components/ThreeScene.jsx`: Isolates the Three.js logical loop (particle systems, light orbs, `Canvas` context setup) keeping heavy GPU processing cleanly isolated away from standard DOM updates.

### State Management (`src/store/useCalendarStore.js`)

Centralized application registry using **Zustand**. Responsible for:
- Tracking global `currentDate` and `navigateMonth` functionality.
- Managing localized touch drag ranges (`startDragSelection`, `updateDragSelection`, `getSelectionState`).
- Serializing and de-serializing the `notes` cache out to `localStorage`.
- Maintaining an undo history for active drag interactions over calendar grids.

### Utilities (`src/utils`)

- `monthThemes.js`: Provides highly curated hex-color palettes and gradient metadata for dynamically modifying styling variables on a per-month basis.
- `holidays.js`: A helper schema filtering for public weekends and special dates matching predefined definitions.
