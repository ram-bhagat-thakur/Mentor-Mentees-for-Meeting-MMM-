import "./config/env.js";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`MMM API listening on port ${port}`);
  void connectDatabase();
});