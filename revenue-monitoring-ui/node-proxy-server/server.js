const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const authClientId = process.env.AUTH_CLIENT_ID || "frs-oath-prod";
const authClientSecret =
  process.env.AUTH_CLIENT_SECRET ||
  "SeCUzxUXA-rgxBw8wWBkL8bOlViFg_0l-EdUkRoZgQwWmO-XkG-SVw_LNNVYBcj2";
const authUrl = process.env.AUTH_URL || "http://localhost:8080/api/";

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
  express.static(path.join(__dirname, "../ui/storybook-static"))
);
app.get("/storybook/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../ui/storybook-static", "index.html"));
});

app.use(express.static(path.join(__dirname, "../ui/dist/browser")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../ui/dist/browser", "index.html"));
});

app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
