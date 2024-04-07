const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

const proxyPath = "/api";

const targetURL = "https://operations-control-tower-api.cisco.com";

let hasMadePostRequest = false;

app.use(express.json());

function makeAutomaticPost(authUser) {
  if (!hasMadePostRequest) {
    const postData = {
      auth_user: authUser,
    };
    console.log(postData + "here2");
    axios
      .post(`${targetURL}/api/auth-user`, postData)
      .then((response) => {
        console.log("Automatic POST request successful:", response.data);
        hasMadePostRequest = true;
      })
      .catch((error) => {
        console.error("Error in automatic POST request:", error.message);
      });
  }
}

app.use((req, res, next) => {
  makeAutomaticPost(req.headers["auth_user"]);
  console.log(req.headers["auth_user"] + "here 1");
  // makeAutomaticPost("avudutha");
  next();
});

app.use(express.static(path.join(__dirname, "../ui/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../ui/dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
