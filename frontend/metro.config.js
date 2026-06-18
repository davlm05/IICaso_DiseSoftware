const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Force a single instance of React / React DOM. A stray nested `node_modules`
// (e.g. a `src/node_modules` from an accidental `npm install` in the wrong dir)
// makes files under that subtree resolve their own copy of `react`, so a hook
// called from one copy reads the other's (null) dispatcher → "Cannot read
// properties of null (reading 'useRef')" / "Invalid hook call". Pinning the
// resolution origin to the project root keeps every `react`/`react-dom` import
// pointing at the same module instance, as a safeguard against this recurring.
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
