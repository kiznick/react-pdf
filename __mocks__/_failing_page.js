export default {
  cleanup: () => {
    // Intentionally empty
  },
  commonObjs: {
    get: () => {
      // Intentionally empty
    },
  },
  getAnnotations: () => new Promise((resolve, reject) => reject(new Error())),
  getOperatorList: () => new Promise((resolve, reject) => reject(new Error())),
  getTextContent: () => new Promise((resolve, reject) => reject(new Error())),
  getViewport: () => ({
    width: 600,
    height: 800,
    rotation: 0,
  }),
  render: () => ({
    promise: new Promise((resolve, reject) => reject(new Error())),
    cancel: () => {
      // Intentionally empty
    },
  }),
};
