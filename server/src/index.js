import app from "./app.js";

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`MMM API listening on http://127.0.0.1:${port}`);
});