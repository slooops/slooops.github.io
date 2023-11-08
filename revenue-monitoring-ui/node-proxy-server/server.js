const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = process.env.PORT || 3000;

// Define the path for the proxy, e.g., '/api', and the target URL
const proxyPath = "/api";
const targetURL = "http://localhost:8080"; // Target the same server as your Angular app

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

app.use(express.static("../angular-app/dist"));

app.use(express.static(path.join(__dirname, "../angular-app/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../angular-app/dist", "index.html"));
});

// Start the proxy server
app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
