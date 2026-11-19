function makeEventBus() {
  const listeners = new Map();
  return {
    subscribe(eventType, handler) {
      if (!listeners.has(eventType)) listeners.set(eventType, []);
      listeners.get(eventType).push(handler);
    },
    publish(event) {
      for (const handler of listeners.get(event.type) || []) {
        // Publishing does not wait for notification work to complete.
        setImmediate(async () => {
          try {
            await handler(event);
          } catch (error) {
            console.error("Consumer failed:", error.message);
          }
        });
      }
    },
  };
}
module.exports = { makeEventBus };
