const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

const root = process.cwd();
const envFiles = [
  path.join(root, ".env"),
  path.join(root, `.env.${process.env.EXPO_ENV || process.env.NODE_ENV || "development"}`),
];

for (const envPath of envFiles) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

module.exports = ({ config } = {}) => ({
  ...config,
  name: "Lintara",
  slug: "lintara",
  owner: "dzulkar",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "lintara",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.dzulkar.lintara",
  },
  android: {
    package: "com.dzulkar.lintara",
    adaptiveIcon: {
      foregroundImage: "./assets/images/Lintara.png",
      backgroundColor: "#E6F4FE",
    },
  },
  web: {
    output: "static",
    favicon: "./assets/images/Lintara.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    "@react-native-community/datetimepicker",
    "expo-web-browser",
    "expo-secure-store",
  ],
  extra: {
    router: {},
    eas: {
      projectId: "f0bb2175-7e5b-4734-9012-26f5fd1e7989",
    },
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_APP_MODE: process.env.EXPO_PUBLIC_APP_MODE,
    EXPO_PUBLIC_GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_REDIRECT_URI:
      process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI || "lintara://redirect",
  },
});


