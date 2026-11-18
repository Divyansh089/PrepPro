// Imported first by helpers.ts, before the app loads its config.
// No Gemini in tests: the fallbacks are used, so results are always the same.
// (dotenv never overrides a variable that is already set, even to an empty string)
process.env.GEMINI_API_KEY = '';
