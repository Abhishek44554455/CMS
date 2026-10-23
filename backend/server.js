import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      '[warning] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set in backend/.env — ' +
        'database endpoints will return 503 until they are configured.'
    );
  }
});
