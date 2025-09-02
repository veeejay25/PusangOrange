# PusangOrange 🎮

A React Native mobile app built with Expo for tracking your Escape from Tarkov progress. Monitor your quest completion, Kappa container progress, hideout upgrades, and even use **image recognition to automatically track your stash and quest items** — all in one place.

## Get started

1. Install dependencies

   ```bash
   npm install 
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

* [development build](https://docs.expo.dev/develop/development-builds/introduction/)
* [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
* [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
* [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## Features

* **Quest Tracking**: Monitor your progress through all Escape from Tarkov quests
* **Kappa Progress**: Track quests specifically required for the Kappa secure container
* **Hideout Management**: Keep tabs on your hideout station upgrades and requirements
* **Item Recognition (OCR)**: Take screenshots of your stash, quest screen, or trader menus — the app uses OCR and image recognition to **detect items and quests automatically**, reducing manual entry
* **Stash Auto-Tracking**: Recognized items are automatically logged to your inventory progress
* **Quest Auto-Detection**: OCR can match your quest list and automatically mark quests as completed when detected
* **Offline Storage**: Data is cached locally for offline access
* **Real-time Data**: Fetches the latest quest and hideout information from the Tarkov API

## App Structure

* **Profile Tab**: Overview of quest and hideout progress with interactive trackers
* **Quests Tab**: Detailed quest management organized by traders, with auto-detection support
* **Items Tab**: Browse and search Tarkov items, with OCR integration for quick stash sync
* **Hideout Tab**: Manage hideout station upgrades and requirements
* **Settings Tab**: Configure app preferences, OCR/image recognition options, and player settings

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Tech Stack

* **React Native**: Cross-platform mobile development
* **Expo**: Development platform and build tools
* **TypeScript**: Type-safe JavaScript development
* **React Navigation**: Navigation and routing
* **AsyncStorage**: Local data persistence
* **Tarkov.dev API**: Real-time game data via GraphQL
* **OCR/Image Recognition**: Planned support for libraries like [Tesseract.js](https://github.com/naptha/tesseract.js) or native ML kits to detect text and items from screenshots

## Roadmap / To-Do

### Planned Features

* [ ] **Image Recognition**: OCR-based system to read stash screenshots and quest screens, automatically updating quest and item progress
* [ ] **Stash Management**: Inventory tracking and organization tools with auto-sync from screenshots
* [ ] **Item Database Integration**: Complete item browser with prices and statistics
* [ ] **Trader Stock Tracking**: Monitor trader inventories and reset timers
* [ ] **Market Analysis**: Price tracking and market trends
* [ ] **Achievement System**: Track in-game accomplishments and milestones
* [ ] **Export/Import**: Data backup and sharing capabilities

### Current Limitations

* Manual quest progress tracking (OCR integration is work-in-progress)
* Basic hideout progress display
* Limited offline functionality

## Contributing

This is a personal project for tracking Escape from Tarkov progress. Feel free to fork and modify for your own use. Pull requests for OCR/image recognition improvements are welcome.

## Resources

* [Tarkov.dev API](https://tarkov.dev/): Game data API
* [Escape from Tarkov Wiki](https://escapefromtarkov.fandom.com/): Game information
* [Expo Documentation](https://docs.expo.dev/): Development platform docs
* [Tesseract.js](https://github.com/naptha/tesseract.js): OCR library for text recognition in images