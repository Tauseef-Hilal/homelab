import app from './app';
import { env } from '@shared/config/env';

app.listen(env.PORT, () => {
  console.log(`Server running on ${env.API_BASE_URL}`);
});
