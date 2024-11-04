const express = require("express");
const path = require("path");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

const userRolesCache = new Map(); // Cache for user roles (key: username)

app.use(express.json());

app.use((req, res, next) => {
  req.authenticatedUserName = req.headers["auth_user"];
  req.authenticatedUserFirstName = req.headers["givenname"];

  // req.authenticatedUserName = "suacha";
  // req.authenticatedUserFirstName = "Sunith";
  next();
});

const fetchUserRoles = async (username) => {
  if (userRolesCache.has(username)) {
    console.log(`Returning cached roles for ${username}`);
    return userRolesCache.get(username); // Return cached roles if available
  }

  try {
    // const url = "http://localhost:8080/api/user-role";
    const url = "https://operations-control-tower-api.cisco.com/api/user-role";
    const params = { username };

    const response = await axios.get(url, { params });
    const roles = response.data.userRoles;

    userRolesCache.set(username, roles); // Cache the roles
    console.log(`Fetched and cached roles for ${username}`);
    return roles;
  } catch (error) {
    console.error(`Error fetching roles for ${username}:`, error);
    throw new Error("Error fetching user roles.");
  }
};

app.get("/user/name", (req, res) => {
  res.json({
    auth_user: req.authenticatedUserName,
    auth_user_name: req.authenticatedUserFirstName,
  });
});

app.get("/user/data", async (req, res) => {
  const username = req.authenticatedUserName;

  try {
    const roles = await fetchUserRoles(username);
    res.json({ auth_user_roles: roles });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.use(express.static(path.join(__dirname, "../ui/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../ui/dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
