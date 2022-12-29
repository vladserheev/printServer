# 🧰 Print Server

Are you tired of having to transfer documents to your computer just to print them out? Look no further! This app allows you to print pages directly from a Telegram bot, all you need is a Raspberry PI and a printer. Simply send your document to the Telegram bot and connect your Raspberry PI to your printer – it's that easy! With this app, you can say goodbye to the hassle of transferring files and hello to streamlined, convenient printing. Try it out and see the difference for yourself!


Firstly, set telegram_token to `/src/config.ts`

### Scripts

#### `npm run start:dev`

Starts the application in development using `nodemon` and `ts-node` to do hot reloading.

#### `npm run start`

Starts the app in production by first building the project with `npm run build`, and then executing the compiled JavaScript at `build/index.js`.

#### `npm run build`

Builds the app at `build`, cleaning the folder first.
