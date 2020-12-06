$(document).ready(function() {
    let navbar = $('#nav_bar_container');
    if(navbar != null){
        navbar.load('shared_views/nav_bar.html');
    }
});


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


function generate_ingredient(nutrient_ids, ing_name, nutr_info, units_map, ratio){
    //Check if it already was added to the page
    //TODO add a "remove ingredient" button
    let maybeEntry = $(`[id='${ing_name}']`);
    if(maybeEntry.length === 0){
        $("#ingredients_container").append(
            `<tr id='${ing_name}'>` +
                `<td id='ing_name'>${ing_name}</td>` +
                "<td><select id='unit'></select></td>" +
                `<td><input id='amount' type='number' step='any'></input></td>` +
                `<td id='${nutrient_ids[0]}'>${nutr_info.calories}</td>` +
                `<td id='${nutrient_ids[1]}'>${nutr_info.fat}</td>` +
                `<td id='${nutrient_ids[2]}'>${nutr_info.carb}</td>` +
                `<td id='${nutrient_ids[3]}'>${nutr_info.fiber}</td>` +
                `<td id='${nutrient_ids[4]}'>${nutr_info.protein}</td>` +
                `<input id='hid_ratio' type='hidden' value=1></input>` + 
            "</tr>"
        );

        //No longer a maybe, in this case
        maybeEntry = $(`[id='${ing_name}']`);
        let units = maybeEntry.find("#unit");
        let amount = maybeEntry.find("#amount");

        //The ratio between the current unit's serving size
        let curr_amount_ratio = ratio;
        units.on('change', function(){
            amount.val(units_map[units.val()] * curr_amount_ratio);
        });
        amount.on('change', function(){
            curr_amount_ratio = parseFloat(maybeEntry.find("[id='amount']").val())/units_map[units.val()];
            maybeEntry.find('#hid_ratio').val(curr_amount_ratio);
            nutrient_ids.forEach(function(id){
                let nutrient = maybeEntry.find(`#${id}`);
                nutrient.text(parseFloat(nutr_info[id]) * curr_amount_ratio);
            })
            $("#ingredients_container").trigger('update');
        });

        let first_unit = true;

        for(let unit of Object.keys(units_map)){
            if(first_unit){
                amount.val(units_map[unit] * ratio);
                first_unit=false;
            }
            units.append(`<option>${unit}</option>`);
        }

        if(ratio != 1){
            amount.trigger('change');
        }
    }
    else{
        let curr_amount = maybeEntry.find("#amount");
        let unit = maybeEntry.find("[id='unit']").val();
        curr_amount.val(parseFloat(curr_amount.val()) + units_map[unit]);
        curr_amount.trigger('change');
    }
    $("#ingredients_container").trigger('update');
}


function add_ingredient(nutrient_ids){
    //Add the ingredient to the list
    let ingredient_name = $('select[id=ingredients_list]').val();

    $.ajax({
        type: 'post',
        url: '/get_ingredient',
        data: {ingredient_name: ingredient_name},
        dataType: 'json'
    })
    .done(function(ingredient_info){
        let nutr_info = ingredient_info.nutr_info;
        let ingredient_name = nutr_info.ingredient_name;
        let unit_amount_map = {};
        for(let entry of ingredient_info.units){
            unit_amount_map[entry.unit] = parseFloat(entry.amount);
        }

        generate_ingredient(nutrient_ids, ingredient_name, nutr_info, unit_amount_map, 1); 
    });
}
