const express = require("express");
const path = require("path");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

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
  });
});

app.use(express.static(path.join(__dirname, "../ui/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../ui/dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
