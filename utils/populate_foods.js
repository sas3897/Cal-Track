'use strict';

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

var db = new sqlite3.Database('/media/external_1/Cal-Track/cal_track.db');

let foods = JSON.parse(fs.readFileSync('foods.json')).foods;

var insert_query = "INSERT INTO foods(food_name, unit, amount, calories, fat, carb, protein, fiber) " + 
        "VALUES ";

for(let food_idx in foods){
    let entry = foods[food_idx];
    let new_food = 
        `('${entry.name}', '${entry.unit}', ${entry.amount}, ${entry.calorie}, ${entry.fat}, ${entry.carb}, ${entry.protein}, ${entry.fiber})`; 

    insert_query += new_food + ((food_idx == (foods.length - 1)) ? "" : ",");
}

db.run(insert_query);

db.close()
