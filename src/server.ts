import { env } from "./config/env.config";
import app, { init } from "./index";

const port = env.PORT;

init().then(() => {
  app.listen(port, () => {
    console.log(`Server listening in http://localhost:${port}`);
  });
});
