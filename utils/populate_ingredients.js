'use strict';

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const source_filepath = 'ingredients.json';

let db = new sqlite3.Database('/media/external_1/Cal-Track/cal_track.db');

let foods = JSON.parse(fs.readFileSync(source_filepath)).ingredients;

let serving_insert_query = "INSERT INTO ingredient_servings(ingredient_name, calories, fat, carb, protein, fiber) VALUES ";
let unit_insert_query = "INSERT INTO ingredient_serving_units(ingredient_name, unit, amount) VALUES "

for(let food_idx in foods){
    let entry = foods[food_idx];
    let new_food = 
        `('${entry.name}', ${entry.calorie}, ${entry.fat}, ${entry.carb}, ${entry.protein}, ${entry.fiber})`; 

    serving_insert_query += new_food + ((food_idx == (foods.length - 1)) ? "" : ",");
    for(let unit_pairing of entry.unit_amounts){
        unit_insert_query += `('${entry.name}', '${unit_pairing.unit}', ${unit_pairing.amount}),`;
    }

}

db.run(serving_insert_query);

unit_insert_query = unit_insert_query.substring(0, unit_insert_query.length - 1);
db.run(unit_insert_query, [], function(err){ if(err){console.log(err)}});

db.close()
