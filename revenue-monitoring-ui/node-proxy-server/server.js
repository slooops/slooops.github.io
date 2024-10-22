const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const axios = require("axios");

app.use(express.json());

app.use(async (req, res, next) => {
  req.authenticatedUserName = req.headers["auth_user"];
  req.authenticatedUserFirstName = req.headers["givenname"];
  // req.authenticatedUserName = "suacha";
  // req.authenticatedUserFirstName = "Sunith";

  const url = "https://operations-control-tower-api.cisco.com/api/user-role";
  const params = { username: req.authenticatedUserName };

  try {
    req.userRoles = await axios.get(url, { params });
  } catch (error) {
    res.status(500).send("Error fetching user roles.");
  }
  next();
});

app.get("/user/name", (req, res) => {
  res.json({
    auth_user: req.authenticatedUserName,
    auth_user_name: req.authenticatedUserFirstName,
  });
});

app.get("/user/data", (req, res) => {
  res.json({
    auth_user_roles: req.userRoles.data.userRoles,
  });
});

app.use(express.static(path.join(__dirname, "../ui/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../ui/dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
