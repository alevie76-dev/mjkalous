// OAuth callbacks and the Decap popup handshake must use the same origin.
      if (!['localhost', '127.0.0.1'].includes(location.hostname) && location.origin !== 'https://mjkalous.com') {
        location.replace('https://mjkalous.com/admin' + location.search + location.hash);
      }
