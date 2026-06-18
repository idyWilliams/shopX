
// Temporarily disabled WatermelonDB to fix native module error
// We'll use Supabase for all data needs right now!

export const getDatabase = () => {
  console.warn('WatermelonDB is temporarily disabled');
  return null as any;
};

export const database = new Proxy({} as any, {
  get: () => {
    console.warn('WatermelonDB is temporarily disabled');
    return () => {};
  },
});
