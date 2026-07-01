export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // Backend CMS does not need to run client SDK initialization on itself
      // const { initSDK } = await import('@/lib/global-backend');
      // await initSDK();
      console.log('[Instrumentation] Server started');
    } catch (err) {
      console.error('[Instrumentation] Error during server start:', err);
    }
  }
}
