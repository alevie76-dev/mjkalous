import { initBotId } from 'botid/client/core';

// Run before either form can submit. Basic verification is free and must match
// the server's check level. Other pages do not load the challenge unnecessarily.
if (typeof window !== 'undefined') {
  initBotId({
    protect: [{ path: '/api/contact', method: 'POST', advancedOptions: { checkLevel: 'basic' } }],
  });
}
