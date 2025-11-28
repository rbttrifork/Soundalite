const mysql = require("mysql2/promise"); // Switch to the promise-based API
const { drizzle } = require("drizzle-orm/mysql2");

let instance;

/**
 * Class representing a Database Manager.
 */
class DatabaseManager {

    /**
     * Create a DatabaseManager instance.
     * @throws {Error} Throws an error if an instance of DatabaseManager already exists.
     */
    constructor() {
        if (instance) throw new Error("Cannot instantiate multiple DB Managers");
        instance = this;

        this._dbEnabled = false;
        if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") {
            try {
                new URL(process.env.DATABASE_URL);
                this._dbEnabled = true;
            } catch (e) {
                // Use console.error directly to avoid recursion if logger uses this
                process.stdout.write("[WARNING] DATABASE_URL is set but is not a valid URL. Ignoring database connection.\n");
                this._dbEnabled = false;
            }
        }

        if (!this._dbEnabled) return;
          
        /**
         * The MySQL connection pool.
         * @type {mysql.Pool}
         * @private
         */
        this._dbPool = mysql.createPool({
            uri: process.env.DATABASE_URL,
            waitForConnections: true,
            connectionLimit: 2,
        });

        /**
         * The Drizzle ORM instance for the database.
         */
        this._drizzle = drizzle(this._dbPool);
    }

    // ... existing methods ...

    /** 
     * Checks if the database connection is configured.
     * 
     * @returns {boolean} Returns `true` if the database connection is configured, otherwise `false`.
     */
    dbExists() {
        return this._dbEnabled;
    }
}

/**
 * The singleton instance of the DatabaseManager.
 * @type {DatabaseManager}
 */
const dbManager = new DatabaseManager();
Object.freeze(dbManager);

module.exports = dbManager;
