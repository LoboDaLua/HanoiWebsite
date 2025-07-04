# Tower of Hanoi Web Game

A web-based implementation of the classic Tower of Hanoi puzzle, built with HTML, CSS, and JavaScript.

## Features

- Interactive drag-and-drop gameplay
- Keyboard controls for picking up and placing disks (using number keys 1, 2, 3...)
- Customizable number of disks and towers (via settings menu)
- Sound effects for moves and winning (requires Tone.js)
- Dark mode toggle
- Option to show/hide disk numbers
- Settings persistence using browser cookies
- Game state label providing descriptive feedback for actions.
- Timer and move counter

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

- **Drag and Drop:** Click and drag the top disk from a tower to another tower. Only smaller disks can be placed on larger ones.
- **Keyboard Controls:**
  - Press a number key (1, 2, 3, ...) to pick up the top disk from that tower.
  - Press another number key to place the disk on the chosen tower.
- **Game State Label:**
  Located below the game area, this label provides feedback on your actions, such as selecting a disk, attempting a move, or winning the game.
- **Settings:**
  Click the hamburger menu (top right) to open settings. Here you can adjust sound, dark mode, disk number display, and the number of disks/towers. Settings are saved automatically to your browser's cookies.
- **Reset:**
  Use the "Reset" button for a quick reset, or "Apply and Reset" in the settings menu to change disk/tower count and restart.