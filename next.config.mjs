import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

const config = (phase, { defaultConfig }) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      reactStrictMode: false,
    };
  }

  return {
    basePath: '/badminton-court-scheduler',
    output: 'export',
    reactStrictMode: false,
  };
};

export default config;
