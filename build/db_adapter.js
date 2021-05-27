"use strict";
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('/media/external_1/Cal-Track/cal_track.db');
module.exports = {
    getAllIngredientNames: function (callback) {
        db.all("SELECT DISTINCT ingredient_name FROM ingredient_servings", function (err, res) {
            if (err) {
                return console.log(err.message);
            }
            callback(res);
        });
    },
    createOrUpdateIngredient: function (ing_name, nutrients, units, amounts, callback) {
        let check_query = "SELECT ingredient_name FROM ingredient_servings WHERE ingredient_name=?";
        db.get(check_query, ing_name, (err, row) => {
            if (err) {
                return console.log(err.message);
            }
            let enter_units_query = "INSERT INTO ingredient_serving_units(ingredient_name, unit, amount) VALUES "
                + units.map(() => "(?, ?, ?)").join(', ');
            let unit_values = [];
            for (let idx = 0; idx < units.length; idx++) {
                unit_values = unit_values.concat([ing_name, units[idx], String(amounts[idx])]);
            }
            if (row === undefined) {
                let enter_ingredient_query = "INSERT INTO ingredient_servings(ingredient_name, calories, fat, carb, fiber, protein) VALUES (?,?,?,?,?,?)";
                db.serialize(() => {
                    db.run(enter_ingredient_query, [ing_name].concat(nutrients), function (err) {
                        if (err) {
                            return console.log(err.message);
                        }
                    })
                        .run(enter_units_query, unit_values, function (err) {
                        if (err) {
                            callback(err.message);
                            return console.log(err.message);
                        }
                        callback("");
                    });
                });
            }
            else {
                let update_query = "UPDATE ingredient_servings " +
                    "SET calories=?, fat=?, carb=?, fiber=?, protein=? " +
                    "WHERE ingredient_name=?;";
                let delete_query = "DELETE FROM ingredient_serving_units WHERE ingredient_name=?;";
                db.serialize(() => {
                    db.run(update_query, nutrients.concat([ing_name]), function (err) {
                        if (err) {
                            callback(err.message);
                            return console.log(err.message);
                        }
                    })
                        .run(delete_query, [ing_name])
                        .run(enter_units_query, unit_values, function (err) {
                        if (err) {
                            callback(err.message);
                            return console.log(err.message);
                        }
                        callback("");
                    });
                });
            }
        });
    },
    getIngredient: function (name, callback) {
        let get_nutr_query = "SELECT ingredient_name, calories, fat, carb, protein, fiber " +
            "FROM ingredient_servings " +
            "WHERE ingredient_name=?";
        db.get(get_nutr_query, [name], function (err, nutr_info) {
            if (err) {
                return console.log(err.message);
            }
            let get_unit_query = "SELECT unit, amount " +
                "FROM ingredient_serving_units " +
                "WHERE ingredient_name=?";
            db.all(get_unit_query, [name], function (err, units) {
                if (err) {
                    return console.log(err.message);
                }
                callback({ nutr_info: nutr_info, units: units });
            });
        });
    },
    getUserInfo: function (username, callback) {
        let check_user_query = "SELECT username, password " +
            "FROM users " +
            "WHERE username=?";
        db.all(check_user_query, username, function (err, res) {
            if (err) {
                return console.log(err.message);
            }
            callback(res);
        });
    },
    createUser: function (username, password, callback) {
        let create_user_query = "INSERT INTO users(username,password) VALUES (?,?)";
        db.run(create_user_query, [username, password], function (err) {
            if (err) {
                return console.log(err.message);
            }
            callback();
        });
    },
    getWeights: function (user, timespan, callback) {
        var select_week_of_weights = "SELECT weight, date(entry_datetime) as entry_date " +
            "FROM weights " +
            "WHERE username=? AND entry_date>date(?)" +
            "ORDER BY entry_date DESC";
        db.all(select_week_of_weights, [user, timespan], function (err, res) {
            if (err) {
                return console.log(err.message);
            }
            callback(res);
        });
    },
    enterWeight: function (username, weight, callback) {
        let enter_weight_query = "INSERT INTO weights(username, weight, entry_datetime) VALUES (?,?,datetime('now', 'localtime'))";
        db.run(enter_weight_query, [username, weight], function (err) {
            if (err) {
                return console.log(err.message);
            }
            callback(err);
        });
    },
    getAllRecipes: function (callback) {
        db.all("SELECT DISTINCT recipe_name FROM recipes ", function (err, res) {
            if (err) {
                return console.log(err.message);
            }
            callback(res);
        });
    },
    createOrUpdateRecipe: function (recipe_name, ingredients, callback) {
        let check_name_query = 'SELECT recipe_name FROM recipes where recipe_name=?';
        db.get(check_name_query, recipe_name, (err, row) => {
            if (err) {
                return console.log(err.message);
            }
            let enter_recipe_query = "INSERT INTO recipes (recipe_name, ingredient_name, ingredient_ratio) VALUES ";
            enter_recipe_query += ingredients.map(() => "(?, ?, ?)").join(', ');
            let values = [];
            ingredients.forEach((entry) => {
                values.push(recipe_name);
                values = values.concat(Object.values(entry));
            });
            db.serialize(() => {
                if (row !== undefined) {
                    let delete_recipe_query = "DELETE FROM recipes WHERE recipe_name=?";
                    db.run(delete_recipe_query, [recipe_name]);
                }
                db.run(enter_recipe_query, values, function (err) {
                    if (err) {
                        return console.log(err.message);
                    }
                    callback(err);
                });
            });
        });
    },
    getRecipeIngredients: function (recipe_name, callback) {
        let get_ingredients_query = "SELECT serv.*, units.amount, units.unit, recp.ingredient_ratio FROM ingredient_servings AS serv INNER JOIN (SELECT ingredient_name, ingredient_ratio FROM recipes WHERE recipe_name = ?) recp ON recp.ingredient_name=serv.ingredient_name INNER JOIN ingredient_serving_units AS units ON units.ingredient_name=serv.ingredient_name";
        db.all(get_ingredients_query, recipe_name, (err, res) => {
            if (err) {
                return console.log(err.message);
            }
            callback(res);
        });
    },
    //Note, "meals" means "complete food product", not "thing I ate", which it does on the frontend
    getAllMeals: function (callback) {
        db.all("SELECT meal_id, meal_name, total_weight FROM meals ", function (err, res) {
            if (err) {
                return console.log(err.message);
            }
            callback(res);
        });
    },
    createOrUpdateMeal: function (meal_name, meal_weight, nutrients, callback) {
        let check_name_query = 'SELECT meal_name FROM meals where meal_name=?';
        db.get(check_name_query, meal_name, (err, row) => {
            if (err) {
                return console.log(err.message);
            }
            if (row === undefined) {
                let enter_recipe_query = "INSERT INTO meals (meal_name, creation_date, total_weight, calories, fat, carb, fiber, protein) VALUES (?,datetime('now', 'localtime'),?,?,?,?,?,?)";
                let values = [meal_name, meal_weight.toString()].concat(nutrients);
                db.run(enter_recipe_query, values, function (err) {
                    if (err) {
                        return console.log(err.message);
                    }
                    callback(err);
                });
            }
            else {
                if (meal_weight > 0) {
                    let update_meal_query = "UPDATE meals " +
                        "SET total_weight=? " +
                        "WHERE meal_name=?";
                    db.run(update_meal_query, [meal_weight, meal_name], (err, row) => {
                        if (err) {
                            return console.log(err.message);
                        }
                        callback(err);
                    });
                }
                else {
                    let delete_query = "DELETE FROM meals WHERE meal_name=?";
                    db.run(delete_query, [meal_name]);
                }
            }
        });
    },
    getMeal: function (meal_id, callback) {
        let get_meal_query = "SELECT creation_date, meal_name, total_weight, calories, fat, carb, protein, fiber " +
            "FROM meals " +
            "WHERE meal_id=?";
        db.get(get_meal_query, meal_id, (err, row) => {
            if (err) {
                return console.log(err.message);
            }
            callback(row);
        });
    },
    enterCalEntry: function (username, nutrients, callback) {
        let enter_cal_entry_query = "INSERT INTO cal_entries (username, entry_datetime, calories, fat, carb, fiber, protein) VALUES (?,datetime('now', 'localtime'),?,?,?,?,?)";
        let values = [username];
        values = values.concat(nutrients);
        db.run(enter_cal_entry_query, values, function (err) {
            if (err) {
                return console.log(err.message);
            }
            callback(err);
        });
    },
    getCalEntries: function (username, timespan, callback) {
        let get_cal_entries_query = "SELECT entry_id, date(entry_datetime) as dt, time(entry_datetime) as tm, calories, fat, carb, fiber, protein " +
            "FROM cal_entries " +
            "WHERE username=? AND dt>date(?)" +
            "ORDER BY dt DESC";
        db.all(get_cal_entries_query, [username, timespan], function (err, res) {
            if (err) {
                return console.log(err.message);
            }
            callback(res);
        });
    },
    delCalEntry: function (cal_entry_id, callback) {
        //TODO it'd be good to do a check that the user making this call is the same one associated with the cal entry
        let del_cal_entry_query = "DELETE FROM cal_entries " +
            "WHERE entry_id=?";
        db.run(del_cal_entry_query, [cal_entry_id], function (err) {
            if (err) {
                callback(err);
                return console.log(err.message);
            }
            callback("");
        });
    },
    //TODO shift to using ingredient_id
    delIngredient: function (ingredient_name, callback) {
        let del_ing_query = "DELETE FROM ingredient_servings " +
            "WHERE ingredient_name=?";
        db.run(del_ing_query, [ingredient_name], function (err) {
            if (err) {
                callback(err);
                return console.log(err.message);
            }
            callback("");
        });
    },
    delMeal: function (meal_id, callback) {
        let del_meal_query = "DELETE FROM meals " +
            "WHERE meal_id=?";
        db.run(del_meal_query, [meal_id], function (err) {
            if (err) {
                callback(err);
                return console.log(err.message);
            }
            callback("");
        });
    },
    delRecipe: function (recipe_name, callback) {
        let del_recipe_query = "DELETE FROM recipes " +
            "WHERE recipe_name=?";
        db.run(del_recipe_query, [recipe_name], function (err) {
            if (err) {
                callback(err);
                return console.log(err.message);
            }
            callback("");
        });
    },
};
