const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  // makeAutomaticPost(req.headers["auth_user"]);
  // console.log(req.headers["auth_user"] + "here 1");
  authUserName = req.headers["auth_user"];
  // makeAutomaticPost("karcai");
  next();
});

app.use(express.static(path.join(__dirname, "../ui/dist")));

// Define API endpoint
app.get("/user/data", (req, res) => {
  // Handle the request and send response

  res.json({ auth_user: authUserName });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../ui/dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
