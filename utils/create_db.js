const sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('/media/external_1/Cal-Track/cal_track.db');

//CREATE SCRIPTS
var create_users = "CREATE TABLE IF NOT EXISTS users(" +
    "username TEXT PRIMARY KEY," +
    "password TEXT NOT NULL" +
    ");";

var create_weights = "CREATE TABLE IF NOT EXISTS weight(" +
    "username TEXT NOT NULL," +
    "weight REAL NOT NULL," +
    "entry_datetime TEXT NOT NULL," +
    "FOREIGN KEY (username) REFERENCES users(username)" +
    ");";

var create_cal_entries = "CREATE TABLE IF NOT EXISTS cal_entry(" +
    "entry_id INTEGER PRIMARY KEY," +
    "username TEXT NOT NULL," +
    "entry_datetime TEXT NOT NULL," +
    "calories REAL NOT NULL," +
    "fat REAL NOT NULL," +
    "carb REAL NOT NULL," +
    "protein REAL NOT NULL," +
    "fiber REAL NOT NULL," +
    "FOREIGN KEY (username) REFERENCES users(username)" +
    ");";

var create_foods = "CREATE TABLE IF NOT EXISTS foods(" + 
    "food_id INTEGER PRIMARY KEY," +
    "food_name TEXT NOT NULL," +
    "unit TEXT NOT NULL," +
    "amount REAL NOT NULL," + 
    "calories REAL NOT NULL," +
    //Fat, carbs, etc. are in grams
    "fat REAL NOT NULL," +
    "carb REAL NOT NULL," +
    "protein REAL NOT NULL," +
    "fiber REAL NOT NULL" +
    ");";

var create_recipes = "CREATE TABLE IF NOT EXISTS recipes(" +
    "id INTEGER PRIMARY KEY," +
    "recipe_name TEXT NOT NULL," +
    "ingredient_name TEXT NOT NULL," +
    "ingredient_id INTEGER NOT NULL," +
    "ingredient_unit TEXT NOT NULL," +
    "ingredient_amount REAL NOT NULL," +
    "FOREIGN KEY(ingredient_id) REFERENCES foods(food_id)" +
    ");";

var create_meals = "CREATE TABLE IF NOT EXISTS meals(" +
    "meal_id INTEGER PRIMARY KEY," +
    "meal_name TEXT NOT NULL," +
    "creation_date TEXT NOT NULL," +
    "total_weight REAL NOT NULL," +
    "calories REAL NOT NULL," +
    "fat REAL NOT NULL," +
    "carb REAL NOT NULL," +
    "protein REAL NOT NULL," +
    "fiber REAL NOT NULL" +
    ");";

var table_scripts = [create_users, create_cal_entries, create_weights, create_foods, create_recipes, create_meals];

table_scripts.forEach(function(item, index, array){
    db.run(item);
});

db.close();
