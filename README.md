# self-report backend

Firebase function for covid-self-report.

This firebase function will validate request using Google's reCaptcha v3 before inserting data into firestore, you must as such create a reCaptcha project (if you want to use it) and have firestore available in your Firebase project.

## Getting started
1. Create a firebase project if not already done
2. Clone this project
3. Update the `firebase.json` and `.firebaserc` files to reflect your configuration
4. Create a `.runtimeconfig.json` file based on `env.example.json` and update it with your values
5. Run `npm run env` from within the functions directory to populate your environment variables
6. Run `firebase serve` to test locally and `firebase deploy` to deploy it
