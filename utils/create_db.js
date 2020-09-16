const sqlite3 = require('sqlite3').verbose();

let db_location = "/media/external_1/Cal-Track/cal_track.db";
let db = new sqlite3.Database(db_location);

let table_scripts_map = new Map([
    //TABLE CREATION SCRIPTS
    ["create_users", 
        `CREATE TABLE IF NOT EXISTS users(
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL);`
    ],
    ["create_weights", 
        `CREATE TABLE IF NOT EXISTS weight(
        username TEXT NOT NULL,
        weight REAL NOT NULL,
        entry_datetime TEXT NOT NULL,
        FOREIGN KEY (username) REFERENCES users(username));`
    ],
    ["create_cal_entries", 
        `CREATE TABLE IF NOT EXISTS cal_entry(
        entry_id INTEGER PRIMARY KEY,
        username TEXT NOT NULL,
        entry_datetime TEXT NOT NULL,
        calories REAL NOT NULL,
        fat REAL NOT NULL,
        carb REAL NOT NULL,
        protein REAL NOT NULL,
        fiber REAL NOT NULL,
        FOREIGN KEY (username) REFERENCES users(username));`
    ],
    //TODO: split this up
    //TODO: rename this all to ingredient
    //Fat, carbs, etc. are in grams
    ["create_foods",
        `CREATE TABLE IF NOT EXISTS foods(
        food_id INTEGER PRIMARY KEY,
        food_name TEXT NOT NULL,
        unit TEXT NOT NULL,
        amount REAL NOT NULL, 
        calories REAL NOT NULL,
        fat REAL NOT NULL,
        carb REAL NOT NULL,
        protein REAL NOT NULL,
        fiber REAL NOT NULL);`
    ],
    ["create_recipes", 
        `CREATE TABLE IF NOT EXISTS recipes(
        id INTEGER PRIMARY KEY,
        recipe_name TEXT NOT NULL,
        ingredient_name TEXT NOT NULL,
        ingredient_id INTEGER NOT NULL,
        ingredient_unit TEXT NOT NULL,
        ingredient_amount REAL NOT NULL,
        FOREIGN KEY(ingredient_id) REFERENCES foods(food_id));`
    ],
    ["create_meals", 
        `CREATE TABLE IF NOT EXISTS meals(
        meal_id INTEGER PRIMARY KEY,
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

let index_scripts_map = new Map();

//Always create your tables before their indices!
for(let script of table_scripts_map.values()){
    db.run(script);
}
for(let script of index_scripts_map.values()){
    db.run(script);
}

db.close();
