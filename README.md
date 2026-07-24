# Tafelplan 2026

Interactive seating plan application for managing table reservations. Built with vanilla JavaScript, HTML5, and CSS3, with optional Firebase Realtime Database integration for real-time synchronization.

## Features

- **Interactive Seating Map**: Click chairs to cycle through statuses (Free → Reserved → Occupied → Cover → Free)
- **Real-time Synchronization**: Optional Firebase integration for live updates across devices
- **Admin Mode**: Protected admin panel with PIN authentication to:
  - Add/remove chairs
  - Manually position chairs on the floor plan
  - Reset all seating statuses
  - Save layout changes
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Offline Support**: Local storage fallback when Firebase is unavailable
- **Accessibility**: Proper ARIA labels and keyboard navigation support

## Status Types

- **Free** (Green): Available seating
- **Reserved** (Blue): Reserved but not yet occupied
- **Occupied** (Red): Currently in use
- **Cover** (Orange): Needs coverage

## Project Structure

```
.
├── index.html              Main HTML file
├── data/
│   └── chairs.json        Default chair positions and IDs
├── js/
│   ├── main.js            Application entry point and event handlers
│   ├── config.js          Configuration constants
│   ├── storage.js         localStorage abstraction
│   ├── status.js          Chair status logic
│   ├── ui.js              DOM element cache and UI helpers
│   ├── render.js          Chair rendering logic
│   ├── alignment.js       Chair position alignment utilities
│   ├── drag.js            Drag-and-drop functionality
│   ├── admin.js           Admin mode management
│   └── realtime.js        Firebase integration
├── styles/
│   └── main.css           Stylesheet with CSS variables
├── tafelplan.png          Background floor plan image
└── firebase-config.js     Firebase configuration (optional)
```

## Getting Started

### Basic Setup (No Real-time)

1. Clone the repository
2. Serve with any HTTP server:
   ```bash
   python -m http.server 8000
   # or
   npx http-server
   ```
3. Open `http://localhost:8000` in your browser

### With Firebase Real-time Database

1. Create a Firebase Realtime Database project
2. Add your Firebase config to `firebase-config.js`:
   ```javascript
   window.FIREBASE_CONFIG = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     databaseURL: "YOUR_DATABASE_URL",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
3. Set up your Firebase rules to allow read/write on `/rooms/mosselfeest-2026/`

## Usage

### Regular Mode

- **Click a chair** to cycle through statuses
- **View counters** at the top to see status summary

### Admin Mode

1. Click the **🔒 Beheer** (Admin) button
2. Enter PIN code (default: `2026`)
3. Available actions:
   - **Stoel toevoegen** (Add Chair): Add new chair at center
   - **Stoel verwijderen** (Remove Chair): Enable delete mode, click to remove
   - **Alles groen** (Reset): Clear all seating statuses
   - **Opslaan** (Save): Save layout changes
   - **Annuleren** (Cancel): Discard changes
4. Drag chairs to reposition them on the floor plan

## Configuration

Edit `js/config.js` to customize:

```javascript
{
  ADMIN_PIN: '2026',              // Admin PIN code
  ROOM_ID: 'mosselfeest-2026',   // Firebase room identifier
  ALIGNMENT_TOLERANCE: 0.16,      // Grid alignment sensitivity
  CHAIR: {
    WIDTH: 0.82,                  // Chair width as % of viewport
    HEIGHT: 1.16,                 // Chair height as % of viewport
  },
}
```

## Architecture

### Module Design

The application is split into focused modules:

- **config.js**: Centralized configuration
- **storage.js**: localStorage operations
- **status.js**: Chair status transitions and counting
- **ui.js**: DOM element references and UI helpers
- **render.js**: Chair rendering and DOM updates
- **alignment.js**: Chair position grid alignment
- **drag.js**: Drag-and-drop logic
- **admin.js**: Admin mode operations
- **realtime.js**: Firebase Realtime Database integration
- **main.js**: Application orchestration and event listeners

### Data Flow

1. **State**: `status` object (id → status) and `layout` array (chair definitions)
2. **Storage**: Automatically saved to localStorage
3. **Rendering**: Triggered after state changes via `render()`
4. **Firebase**: Optional sync through `RealtimeState`

## Performance Optimizations

- Modular bundle: Only load what's needed
- Efficient DOM updates: Minimal reflows/repaints
- CSS variables: Easy theming and reduced specificity
- Touch-optimized: Proper cursor and tap states
- Lazy Firebase loading: Only loaded when configured

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+

## Contributing

When modifying code:

1. Keep modules focused and single-responsibility
2. Use descriptive function names
3. Add JSDoc comments for public functions
4. Test on mobile devices
5. Update this README if adding features

## License

MIT
