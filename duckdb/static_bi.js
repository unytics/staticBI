import * as duckdb from "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.1-dev106.0/+esm";

const getDb = async () => {
  if (window._db) {
    return window._db;
  }

  // Select a bundle based on browser checks
  const jsdelivr_bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(jsdelivr_bundles);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], {
      type: "text/javascript",
    })
  );

  // Instantiate the asynchronus version of DuckDB-wasm
  const worker = new Worker(worker_url);
  // const logger = null //new duckdb.ConsoleLogger();
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);
  window._db = db;
  return db;
};

getDb();

window.duckdb = {

  load: async () => {
    const db = await getDb();
    const conn = await db.connect();
    const stmt = await conn.query(
      `create table athletes as from "https://idl.uw.edu/mosaic/data/athletes.parquet"`
    );
    console.log('load');
    await conn.close();
  },

  query: async () => {
    const db = await getDb();
    const conn = await db.connect();
    const result = (await conn.query(`select count(*) as nb from athletes`)).toArray().map((row) => row.toJSON());
    await conn.close();
    return result;
  }
};
