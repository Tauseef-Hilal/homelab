import { loadScript } from './loadScript';
import * as policies from "./policies"
import { rateLimit } from './rateLimit';

export default {
  loadScript,
  rateLimit,
  ...policies,
};
