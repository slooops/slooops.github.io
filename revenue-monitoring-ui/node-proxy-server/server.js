const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = process.env.PORT || 3000;

const proxyPath = "/api";

const targetURL = "https://error-dashboard-dev-api.cisco.com";

app.use(express.json());

async function makeAutomaticPost(authUser) {
  try {
    const postData = {
      auth_user: authUser,
    };

    const response = await axios.post(`${targetURL}/user/auth-user`, postData);
  } catch (error) {
    console.error("Error in automatic POST request:", error.message);
  }
}

app.use((req, res, next) => {
  makeAutomaticPost(req.headers["auth_user"]);
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

app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
