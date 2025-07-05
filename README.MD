# Tower of Hanoi Web Game

A modern web-based Tower of Hanoi puzzle built with HTML, CSS, and JavaScript.

## Features

- Keyboard controls for picking up and placing disks (using number keys 1, 2, 3...)
- Customizable number of disks and towers (via settings menu)
- Sound effects for moves and winning (requires Tone.js)
- Dark mode toggle
- Option to show/hide disk numbers (always on or always off)
- Settings persistence using browser cookies
- Game state label providing descriptive feedback for actions
- Timer and move counter
- Multi-layered visual feedback for tower selection and move previews

**Note:** Drag-and-drop and disk hover effects have been removed. All interaction is via clicking towers or using the keyboard.

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- [Tone.js](https://tonejs.github.io/) (for audio)

## How to Self-Host (with Python)

You can easily run this project locally using Python's built-in HTTP server.

1. **Open a terminal and navigate to the project directory:**
    ```sh
    cd /path/to/Hanoi
    ```

2. **Start the server (Python 3):**
    ```sh
    python3 -m http.server
    ```
    This will start a web server on port 8000 by default.

3. **Open your browser and go to:**
    ```
    http://localhost:8000/
    ```

> **Note:**
> Do not open `index.html` directly with your browser (`file://` URL), as some features (like cookies for settings) may not work. Always use a local web server as shown above.

## How to Play

- **Click or Keyboard:** Click towers or use number keys (1, 2, 3, ...) to select a source and then a destination tower. Only smaller disks can be placed on larger ones.
- **Game State Label:**
  Located below the game area, this label provides feedback on your actions, such as selecting a disk, attempting a move, or winning the game.
- **Settings:**
  Click the hamburger menu (top right) to open settings. Here you can adjust sound, dark mode, disk number display, and the number of disks/towers. Settings are saved automatically to your browser's cookies.
- **Reset:**
  Use the "Reset" button for a quick reset, or "Apply and Reset" in the settings menu to change disk/tower count and restart.

## Accessibility & Feedback

- Towers are fully keyboard accessible (focusable and operable via number keys).
- Visual feedback is provided for hover, selection, and move preview states.
- Disk numbers are always visible or always hidden, based on the toggle in settings.
- No disk hover or drag-and-drop interaction is present.