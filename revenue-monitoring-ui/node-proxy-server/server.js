const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  // Log request headers
  console.log("Request Headers:", req.headers);
  next();
});

app.listen(port, () => {
  console.log(`Node.js server is running on port ${port}`);
});
