module.exports = {
  apps: [
    {
      name: 'nexusforge-backend',
      script: 'dist/index.js',
      instances: 'max',         // Scale across all available CPU cores
      exec_mode: 'cluster',     // Cluster load balancing mode
      autorestart: true,        // Restart automatically on crashes
      watch: false,
      max_memory_restart: '1G',  // Memory limit to prevent memory leak crashes
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
