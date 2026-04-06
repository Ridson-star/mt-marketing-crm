import "dotenv/config";
import app from "./app.js";

const PORT = Number(process.env.PORT) || 8787;

app.listen(PORT, () => {
  console.log(`API luistert op http://localhost:${PORT}`);
});
