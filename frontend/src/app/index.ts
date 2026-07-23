// Validates required environment variables as soon as the app bootstraps —
// throws before anything renders if a required `VITE_` variable is missing.
import '../shared/config';

export { default as App } from './App';
