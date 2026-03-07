// Alternative implementation options for OpenClaw API key configuration

// Option 1: Raw object format
const result = await this.request("config.set", {
  raw: {
    env: {
      [envVar]: apiKey
    }
  }
});

// Option 2: Flat raw format  
const result = await this.request("config.set", {
  raw: {
    [`env.${envVar}`]: apiKey
  }
});

// Option 3: String path format
const result = await this.request("config.set", {
  path: `env.${envVar}`,
  raw: apiKey
});

// Option 4: Direct environment variable setting
const result = await this.request("env.set", {
  [envVar]: apiKey
});
