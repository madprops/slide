if (typeof globalThis.process === `undefined`) {
  globalThis.process = {env: {}}
}

if (typeof globalThis.process.env === `undefined`) {
  globalThis.process.env = {}
}

if (typeof globalThis.process.env.NODE_ENV === `undefined`) {
  globalThis.process.env.NODE_ENV = `production`
}