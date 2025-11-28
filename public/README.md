# Soundalite Retro Invite Page

A retro gaming-styled Single Page Application (SPA) for inviting the Soundalite Discord bot to servers.

## Features

- 🎮 Retro NES-style aesthetic with vibrant colors
- ⌨️ Full keyboard navigation support
- 📱 Responsive design
- ✨ Smooth animations and effects
- 🎯 Easy invite functionality

## Setup

1. Make sure you have `CLIENT_ID` set in your `.env` file
2. Install dependencies: `npm install`
3. Start the server: `npm run serve`
4. Open your browser to `http://localhost:3000`

## Usage

- **Arrow Keys**: Navigate the menu
- **Enter**: Select menu item
- **Escape/Backspace**: Go back to main menu
- **Click**: Use mouse to interact with buttons

## Customization

The invite page uses the same permissions as defined in `generateInvite.js`. The server automatically calculates the invite URL based on your `CLIENT_ID` environment variable.

