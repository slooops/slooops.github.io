const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = process.env.PORT || 3000;

// Define the path for the proxy, e.g., '/api', and the target URL
const proxyPath = "/api";
const targetURL = "https://error-dashboard-dev-api.cisco.com"; // Target the same server as your Angular app

app.use((req, res, next) => {
  console.log("Request Headers from SSO:", req.headers);
  next();
});

// Create a proxy middleware for the API requests
const apiProxy = createProxyMiddleware(proxyPath, {
  target: targetURL,
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    // Log the incoming request headers from the SSO server
    // console.log("Request Headers from SSO:", req.headers);
  },
});

// Use the API proxy middleware
app.use(proxyPath, apiProxy);

// Start the proxy server
app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
