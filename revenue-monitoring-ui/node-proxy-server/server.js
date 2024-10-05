const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  authUserName = req.headers["auth_user"];
  authUserFirstName = req.headers["givenname"];
  next();
});

app.use(express.static(path.join(__dirname, "../ui/dist")));

app.get("/user/data", (req, res) => {
  res.json({ auth_user: authUserName, auth_user_name: authUserFirstName });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../ui/dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
