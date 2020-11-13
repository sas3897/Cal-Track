const sqlite3 = require('sqlite3').verbose(); 

let db = new sqlite3.Database('/media/external_1/Cal-Track/cal_track.db');

module.exports = {
    getAllIngredientNames: function(callback:any){
        db.all("SELECT DISTINCT ingredient_name FROM ingredient_servings", function(err:any, res:any){
            if(err){
                return console.log(err.message);
            }
            callback(res);
        });
    },
    enterIngredient: function(ing_name:string, nutrients:string[], units:string[], amounts:number[], callback:any){
        let enter_ingredient_query = 
            "INSERT INTO ingredient_servings(ingredient_name, calories, fat, carb, fiber, protein) VALUES (?,?,?,?,?,?)";
        db.run(enter_ingredient_query, [ing_name].concat(nutrients), function(err:any){
            if(err){
                return console.log(err.message);
            } 
            enter_ingredient_query = "INSERT INTO ingredient_serving_units(ingredient_name, unit, amount) VALUES ";
            enter_ingredient_query += units.map(() => "(?, ?, ?)").join(', '); 


            let values:string[] = [];
            for(let idx = 0;idx < units.length; idx++){
                values = values.concat([ing_name, units[idx], String(amounts[idx])]);
            }

            db.run(enter_ingredient_query, values, function(err:any){
                if(err){
                    callback(err.message);
                    return console.log(err.message);
                }   
                callback("");
            });
        });
    },
    getIngredient: function(name:string, callback:any){
        let get_nutr_query = 
            "SELECT ingredient_name, calories, fat, carb, protein, fiber " +
            "FROM ingredient_servings " +
            "WHERE ingredient_name=?";            
        db.get(get_nutr_query, [name], function(err:any, nutr_info:any){
            if(err){
                return console.log(err.message);
            } 
            let get_unit_query = 
                "SELECT unit, amount " + 
                "FROM ingredient_serving_units " +
                "WHERE ingredient_name=?";
            db.all(get_unit_query, [name], function(err:any, units:any){
                if(err){
                    return console.log(err.message);
                } 

                callback({nutr_info:nutr_info, units:units});
            });
        });
    },
    getUserInfo: function(username:string, callback:any){
        let check_user_query = 
            "SELECT username, password " +
            "FROM users " +
            "WHERE username=?";
        db.all(check_user_query, username, function(err:any, res:any){
            if(err){
                return console.log(err.message);
            }
            callback(res);
        });
    },
    createUser: function(username:string, password:string, callback:any){
        let create_user_query = 
            "INSERT INTO users(username,password) VALUES (?,?)";
        db.run(create_user_query, [username, password], 
            function(err:any){
                if(err){
                    return console.log(err.message);
                }

                callback();
        });
    },
    getWeights: function(user:string, timespan:string, callback:any){
        var select_week_of_weights = 
            "SELECT weight, date(entry_datetime) as entry_date " + 
            "FROM weights " + 
            "WHERE username=? AND entry_date>date(?)" + 
            "ORDER BY entry_date " + 
            "DESC";
        db.all(select_week_of_weights, [user, timespan], function(err:any, res:any){
            if(err){
                return console.log(err.message);
            }
            callback(res);     
        });
    },
    enterWeight: function(username:string, weight:number, callback:any){
        let enter_weight_query =
            "INSERT INTO weights(username, weight, entry_datetime) VALUES (?,?,datetime('now', 'localtime'))";
        db.run(enter_weight_query, [username, weight], function(err:any){
            if(err){
                return console.log(err.message);
            }

            callback();
        });
    },
    //Note, "meals" means "complete food product", not "thing I ate", which it does on the frontend
    getAllMeals: function(callback:any){
        db.all("SELECT meal_id, meal_name, total_weight FROM meals ", function(err:any, res:any){
            if(err){
                return console.log(err.message);
            }
            callback(res);
        });
    },
    getAllRecipes: function(callback:any){
        db.all("SELECT DISTINCT recipe_name FROM recipes ", function(err:any, res:any){
            if(err){
                return console.log(err.message);
            }
            callback(res);
        });
    },
    enterRecipe: function(recipe_name:string, ingredients:string[], succ_callback:any, dup_callback:any){
        let check_name_query = 'SELECT recipe_name FROM recipes where recipe_name=?';
        db.get(check_name_query, recipe_name, (err:any, row:any) => {
            if(err){
                return console.log(err.message);
            }   
            if(row === undefined){
                let enter_recipe_query = 
                    "INSERT INTO recipes (recipe_name, ingredient_name, ingredient_ratio) VALUES ";
                enter_recipe_query += ingredients.map(() => "(?, ?, ?)").join(', '); 
                let values:string[] = [];
                ingredients.forEach((entry) => {
                    values.push(recipe_name); 
                    values = values.concat(Object.values(entry));
                });
                db.run(enter_recipe_query, values, function(err:any){
                    if(err){
                        return console.log(err.message);
                    }

                    succ_callback();
                });
            }
            else{
                dup_callback();
            }
        }); 
    },
    getRecipeIngredients: function(recipe_name:string, callback:any){
        let get_ingredients_query = "SELECT serv.*, units.amount, units.unit, recp.ingredient_ratio FROM ingredient_servings AS serv INNER JOIN (SELECT ingredient_name, ingredient_ratio FROM recipes WHERE recipe_name = ?) recp ON recp.ingredient_name=serv.ingredient_name INNER JOIN ingredient_serving_units AS units ON units.ingredient_name=serv.ingredient_name";
        db.all(get_ingredients_query, recipe_name, (err:any, res:any) => {
            if(err){
                return console.log(err.message);
            }

            callback(res);
        });
    },
    enterMeal: function(meal_name:string, meal_weight:number, nutrients:string[], succ_callback:any, dup_callback:any){
        let check_name_query = 'SELECT meal_name FROM meals where meal_name=?';
        db.get(check_name_query, meal_name, (err:any, row:any) => {
            if(err){
                return console.log(err.message);
            }   
            if(row === undefined){
                let enter_recipe_query = 
                    "INSERT INTO meals (meal_name, creation_date, total_weight, calories, fat, carb, fiber, protein) VALUES (?,datetime('now', 'localtime'),?,?,?,?,?,?)";
                let values:string[] = [meal_name, meal_weight.toString()];
                values = values.concat(nutrients);
                db.run(enter_recipe_query, values, function(err:any){
                    if(err){
                        return console.log(err.message);
                    }

                    succ_callback();
                });
            }
            else{
                dup_callback();
            }
        }); 
    },
    getMeal: function(meal_id:number, callback:any){
        let get_meal_query = 
            "SELECT creation_date, total_weight, calories, fat, carb, protein, fiber " +
            "FROM meals " + 
            "WHERE meal_id=?";
        db.get(get_meal_query, meal_id, (err:any, row:any) => {
            if(err){
                return console.log(err.message);
            }   
            callback(row);
        });
    },
    enterCalEntry: function(username:string, nutrients:string[]){
        let enter_cal_entry_query = 
                "INSERT INTO cal_entries (username, entry_datetime, calories, fat, carb, fiber, protein) VALUES (?,datetime('now', 'localtime'),?,?,?,?,?)";
        let values:string[] = [username];
        values = values.concat(nutrients);
        db.run(enter_cal_entry_query, values, function(err:any){
            if(err){
                return console.log(err.message);
            }
        });
    },
    getLastWeekCalEntries: function(username:string, callback:any){
        let get_cal_entries_query = 
            "SELECT date(entry_datetime) as dt, time(entry_datetime) as tm, calories, fat, carb, fiber, protein " + 
            "FROM cal_entries " +
            "WHERE username=? AND entry_datetime BETWEEN datetime('now', 'localtime', '-6 days') AND datetime('now', 'localtime')";
        db.all(get_cal_entries_query, username, function(err:any, res:any){
            if(err){
                return console.log(err.message);
            }
            callback(res);
        });
    },
    enterMealCalEntry: function(username:string, meal_id:number, amnt_eaten:number, cal_vals:string[], meal_vals:string[]){
        let update_meal_query = 
            "UPDATE meals " + 
            "SET total_weight=?," + 
            "calories=?," + 
            "fat=?," + 
            "carb=?," + 
            "fiber=?," + 
            "protein=? " + 
            "WHERE meal_id = ?"
        let values:string[] = [amnt_eaten.toString()];
        values = values.concat(meal_vals);
        values.push(meal_id.toString());
        db.run(update_meal_query, values, function(err:any){
            if(err){
                console.log(err.message);
            }
            module.exports.enterCalEntry(username, cal_vals); 
        });
    }
}
