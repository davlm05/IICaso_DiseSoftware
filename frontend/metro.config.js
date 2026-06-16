const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Force a single instance of React / React DOM. On this project (which lives
// under a OneDrive reparse point on Windows) Metro can otherwise resolve
// `react` via two different absolute paths and bundle it twice — each copy gets
// its own hooks dispatcher, so a hook called from one copy reads the other's
// (null) dispatcher → "Cannot read properties of null (reading 'useRef')" /
// "Invalid hook call". Pinning the resolution origin to the project root keeps
// every `react`/`react-dom` import pointing at the same module instance.
const SINGLETON = new Set(["react", "react-dom"]);
const projectRootModule = path.join(__dirname, "metro.config.js");
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (SINGLETON.has(moduleName)) {
    return context.resolveRequest(
      { ...context, originModulePath: projectRootModule },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./src/styles/global.css" });
