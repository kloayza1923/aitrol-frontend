export default {
    apps: [
      {
        name: "vite-dev",
        script: "vite",
        watch: false,
        exec_mode: "fork",
        env: {
          NODE_ENV: "development",
        },
      },
    ],
  };
  