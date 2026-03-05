const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = process.env.PORT || 3000;
const authClientId = process.env.AUTH_CLIENT_ID || "frs-oath-prod";
const authClientSecret =
  process.env.AUTH_CLIENT_SECRET ||
  "SeCUzxUXA-rgxBw8wWBkL8bOlViFg_0l-EdUkRoZgQwWmO-XkG-SVw_LNNVYBcj2";
const authUrl = process.env.AUTH_URL || "http://localhost:8080/api/";
const o2cRedirectTarget =
  process.env.O2C_REDIRECT_TARGET || "http://localhost:3500";

app.use(express.json());

app.use((req, res, next) => {
  req.authenticatedUserName = req.headers["auth_user"];
  req.authenticatedUserFirstName = req.headers["givenname"];

  // req.authenticatedUserName = "tprasad";
  // req.authenticatedUserFirstName = "Siva";
  next();
});

app.get("/user/name", (req, res) => {
  res.json({
    auth_user: req.authenticatedUserName,
    auth_user_name: req.authenticatedUserFirstName,
    auth_client_id: authClientId,
    auth_client_secret: authClientSecret,
    auth_url: authUrl,
  });
});

// Serve Storybook at /storybook/ path (no auth required)
app.use(
  "/storybook",
  express.static(path.join(__dirname, "../ui/storybook-static")),
);
app.get("/storybook/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../ui/storybook-static", "index.html"));
});

// Prevent Angular fallback from hijacking /o2c traffic which is served by the React app.
// In production, OpenShift Routes handle this. Locally, proxy to the React dev server.
if (o2cRedirectTarget) {
  app.use(
    "/o2c",
    createProxyMiddleware({
      target: o2cRedirectTarget,
      changeOrigin: true,
    }),
  );
} else {
  app.use((req, res, next) => {
    if (req.path === "/o2c" || req.path.startsWith("/o2c/")) {
      return res.status(404).send("/o2c is served by the O2C UI deployment");
    }
    next();
  });
}

app.use(express.static(path.join(__dirname, "../ui/dist/browser")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../ui/dist/browser", "index.html"));
});

app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
