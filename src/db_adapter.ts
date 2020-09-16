const sqlite3 = require('sqlite3').verbose(); 
var db = new sqlite3.Database('/media/external_1/Cal-Track/cal_track.db');

module.exports = {
    getAllFoods: function(callback:any){
        db.all("SELECT DISTINCT food_name FROM foods", function(err:any, res:any){
            if(err){
                return console.log(err.message);
            }
            callback(res);
        });
    },
    getUserInfo: function(username:string, callback:any){
        let check_user_query = 
            "SELECT username, password " +
            "FROM users " +
            "WHERE username = (?)";
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
    getWeights: function(user:string, callback:any){
        var select_week_of_weights = 
            "SELECT weight, date(entry_datetime) as date " + 
            "FROM weight " + 
            "WHERE username=(?) " + 
            "ORDER BY date(entry_datetime) " + 
            "DESC LIMIT 7";
        db.all(select_week_of_weights, user, function(err:any, res:any){
            if(err){
                return console.log(err.message);
            }
            callback(res);     
        });
    },
    enterWeight: function(username:string, weight:number, callback:any){
        let enter_weight_query =
            "INSERT INTO weight(username, weight, entry_datetime) VALUES (?,?,datetime('now', 'localtime'))";
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
    enterFood: function(name:string, unit:string, amount:number, calories:number, fat:number, carb:number, protein:number, fiber:number, callback:any){
        let enter_food_query = 
            "INSERT INTO foods(food_name, unit, amount, calories, fat, carb, protein, fiber) VALUES (?,?,?,?,?,?,?,?)";
        db.run(enter_food_query, [name, unit, amount, calories, fat, carb, protein, fiber], function(err:any){
            if(err){
                return console.log(err.message);
            }   

            callback();
        });
    },
    getFood: function(name:string, callback:any){
        let get_food_query = 
            "SELECT food_id, food_name, unit, amount, calories, fat, carb, protein, fiber " +
            "FROM foods " +
            "WHERE food_name=?";            
        db.all(get_food_query, [name], function(err:any, res:any){
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
                    "INSERT INTO recipes (recipe_name, ingredient_id, ingredient_name, ingredient_unit, ingredient_amount) VALUES ";
                enter_recipe_query += ingredients.map(() => "(?, ?, ?, ?, ?)").join(', '); 
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
        let get_ingredients_query = "SELECT foods.*, recp.ingredient_amount, recp.ingredient_unit FROM foods INNER JOIN (SELECT ingredient_name, ingredient_amount, ingredient_unit FROM recipes WHERE recipe_name = ?) recp ON recp.ingredient_name=foods.food_name";
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
                "INSERT INTO cal_entry (username, entry_datetime, calories, fat, carb, fiber, protein) VALUES (?,datetime('now', 'localtime'),?,?,?,?,?)";
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
            "SELECT entry_datetime, calories, fat, carb, fiber, protein " + 
            "FROM cal_entry " +
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
