//Import dependencies
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var sqlite = require("./db_adapter"); //Local file dependency

var server = express();
server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));
server.use(express.static(path.join(__dirname, '../utils')));
server.set("view engine", "ejs");

//TODO it'd be better to make every url first check for the login and do that redirect, and if they're logged in take them to the page they wanted to go normally? (though doesn't this never resolve?)


//Home page
server.get("/", function(req:any, res:any) {
    if(is_logged_in(req)){
        sqlite.getWeights(req.cookies.username, function(weights_list:any){
            sqlite.getLastWeekCalEntries(req.cookies.username, function(cal_entries_list:any){
                res.render("index", {weights:weights_list, cal_entries:cal_entries_list});
            });
        });
    }
    else{
        res.redirect("/login");
    }
});

server.post("/", function(req:any, res:any){
   if(is_logged_in(req)){
       sqlite.enterWeight(req.cookies.username, req.body.weight, function(){
           res.redirect("/");
       });
   }
   else{
       res.redirect("/login");
   } 
});

server.all("/logout", function(req:any,res:any){
    if(is_logged_in(req)){ 
        res.clearCookie("username");
    }
    res.redirect("/");
});

//Login page
server.get("/login", function(req:any, res:any){
    if(is_logged_in(req)){
        res.redirect("/");
    }
    else{
        res.render("login");
    }
});
server.post("/login", function(req:any, res:any){
    if(is_logged_in(req)){
        res.redirect("/");
    }
    else{
        var user = req.body.user.toLowerCase();
        var pass = req.body.pass;
        sqlite.getUserInfo(user,
            function(userInfo:any){
                //If there are no users by that username, tell them to try again
                if(userInfo.length === 0){
                    res.render("login", {warning_string:"User not found."})
                    return;
                }
                
                if(userInfo[0].password === pass){
                    res.cookie("username", user);
                    res.redirect("/");
                }
                else{
                    res.render("login", {warning_string:"Incorrect password."});
                }
            }
        );
    }
});

server.get("/login/create_account", function(req:any, res:any){
    if(is_logged_in(req)){
        res.redirect("/");
    }
    else{
        res.render("create_account");
    }
});

server.post("/login/create_account", function(req:any, res:any){
    if(is_logged_in(req)){
        res.redirect("/");
    }
    else{
        var user = req.body.user.toLowerCase();
        var pass = req.body.pass;
        sqlite.createUser(user, pass, 
            function(){
                res.redirect("/login");
            }                
        );
    }
});

//Display the ad-hoc meal page
server.get("/adhoc", function(req:any, res:any){
    if(is_logged_in(req)){
        sqlite.getAllFoods(function (foods_list:string[]){   
            sqlite.getAllRecipes(function(recipes_list:string[]){
                res.render("add_meal_adhoc", {foods: foods_list, recipes: recipes_list});
            });
        });
    }
    else{
        res.redirect("/login");
    }
});


server.get("/existing", function(req:any, res:any){
    if(is_logged_in(req)){
        sqlite.getAllMeals(function(meals_list:any){
            res.render("add_meal_existing", {existing: meals_list});
        });
    }
    else{
        res.redirect("/login");
    }
});

server.get("/add_food", function(req:any, res:any){
    res.render("add_food");
});

server.post("/add_food", function(req:any, res:any){
    let amount = parseFloat(req.body.ing_size);
    let calories = parseFloat(req.body.ing_calorie);
    let fat = parseFloat(req.body.ing_fat);
    let carb = parseFloat(req.body.ing_carb);
    let protein = parseFloat(req.body.ing_protein);
    let fiber = parseFloat(req.body.ing_fiber);

    sqlite.enterFood(req.body.ing_name, req.body.ing_unit, amount, calories, fat, carb, protein, fiber, function(){
        res.redirect("/add_food");
    });   
});

server.get("/add_recipe", function(req:any, res:any){
    sqlite.getAllFoods(function (foods_list:string[]){   
        res.render("add_recipe", {foods: foods_list});
    });
});

server.post("/add_recipe", function(req:any, res:any){
    sqlite.enterRecipe(req.body.recipe_name, req.body.foods, 
    function(){
        //Success message
        res.json({err:""});
    }, 
    function(){ 
        res.json({err:"A recipe with that name already exists."});
    });
});

server.post("/add_meal", function(req:any, res:any){
    sqlite.enterMeal(req.body.meal_name, parseFloat(req.body.meal_weight), req.body.nutrients, 
        function(){
            //Success message
            res.json({err:""});
        }, 
        function(){ 
            res.json({err:"A recipe with that name already exists."});
        }
    );
});

server.post("/get_meal", function(req:any, res:any){
    sqlite.getMeal(parseInt(req.body.meal_id), 
        function(meal_info:string[]){
            res.send(meal_info);
        }
    );
});

server.post("/enter_cal_entry", function(req:any, res:any){
    sqlite.enterCalEntry(req.cookies.username, req.body.nutrients);
});

server.post("/enter_meal_cal_entry", function(req:any, res:any){
    sqlite.enterMealCalEntry(req.cookies.username, 
                             parseInt(req.body.meal_id), 
                             parseFloat(req.body.amnt_left), 
                             req.body.cal_vals,
                             req.body.meal_vals
                            );
});

server.post("/get_food", function(req:any, res:any){
    sqlite.getFood(req.body.food_name, function(food_info:string[]){
        res.send(food_info);
    });
});

server.post("/get_recipe_ingredients", function(req:any, res:any){
    sqlite.getRecipeIngredients(req.body.recipe_name, function(recipe_ing_list:string[]){
        res.send(recipe_ing_list);
    });
});



function is_logged_in(req:any){
    //Is there a username, or no?
    return req.cookies.username !== undefined;
}


server.listen(8080, "192.168.1.230", 
  function(){
      console.log("Cal-Track is now running.");
});
