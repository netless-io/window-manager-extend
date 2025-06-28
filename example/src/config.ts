// /* eslint-disable no-empty */
// import type { FastboardUIConfig } from "@netless/fastboard";

// export let config: FastboardUIConfig = {};

// const callbacks: Array<(t: typeof config) => void> = [];

// export function updateConfig(
//   conf_or_fn: FastboardUIConfig | ((c: FastboardUIConfig) => FastboardUIConfig | undefined) | undefined
// ) {
//   const _ref = config;
//   config = (typeof conf_or_fn === "function" ? conf_or_fn(config) : conf_or_fn) || config;
//   if (config === _ref) {
//     config = { ...config };
//   }
//   callbacks.forEach((cb) => cb(config));
//   if (typeof localStorage !== "undefined") {
//     localStorage.setItem("fastboard-config", JSON.stringify(config));
//   }
// }

// Object.assign(window, { updateConfig });

// if (typeof localStorage !== "undefined") {
//   try {
//     config = JSON.parse(localStorage.getItem("fastboard-config") || "{}");
//   } catch {}
// }

// export const config$ = {
//   subscribe(cb: (t: typeof config) => void) {
//     callbacks.push(cb);
//     cb(config);
//     return () => {
//       const index = callbacks.indexOf(cb);
//       if (index !== -1) {
//         callbacks.splice(index, 1);
//       }
//     };
//   },
// };
