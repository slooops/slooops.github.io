const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = process.env.PORT || 3000;

const proxyPath = "/api";
// const targetURL = "http://localhost:8080";

const targetURL = "https://error-dashboard-dev-api.cisco.com";

app.use((req, res, next) => {
  console.log("Request Headers from SSO:", req.headers);
  next();
});

const apiProxy = createProxyMiddleware(proxyPath, {
  target: targetURL,
  changeOrigin: true,
});
app.use(proxyPath, apiProxy);

app.use(express.static(path.join(__dirname, "../ui/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../ui/dist", "index.html"));
});

// Start the proxy server
app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
