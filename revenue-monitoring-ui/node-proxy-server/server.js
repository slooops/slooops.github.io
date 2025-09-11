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

app.use(express.static(path.join(__dirname, "../ui/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../ui/dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
