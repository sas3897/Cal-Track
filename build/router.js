"use strict";
//Import dependencies
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const sqlite = require("./db_adapter"); //Local file dependency
let server = express();
server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(express.static(path.join(__dirname, '../utils')));
server.set("view engine", "ejs");
//TODO it'd be better to make every url first check for the login and do that redirect, and if they're logged in take them to the page they wanted to go normally? (though doesn't this never resolve?)
//Home page
server.get("/", function (req, res) {
    if (is_logged_in(req)) {
        let today = new Date();
        let last_week = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 8)
            .toJSON().replace("T", " ").replace("Z", "");
        sqlite.getAllIngredientNames(function (ingredients_list) {
            sqlite.getAllRecipes(function (recipes_list) {
                res.render("index", {
                    ingredients: ingredients_list, recipes: recipes_list
                });
            });
        });
    }
    else {
        res.redirect("/login");
    }
});
server.post("/enter_weight", function (req, res) {
    if (is_logged_in(req)) {
        sqlite.enterWeight(req.cookies.username, req.body.weight, function (err) {
            if (err) {
                res.send({ status: "error" });
            }
            else {
                res.send({ status: "success" });
            }
        });
    }
    else {
        res.send({ status: "error" });
    }
});
server.all("/logout", function (req, res) {
    if (is_logged_in(req)) {
        res.clearCookie("username");
    }
    res.redirect("/");
});
//Login page
server.get("/login", function (req, res) {
    if (is_logged_in(req)) {
        res.redirect("/");
    }
    else {
        res.render("login");
    }
});
server.post("/login", function (req, res) {
    if (is_logged_in(req)) {
        res.redirect("/");
    }
    else {
        var user = req.body.user.toLowerCase();
        var pass = req.body.pass;
        sqlite.getUserInfo(user, function (userInfo) {
            //If there are no users by that username, tell them to try again
            if (userInfo.length === 0) {
                res.render("login", { warning_string: "User not found." });
                return;
            }
            if (userInfo[0].password === pass) {
                res.cookie("username", user);
                res.redirect("/");
            }
            else {
                res.render("login", { warning_string: "Incorrect password." });
            }
        });
    }
});
server.get("/login/create_account", function (req, res) {
    if (is_logged_in(req)) {
        res.redirect("/");
    }
    else {
        res.render("create_account");
    }
});
server.post("/login/create_account", function (req, res) {
    if (is_logged_in(req)) {
        res.redirect("/");
    }
    else {
        var user = req.body.user.toLowerCase();
        var pass = req.body.pass;
        sqlite.createUser(user, pass, function () {
            res.redirect("/login");
        });
    }
});
server.post("/add_ingredient", function (req, res) {
    sqlite.createOrUpdateIngredient(req.body.ingredient_name, req.body.nutrients, req.body.units, req.body.amounts, function (err_msg) {
        res.json({ err: err_msg });
    });
});
server.post("/add_recipe", function (req, res) {
    sqlite.createOrUpdateRecipe(req.body.recipe_name, req.body.ingredients, function (potentialErr) {
        //Success message
        res.json({ err: potentialErr });
    });
});
server.post("/add_meal", function (req, res) {
    sqlite.createOrUpdateMeal(req.body.meal_name, parseFloat(req.body.meal_weight), req.body.nutrients, function (potentialErr) {
        //Success message
        res.json({ err: potentialErr });
    });
});
server.post("/get_meal", function (req, res) {
    sqlite.getMeal(parseInt(req.body.meal_id), function (meal_info) {
        res.send(meal_info);
    });
});
server.post("/enter_cal_entry", function (req, res) {
    if (is_logged_in(req)) {
        sqlite.enterCalEntry(req.cookies.username, req.body.nutrients, function (err) {
            if (err) {
                res.send({ status: "error" });
            }
            else {
                res.send({ status: "success" });
            }
        });
    }
    else {
        res.redirect("/login");
    }
});
server.post("/enter_meal_cal_entry", function (req, res) {
    sqlite.enterMealCalEntry(req.cookies.username, parseInt(req.body.meal_id), parseFloat(req.body.amnt_left), req.body.cal_vals, req.body.meal_vals);
});
server.post("/get_ingredient", function (req, res) {
    sqlite.getIngredient(req.body.ingredient_name, function (ingredient_info) {
        res.send(ingredient_info);
    });
});
server.get("/get_ingredient_list", function (req, res) {
    sqlite.getAllIngredientNames(function (ingredients_list) {
        res.send(ingredients_list);
    });
});
server.get("/get_recipe_list", function (req, res) {
    sqlite.getAllRecipes(function (recipes_list) {
        res.send(recipes_list);
    });
});
server.post("/get_recipe_ingredients", function (req, res) {
    sqlite.getRecipeIngredients(req.body.recipe_name, function (recipe_ing_list) {
        res.send(recipe_ing_list);
    });
});
server.get("/get_meal_list", function (req, res) {
    sqlite.getAllMeals(function (meals_list) {
        res.send(meals_list);
    });
});
server.get("/manage_values", function (req, res) {
    res.render("manage_values");
});
server.post("/get_weights", function (req, res) {
    if (is_logged_in(req)) {
        sqlite.getWeights(req.cookies.username, req.body.timespan, function (weights_list) {
            res.send(weights_list);
        });
    }
    else {
        res.redirect("/login");
    }
});
server.post("/get_calorie_entries", function (req, res) {
    if (is_logged_in(req)) {
        sqlite.getCalEntries(req.cookies.username, req.body.timespan, function (calories_list) {
            res.send(calories_list);
        });
    }
    else {
        res.redirect("/login");
    }
});
server.post("/del_calorie_entry", function (req, res) {
    if (is_logged_in(req)) {
        sqlite.delCalEntry(req.body.entry_id, function (err) {
            if (err) {
                res.send({ status: "error" });
            }
            else {
                res.send({ status: "success" });
            }
        });
    }
    else {
        res.redirect("/login");
    }
});
function is_logged_in(req) {
    //Is there a username, or no?
    return req.cookies.username !== undefined;
}
server.listen(8080, "192.168.1.230", function () {
    console.log("Cal-Track is now running.");
});
