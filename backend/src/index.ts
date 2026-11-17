// env must be imported first so the .env file is loaded before anything else
import { env } from './config/env';
import app from './app';

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
