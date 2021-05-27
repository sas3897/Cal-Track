const sqlite3 = require('sqlite3').verbose();

let db_location = "/media/external_1/Cal-Track/cal_track.db";
let db = new sqlite3.Database(db_location);

let table_scripts_map = new Map([
    //TABLE CREATION SCRIPTS
    ["create_users", 
        `CREATE TABLE IF NOT EXISTS users(
        username TEXT NOT NULL PRIMARY KEY,
        password TEXT NOT NULL);`
    ],
    ["create_weights", 
        `CREATE TABLE IF NOT EXISTS weights(
        username TEXT NOT NULL,
        weight REAL NOT NULL,
        entry_datetime TEXT NOT NULL,
        FOREIGN KEY (username) REFERENCES users(username));`
    ],
    ["create_cal_entries", 
        `CREATE TABLE IF NOT EXISTS cal_entries(
        entry_id INTEGER NOT NULL PRIMARY KEY,
        username TEXT NOT NULL,
        entry_datetime TEXT NOT NULL,
        calories REAL NOT NULL,
        fat REAL NOT NULL,
        carb REAL NOT NULL,
        protein REAL NOT NULL,
        fiber REAL NOT NULL,
        FOREIGN KEY (username) REFERENCES users(username));`
    ],
    //Fat, carbs, etc. are in grams
    ["create_ingredient_servings",
        `CREATE TABLE IF NOT EXISTS ingredient_servings(
        ingredient_id INTEGER NOT NULL PRIMARY KEY,
        ingredient_name TEXT NOT NULL,
        calories REAL NOT NULL,
        fat REAL NOT NULL,
        carb REAL NOT NULL,
        protein REAL NOT NULL,
        fiber REAL NOT NULL);`
    ],
    ["create_ingredient_units",
        `CREATE TABLE IF NOT EXISTS ingredient_serving_units(
        ingredient_id INTEGER NOT NULL,
        unit TEXT NOT NULL,
        amount REAL NOT NULL, 
        FOREIGN KEY (ingredient_id) REFERENCES ingredient_servings(ingredient_id),
        PRIMARY KEY (ingredient_id, unit, amount));`
    ],
    ["create_recipes", 
        `CREATE TABLE IF NOT EXISTS recipes(
        id INTEGER NOT NULL PRIMARY KEY,
        recipe_name TEXT NOT NULL,
        ingredient_name TEXT NOT NULL,
        ingredient_ratio REAL NOT NULL,
        FOREIGN KEY(ingredient_name) REFERENCES ingredient_servings(ingredient_name));`
    ],
    ["create_meals", 
        `CREATE TABLE IF NOT EXISTS meals(
        meal_id INTEGER NOT NULL PRIMARY KEY,
        meal_name TEXT NOT NULL,
        creation_date TEXT NOT NULL,
        total_weight REAL NOT NULL,
        calories REAL NOT NULL,
        fat REAL NOT NULL,
        carb REAL NOT NULL,
        protein REAL NOT NULL,
        fiber REAL NOT NULL);`
    ]
]);

let index_scripts_map = new Map([
    //TODO update these to use ingredient_id instead
    ["servings_index", 
        `CREATE INDEX IF NOT EXISTS servings_index 
        ON ingredient_servings(ingredient_name);`
    ],
    //TODO update these to use ingredient_id instead
    ["serving_units_index", 
        `CREATE INDEX IF NOT EXISTS serving_units_index 
        ON ingredient_serving_units(ingredient_name);`
    ],
    ["cal_entries_index", 
        `CREATE INDEX IF NOT EXISTS cal_entries_index 
        ON cal_entries(username, entry_datetime);`
    ],
    ["weights_index", 
        `CREATE INDEX IF NOT EXISTS weights_index 
        ON weights(username);`
    ]
]);

//Always create your tables before their indices!
db.serialize(function() {
    for(let script of table_scripts_map.values()){
        db.run(script);
    }
    for(let script of index_scripts_map.values()){
        db.run(script);
    }
});

db.close();
