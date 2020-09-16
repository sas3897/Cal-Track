function total_up(id){
    let total = 0;
    $(`[id='${id}']`).each(function(){
        total += parseFloat($(this).text());
    });
    return total;
}

function update_totals(){
    let row_id = "total_row",
        cal_id = "calories_total",
        fat_id = "fat_total",
        carbs_id = "carbs_total",
        fiber_id = "fiber_total",
        protein_id = "protein_total";
    let maybeTotal = $("#" + row_id);

    let total_cal = total_up("calories"), 
        total_fat = total_up("fat"),
        total_carbs = total_up("carb"),
        total_fiber = total_up("fiber"),
        total_protein = total_up("protein");

    //Creation
    if(maybeTotal.length === 0){      
        $("#totals_container").append(
            `<tr class='totals' id='${row_id}'>` +
            "<td>Totals:</td>" +
            "<td>N/A</td>" +
            "<td>N/A</td>" +
            `<td id='${cal_id}'> ${total_cal}</td>` +
            `<td id='${fat_id}'> ${total_fat}</td>` +
            `<td id='${carbs_id}'> ${total_carbs}</td>` +
            `<td id='${fiber_id}'> ${total_fiber}</td>` +
            `<td id='${protein_id}'> ${total_protein}</td>` +
            "</tr>"
        );
    }
    //Update
    else{
        $("#" + cal_id).text(total_cal);
        $("#" + fat_id).text(total_fat);
        $("#" + carbs_id).text(total_carbs);
        $("#" + fiber_id).text(total_fiber);
        $("#" + protein_id).text(total_protein);
    }
}


function add_ingredient(nutrient_ids){
    //Add the ingredient to the list
    var ingredient_name = $('select[id=ingredients_list]').val();

    $.ajax({
        type: 'post',
        url: '/get_food',
        data: {food_name: ingredient_name},
        dataType: 'json'
    })
    .done(function(ingredient_info){
        var first_ing_entry = ingredient_info[0];
        var food_name = first_ing_entry.food_name;
        var food_id = first_ing_entry.food_id;
        var unit_amount_map = {};
        for(var idx in ingredient_info){
            let unit = ingredient_info[idx].unit;
            unit_amount_map[unit] = parseFloat(ingredient_info[idx].amount);
        }

        //Check if it already was added to the page
        //TODO add a "remove ingredient" button
        var maybeEntry = $("#" + food_id);
        if(maybeEntry.length === 0){
            $("#ingredients_container").append(
                `<tr id='${food_id}'>` +
                `<td id='ing_name'>${food_name}</td>` +
                "<td><select id='unit'></select></td>" +
                `<td><input id='amount' type='number' step='any' value='${first_ing_entry.amount}'></input></td>` +
                `<td id='${nutrient_ids[0]}'>${first_ing_entry.calories}</td>` +
                `<td id='${nutrient_ids[1]}'>${first_ing_entry.fat}</td>` +
                `<td id='${nutrient_ids[2]}'>${first_ing_entry.carb}</td>` +
                `<td id='${nutrient_ids[3]}'>${first_ing_entry.fiber}</td>` +
                `<td id='${nutrient_ids[4]}'>${first_ing_entry.protein}</td>` +
                `<input id='hid_prev_unit' type='hidden' value='${first_ing_entry.unit}'></input>` +
                "</tr>"
            );

            //No longer a maybe, in this case
            maybeEntry = $("#" + food_id);
            var units = maybeEntry.find("[id='unit']");

            for(var idx in ingredient_info){
                units.append(`<option>${ingredient_info[idx].unit}</option>`);
            }
            units.on('change', function(){
                //TODO just change this over to a map tracked within the JS, no hidden elements
                //The ratio between the current unit's serving size
                let prev_unit = maybeEntry.find("#hid_prev_unit");
                let curr_amount_ratio = parseFloat(maybeEntry.find("[id='amount']").val())/unit_amount_map[prev_unit.val()];
                let curr_amount = maybeEntry.find("#amount");
                curr_amount.val(unit_amount_map[units.val()] * curr_amount_ratio);
                prev_unit.val(this.value);

            });
            maybeEntry.find("#amount").on('change', function(){
                let curr_amount_ratio = parseFloat(maybeEntry.find("[id='amount']").val())/unit_amount_map[units.val()];
                nutrient_ids.forEach(function(id){
                    let nutrient = maybeEntry.find(`#${id}`);
                    nutrient.text(parseFloat(first_ing_entry[id])*curr_amount_ratio);
                })
                $("#ingredients_container").trigger('update');
            });
        }
        else{
            let curr_amount = maybeEntry.find("#amount");
            let unit = maybeEntry.find("[id='unit']").val();
            curr_amount.val(parseFloat(curr_amount.val()) + parseFloat(unit_amount_map[unit]));
            curr_amount.trigger('change');
        }
        $("#ingredients_container").trigger('update');
    });
}
