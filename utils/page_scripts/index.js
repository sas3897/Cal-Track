$(document).ready(function(){
    const nutrient_ids = ["calories", "fat", "carb", "fiber", "protein"]

    const cal_header = '<div class="cal_header">' + 
            '<div class="cal_row">' + 
                '<div class="cal_cell_head">Time</div>' +
                '<div class="cal_cell_head">Calories</div>' +
                '<div class="cal_cell_head">Fat</div>' +
                '<div class="cal_cell_head">Carbs</div>' +
                '<div class="cal_cell_head">Fiber</div>' +
                '<div class="cal_cell_head">Protein</div>' +
            '</div>' +
        '</div>';
    let timespan_options = $("div[id='timespan_options'] input[name='timespan']");
    let prev_timespan = '';
    let starting_option = $("div[id='timespan_options'] input[value='week']");
    let weight_input = $('#weight_input');

    //Add the ingredient to the list
    $("#add_ingredient_btn").on('click', function(e){
        add_ingredient(nutrient_ids);
    });
    

    $("#ingredients_container").on('update', function(){
        update_totals();
    });

    $("#add_recipe_ings_btn").on('click', function(e){
        var recipe_name = $('select[id=recipes_list]').val();

        $.ajax({
            type: 'post',
            url: '/get_recipe_ingredients',
            data: {recipe_name: recipe_name},
            dataType: 'json'
        })
        .done(function(recipe_info){
            let ing_ratio_map = {};
            let ing_nutr_map = {};
            let ing_unit_map = {};
            for(let info_obj of recipe_info){
                let ing_name = info_obj.ingredient_name;
                //If it's the first time we've encountered this ingredient
                if(!(ing_name in ing_ratio_map)){
                    ing_ratio_map[ing_name] = info_obj.ingredient_ratio;
                    ing_nutr_map[ing_name] = {
                        'calories': info_obj.calories,
                        'fat': info_obj.fat,
                        'carb': info_obj.carb,
                        'fiber': info_obj.fiber,
                        'protein': info_obj.protein
                    }
                    ing_unit_map[ing_name] = {[info_obj.unit]: (info_obj.amount)};
                }
                else{
                    ing_unit_map[ing_name][info_obj.unit] = info_obj.amount;
                }
            }

            for(let ing_name of Object.keys(ing_ratio_map)){
                generate_ingredient(nutrient_ids, ing_name, 
                    ing_nutr_map[ing_name], ing_unit_map[ing_name], 
                    ing_ratio_map[ing_name]); 
            }
        });
    });

    function getNutrientTotals(){
        let ingredient_rows = $("#ingredients_container tr");
        //There's always a header row we have to ignore
        //TODO replace this with a more elegant error message box
        if(ingredient_rows.length <= 1){
            alert("You need to have at least one ingredient!");
            return;
        }
        
        let nutrients_list = [
            $("#calories_total").text(),
            $("#fat_total").text(),
            $("#carbs_total").text(),
            $("#fiber_total").text(),
            $("#protein_total").text()
        ]

        return nutrients_list;
    }

    $("#enter_meal_btn").on('click', function(evt){
        let meal_name = $("#meal_name_input").val(); 
        let meal_weight = $("#meal_weight_input").val();
        //TODO replace this with a more elegant error message box
        if(meal_name == "" || meal_weight == ""){
            alert("You must provide a name and weight!");
            return;
        }
        
        $.ajax({
            type: 'post',
            url: '/add_meal',
            data: {
                meal_name: meal_name, 
                meal_weight: parseFloat(meal_weight), 
                nutrients: getNutrientTotals()
            },
            dataType: 'json'
        })
        .done(function(maybeError){
            if(maybeError.err != ""){
                let warning_container = $("#warning_container");
                warning_container.text(maybeError.err);
                warning_container.show();
            }
            else{
                $("#warning_container").hide();
            }
        });

    });

    $("#one_off_btn").on('click', function(e){
        $.ajax({
            type: 'post',
            url: '/enter_cal_entry',
            data: {nutrients: getNutrientTotals()},
            dataType: 'json'
        })
        .done(function(statusMsg){
            if(statusMsg.status != "error"){
                prev_timespan = '';
                $("input[name='timespan']:checked").trigger('change');
            }
        });
    });

    $("#weight_submit_btn").on('click', function(e){
        let weight_val = weight_input.val();
        weight_input.val("");  //Clear out the input

        if(weight_val != ""){
            $.ajax({
                type: 'post',
                url: '/enter_weight',
                data: {weight: weight_val},
                dataType: 'json'
            })
            .done(function(statusMsg){
                if(statusMsg.status != "error"){
                    prev_timespan = '';
                    $("input[name='timespan']:checked").trigger('change');
                }
            });
        }
        else{
            alert("Please enter a weight."); //TODO replace with an error div
        }
    });

    
    timespan_options.on('change', function(evt){
        let timespan_val = $(this).val();
        let today = new Date();
        let timespan_list = ["week", "month", "year"];
        let timespan_date;

        switch(timespan_val){
            case "week":
                //Eight days rather than seven because otherwise entries exactly one week ago are removed
                timespan_date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 8);
                break;
            case "month":
                //TODO Breaks in Jan?
                timespan_date = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate() - 1);
                break;
            case "year":
                timespan_date = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate() - 1);
                break;
        }

        //Cal-entries and weights
        if(timespan_list.indexOf(timespan_val) < timespan_list.indexOf(prev_timespan)){
            trim_list(timespan_date, "div[class='cal_body'] div[class*='cal_date_head']", "div[class='cal_body']");
            trim_list(timespan_date, "div[id='weights_list'] strong", "li");
        }
        else{
            get_cal_entries_for_timespan(timespan_date);
            get_weights_for_timespan(timespan_date);
        }
        prev_timespan = timespan_val; 
    });

    function get_cal_entries_for_timespan(timespan_val){
        let str_timespan = timespan_val.toJSON().replace("T", " ").replace("Z", "");
        $.ajax({
            type: 'post',
            url: '/get_calorie_entries',
            data: {timespan: str_timespan},
            dataType: 'json'
        })
        .done(function(cal_entries_list){
            let cal_entries_table = $("div[id='cal_entries_table']");
            let prev_date = "";
            let new_list_html = "";
            let nutrients_list = {'calories': 0, 'fat': 0, 'carb': 0, 'fiber': 0, 'protein': 0};

            for(let entry of cal_entries_list){
                if(entry.dt != prev_date){
                    if(prev_date != ""){
                        new_list_html += `<div class='totals cal_row'>` + 
                            `<div class='cal_cell_first'>Total:</div>` +
                            `<div class='cal_cell'>${nutrients_list.calories}</div>` +
                            `<div class='cal_cell'>${nutrients_list.fat}</div>` +
                            `<div class='cal_cell'>${nutrients_list.carb}</div>` +
                            `<div class='cal_cell'>${nutrients_list.fiber}</div>` +
                            `<div class='cal_cell'>${nutrients_list.protein}</div>` +
                            `</div></div>`;
                    }
                    new_list_html += `<div class='cal_body'><div class='cal_row'><div class='cal_date_head cal_cell'>${entry.dt}</div></div>`;
                    
                    prev_date = entry.dt;
                    nutrients_list = {'calories': 0, 'fat': 0, 'carb': 0, 'fiber': 0, 'protein': 0};
                }
                new_list_html += `<div class='cal_row'>` + 
                    `<div class='cal_cell_first'>${entry.tm}</div>` +
                    `<div class='cal_cell'>${entry.calories}</div>` +
                    `<div class='cal_cell'>${entry.fat}</div>` +
                    `<div class='cal_cell'>${entry.carb}</div>` +
                    `<div class='cal_cell'>${entry.fiber}</div>` +
                    `<div class='cal_cell'>${entry.protein}</div>` +
                    `</div>`;

                nutrients_list['calories'] += entry.calories;
                nutrients_list['fat'] += entry.fat;
                nutrients_list['carb'] += entry.carb;
                nutrients_list['fiber'] += entry.fiber;
                nutrients_list['protein'] += entry.protein;
            }
            new_list_html += `<div class='totals cal_row'>` + 
                `<div class='cal_cell_first'>Total:</div>` +
                `<div class='cal_cell'>${nutrients_list.calories}</div>` +
                `<div class='cal_cell'>${nutrients_list.fat}</div>` +
                `<div class='cal_cell'>${nutrients_list.carb}</div>` +
                `<div class='cal_cell'>${nutrients_list.fiber}</div>` +
                `<div class='cal_cell'>${nutrients_list.protein}</div>` +
                `</div></div>`;

            cal_entries_table.html(cal_header + new_list_html);
        });
    }

    function get_weights_for_timespan(timespan_val){
        //TODO it'd be nice if there was a fraction of a second of "loading wheel"
        let str_timespan = timespan_val.toJSON().replace("T", " ").replace("Z", "");
        $.ajax({
            type: 'post',
            url: '/get_weights',
            data: {timespan: str_timespan},
            dataType: 'json'
        })
        .done(function(weights_list){
            let weights_ele_list = $("div[id='weights_list']");
            let new_list_html = "<ul>"

            for(let entry of weights_list){
                new_list_html += `<li><strong>${entry.entry_date}</strong>: ${entry.weight} lb.</li>`
            }
            new_list_html += "</ul>"
            weights_ele_list.html(new_list_html);
        });
    }

    function trim_list(date, ele_loc, parent_loc){
        //This gets just the date portion
        $(ele_loc).each(function(){
                let entry_date = new Date($(this).text());
                if(entry_date < date){
                    //The cal-body div
                    $(this).closest(parent_loc).remove();
                }
            });
    }

    starting_option.prop("checked", true);
    starting_option.trigger('change');
});
