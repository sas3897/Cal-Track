$(document).ready(function(){
    let template_picker = $("select[id='template_picker']");
    let template_container = $("div[id='template_container']");

    template_picker.on("change", function(){
        //Load the view for the given type (ingredient, recipe, etc.)
        switch($(this).val()){
            case "Ingredient":
                template_container.html(load_ing_template());
                load_ing_scripts();
                break;
            case "Meal":
                template_container.html(load_meal_template());
                load_meal_scripts();
                break;
            case "Recipe":
                template_container.html(load_recipe_template());
                load_recipe_scripts();
                break;
            default:
                console.error("Option chosen does not have an associated template!");
        }
    });

    //Ingredients sections
    function load_ing_template(){
        return '<div class="ing_form" id="ing_form">' +
            '<div class="lone-input" id="existing_container">' +
                '<span style="margin-right:16px;" >Ingredients</span>' +
            '</div>' + 

            '<div id="name_container">' +
                '<label class="lone-input" for="ing_name">Name:</label>' +
                '<input class="lone-input" id="ing_name" name="ing_name">' +
            '</div>' +

            '<div class="lone-input" id="servings_container">' +
                '<span>Servings</span>' +
            '</div>' + 

            '<label class="lone-input" for="ing_calorie">Calories:</label>' +
            '<input class="lone-input" type="number" step="any" min="0" id="ing_calorie" name="ing_calorie">' +

            '<label class="lone-input" for="ing_fat">Fat:</label>' +
            '<input class="lone-input" type="number" step="any" min="0" id="ing_fat" name="ing_fat">' +

            '<label class="lone-input" for="ing_carb">Carb:</label>' +
            '<input class="lone-input" type="number" step="any" min="0" id="ing_carb" name="ing_carb">' +

            '<label class="lone-input" for="ing_fiber">Fiber:</label>' +
            '<input class="lone-input" type="number" step="any" min="0" id="ing_fiber" name="ing_fiber">' +

            '<label class="lone-input" for="ing_protein">Protein:</label>' +
            '<input class="lone-input" type="number" step="any" min="0" id="ing_protein" name="ing_protein">' +

            '<input class="lone-input" id="submit_btn" type="button" value="Save">' +
        '</div>';
    }

    function load_ing_scripts(){
        let units_list = ["g", "tbsp", "tsp", "cup", "mL", "oz"];
        let used_units_list = [];
        let existing_container = $("div[id='existing_container']");

        function add_serving_pair(){ 
            let serv_container = $("div[id='servings_container']");
            let num_pairings = serv_container.find("button").length;

            let remaining_units = units_list.filter( ele => !used_units_list.includes(ele));
            let unit_input = `<select style="width:6.5rem" id='unit_${num_pairings}'><option value='none'>Select unit</option>`;
            for(let unit of remaining_units){
                unit_input += `<option value=${unit}>${unit}</option>`;
            }
            unit_input += "</select>";
            
            let amount_input = `<input id='amount_${num_pairings}' step="any" type="number" min="0" placeholder='10'></input>`;
            let serv_add_btn = `<button id='add_serving_btn' type='button' class='btn btn-sm btn-primary'>Add</button>`;

            let serv_pairing = `<div class="ing_form"> ${unit_input}${amount_input}${serv_add_btn}</div>`;

            serv_container.append(serv_pairing);

            $("[id='add_serving_btn']").on("click", (e) => {
                if(serv_container.children().length > units_list.length){
                    return;
                }
                let $this = $(e.target);
                $this.off("click");
                $this.text("Del");
                $this.attr('id', '');
                $this.on("click", () => {
                    let select = $this.parent().find("select"); 
                    let select_idx = used_units_list.indexOf(select.val()); 
                    used_units_list.splice(select_idx, 1);
                    console.log("is it this?");
                    select.val("none");
                    select.trigger("change");

                    $this.parent().remove() 
                });

                add_serving_pair();
            });

            $(`[id='unit_${num_pairings}']`).on("change", (e) => {
                used_units_list = []
                let unit_selects = $("select[id^='unit']");
                unit_selects.each( function(){
                    let select_val = $(this).val();
                    if(select_val != "none"){
                        used_units_list.push(select_val);
                    }
                });

                unit_selects.each( function(){
                    $(this).find("option:not(:selected)[value!='none']").remove();

                    let remaining_units = units_list.filter( ele => !used_units_list.includes(ele));
                    for(let unit of remaining_units){
                        $(this).append(`<option value=${unit}>${unit}</option>`);
                    }
                });
            });
        }

        $.ajax({
            type: 'get',
            url: "get_ingredient_list",
            dataType: 'json'
        })
        .done(function(ingredients_list){
            let select_id = "existing_select"
            let ing_select = `<select id='${select_id}'><option value='none'>[New Ingredient]</option>`;
            for(let ing_obj of ingredients_list){
                let ing_name = ing_obj.ingredient_name;
                ing_select += `<option value='${ing_name}'>${ing_name}</option>`;
            }
            ing_select += "</select>";

            existing_container.append(ing_select);

            $(`select[id='${select_id}']`).on("change", function(){
                let name_container = $("div[id='name_container']");
                let ing = $(this).val();

                $("div[id='servings_container']").html("<span>Servings</span>");
                if(ing == "none"){
                    name_container.show();
                    
                    $("input[id^='ing']").val("");
                    add_serving_pair();
                }
                else{
                    name_container.hide();
                    $.ajax({
                        type: 'post',
                        url: '/get_ingredient',
                        data: {ingredient_name: ing},
                        dataType: 'json',

                    })
                    .done(function(ing_info){
                        used_units_list = [];
                        $("#ing_name").val(ing);

                        let nutr_info = ing_info.nutr_info;
                        $("#ing_calorie").val(nutr_info.calories);
                        $("#ing_fat").val(nutr_info.fat);
                        $("#ing_carb").val(nutr_info.carb);
                        $("#ing_fiber").val(nutr_info.fiber);
                        $("#ing_protein").val(nutr_info.protein);

                        for(let idx in ing_info.units){
                            let serv_pair = ing_info.units[idx];
                            if(parseInt(idx) > 0){
                                $("[id='add_serving_btn']").trigger('click');
                            }
                            else{
                                add_serving_pair();
                            }
                            console.log(serv_pair.unit);
                            $(`select[id='unit_${idx}']`).val(serv_pair.unit)
                                .trigger("change");
                            $(`input[id='amount_${idx}']`).val(serv_pair.amount);
                        }
                    });
                }
            });
        });


        //Init serving pair
        add_serving_pair();
        $("#submit_btn").on("click", function(e){
            let nutrient_info = [
                $("#ing_calorie").val(),
                $("#ing_fat").val(),
                $("#ing_carb").val(),
                $("#ing_fiber").val(),
                $("#ing_protein").val()
            ];

            let units = $("select[id^='unit'] option:selected[value!='none']")
                        .map(function(){return this.value})
                        .get();

            let amounts = $("input[id^='amount']")
                        .map(function(){return parseFloat(this.value)})
                        .get();
            $.ajax({
                    type: 'post',
                    url: '/add_ingredient',
                    data: {
                        ingredient_name: $("#ing_name").val(),  
                        nutrients: nutrient_info,
                        units : units,
                        amounts : amounts
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
    }

    //Meal section
    function load_meal_template(){
        return '<div>' + 
            '<div style="float: left; display: none;" class="alert alert-danger" id="warning_container"></div>' +

            '<div class="lone-input" style="margin-bottom:16px" id="existing_container">' +
                '<span style="margin-right:16px;">Meals</span>' +
            '</div>' + 

            '<div id="ingredients_options_container">' +
                '<div style="width=100%">If the ingredient has already been added, its amount will increase by one serving size.</div>' +
                '<select id="ingredients_list">' +
                '</select>' +
                '<input id="add_ingredient_btn" type="button" value="Add Ingredient">' +
            '</div>' +
            '<div>' +
                '<table>' +
                    '<tbody id="ingredients_container">' +
                        '<tr>' +
                            '<th>Name</th>' +
                            '<th>Unit</th>' + 
                            '<th>Amount</th>' + 
                            '<th>Calories</th>' +
                            '<th>Fat</th>' +
                            '<th>Carbs</th>' +
                            '<th>Fiber</th>' +
                            '<th>Protein</th>' +
                        '</tr>' +
                    '</tbody>' + 
                    '<tfoot id="totals_container"></tfoot>' +
                '</table>' +
            '</div>' +

            '<div id="submit_container>' + 
                '<div style="width:100%">Any ingredients with amount 0 will not be included.</div>' +
                '<div id="name_container">' + 
                    '<label class="lone-input" for="meal_name_input">Name:</label>' +
                    '<input class="lone-input" id="meal_name_input"></input>' +
                '</div>' + 

                '<div>' +
                    '<label class="lone-input" for="meal_weight_input">Weight:</label>' +
                    '<input class="lone-input" type="number" id="meal_weight_input"></input>' +
                '</div>' +
                '<input type="button" id="submit_btn" value="Save"></input>' +
            '</div>' +
        '</div>';
    }

    function load_meal_scripts(){
        let existing_container = $("div[id='existing_container']");
        let ingredients_container = $("tbody[id='ingredients_container']"); 
        let nutrient_ids = ["calories", "fat", "carb", "fiber", "protein"];
        let meal_name_input = $("#meal_name_input");

        $.ajax({
            type: 'get',
            url: "get_ingredient_list",
            dataType: 'json'
        })
        .done(function(ing_list){
            let ing_options = "";
            for(let ing_obj of ing_list){
                let ing_name = ing_obj.ingredient_name;
                ing_options += `<option value='${ing_name}'>${ing_name}</option>`;
            }
            $("select[id='ingredients_list']").html(ing_options);
        });

        $.ajax({
            type: 'get',
            url: "get_meal_list",
            dataType: 'json'
        })
        .done(function(meal_list){
            let select_id = "existing_select";
            let meal_select = `<select id='${select_id}'><option value='none'>[New Meal]</option>`;
            for(let meal_obj of meal_list){
                meal_select += `<option value='${meal_obj.meal_id}'>${meal_obj.meal_name}</option>`;
            }
            meal_select += "</select>";

            existing_container.append(meal_select);

            $(`select[id='${select_id}']`).on("change", function(){
                let name_container = $("div[id='name_container']");
                let ing_options_container = $("div[id='ingredients_options_container']");
                let meal = $(this).val();
                //TODO replace with a better div-based solution
                //Clear out the container in anticipation of the new inputs
                ingredients_container.html(
                    '<tr>' +
                        '<th>Name</th>' +
                        '<th>Unit</th>' + 
                        '<th>Amount</th>' + 
                        '<th>Calories</th>' +
                        '<th>Fat</th>' +
                        '<th>Carbs</th>' +
                        '<th>Fiber</th>' +
                        '<th>Protein</th>' +
                    '</tr>' 
                )
                if(meal == "none"){
                    meal_name_input.val("");
                    name_container.show();
                    ing_options_container.show();
                    $("#meal_weight_input").val("")
                    $("#calories_total").text(0);
                    $("#fat_total").text(0);
                    $("#carbs_total").text(0);
                    $("#fiber_total").text(0);
                    $("#protein_total").text(0);
                }
                else{
                    name_container.hide();
                    ing_options_container.hide();
                    $.ajax({
                        type: 'post',
                        url: '/get_meal',
                        data: {meal_id: meal},
                        dataType: 'json',

                    })
                    .done(function(meal_info){
                        let total_weight = meal_info.total_weight;
                        meal_name_input.val(meal_info.meal_name);
                        $("#meal_weight_input").val(total_weight)
                        $("#calories_total").text((meal_info.calories * total_weight).toFixed(2));
                        $("#fat_total").text((meal_info.fat * total_weight).toFixed(2));
                        $("#carbs_total").text((meal_info.carb * total_weight).toFixed(2));
                        $("#fiber_total").text((meal_info.fiber * total_weight).toFixed(2));
                        $("#protein_total").text((meal_info.protein * total_weight).toFixed(2));
                    });
                }
            });

            update_totals();
        });

        //Add the ingredient to the list
        $("#add_ingredient_btn").on('click', function(e){
            add_ingredient(nutrient_ids);
        });
        

        ingredients_container.on('update', function(){
            update_totals();
        });

        $("#submit_btn").on('click', function(e){
            let meal_name = $("#meal_name_input").val(); 
            let meal_weight = $("#meal_weight_input").val();
            //TODO replace this with a more elegant error message box
            if(meal_name == "" || meal_weight == ""){
                alert("You must provide a name and weight!");
                return;
            }
            meal_weight = parseFloat($("#meal_weight_input").val());

            let nutrient_totals = []
            if(meal_weight != 0){
                nutrient_totals = [
                    parseFloat($("#calories_total").text())/meal_weight,
                    parseFloat($("#fat_total").text())/meal_weight,
                    parseFloat($("#carbs_total").text())/meal_weight,
                    parseFloat($("#fiber_total").text())/meal_weight,
                    parseFloat($("#protein_total").text())/meal_weight
                ]
            }
            
            $.ajax({
                type: 'post',
                url: '/add_meal',
                data: {
                    meal_name: meal_name, 
                    meal_weight: parseFloat(meal_weight), 
                    nutrients: nutrient_totals
                },
                dataType: 'json'
            })
            .done(function(maybeError){
                if(maybeError.err != null){
                    let warning_container = $("#warning_container");
                    warning_container.text(maybeError.err);
                    warning_container.show();
                }
                else{
                    $("#warning_container").hide();
                }
            });
        });
    }

    //Recipe section
    function load_recipe_template(){
        return '<div>' + 
            '<div style="float: left; display: none;" class="alert alert-danger" id="warning_container"></div>' +

            '<div class="lone-input" style="margin-bottom:16px" id="existing_container">' +
                '<span style="margin-right:16px;">Recipes</span>' +
            '</div>' + 

            '<div id="ingredients_options_container">' +
                '<div style="width=100%">If the ingredient has already been added, its amount will increase by one serving size.</div>' +
                '<select id="ingredients_list">' +
                '</select>' +
                '<input id="add_ingredient_btn" type="button" value="Add Ingredient">' +
            '</div>' +
            '<div>' +
                '<table>' +
                    '<tbody id="ingredients_container">' +
                        '<tr>' +
                            '<th>Name</th>' +
                            '<th>Unit</th>' + 
                            '<th>Amount</th>' + 
                            '<th>Calories</th>' +
                            '<th>Fat</th>' +
                            '<th>Carbs</th>' +
                            '<th>Fiber</th>' +
                            '<th>Protein</th>' +
                        '</tr>' +
                    '</tbody>' + 
                    '<tfoot id="totals_container"></tfoot>' +
                '</table>' +
            '</div>' +

            '<div id="submit_container>' + 
                '<div style="width:100%">Any ingredients with amount 0 will not be included.</div>' +
                '<div id="name_container">' + 
                    '<label class="lone-input" for="recipe_name_input">Name:</label>' +
                    '<input class="lone-input" id="recipe_name_input"></input>' +
                '</div>' + 
                '<input type="button" id="submit_btn" value="Save"></input>' +
            '</div>' +
        '</div>';
    }

    function load_recipe_scripts(){
        $.ajax({
            type: 'get',
            url: "get_ingredient_list",
            dataType: 'json'
        })
        .done(function(ing_list){
            let ing_options = "";
            for(let ing_obj of ing_list){
                let ing_name = ing_obj.ingredient_name;
                ing_options += `<option value='${ing_name}'>${ing_name}</option>`;
            }
            $("select[id='ingredients_list']").html(ing_options);
        });
        
        let existing_container = $("div[id='existing_container']");
        let ingredients_container = $("tbody[id='ingredients_container']"); 
        let nutrient_ids = ["calories", "fat", "carb", "fiber", "protein"];
        let recipe_name_input = $("#recipe_name_input");

        $.ajax({
            type: 'get',
            url: "get_recipe_list",
            dataType: 'json'
        })
        .done(function(recipe_list){
            let select_id = "existing_select"
            let recipe_select = `<select id='${select_id}'><option value='none'>[New Recipe]</option>`;
            for(let recipe_obj of recipe_list){
                let recipe_name = recipe_obj.recipe_name;
                recipe_select += `<option value='${recipe_name}'>${recipe_name}</option>`;
            }
            recipe_select += "</select>";

            existing_container.append(recipe_select);

            $(`select[id='${select_id}']`).on("change", function(){
                let name_container = $("div[id='name_container']");
                let recipe = $(this).val();

                //TODO replace with a better div-based solution
                //Clear out the container in anticipation of the new inputs
                ingredients_container.html(
                    '<tr>' +
                        '<th>Name</th>' +
                        '<th>Unit</th>' + 
                        '<th>Amount</th>' + 
                        '<th>Calories</th>' +
                        '<th>Fat</th>' +
                        '<th>Carbs</th>' +
                        '<th>Fiber</th>' +
                        '<th>Protein</th>' +
                    '</tr>' 
                )
                if(recipe == "none"){
                    recipe_name_input.val("");
                    name_container.show();

                    update_totals();
                }
                else{
                    recipe_name_input.val(recipe);
                    name_container.hide();
                    $.ajax({
                        type: 'post',
                        url: '/get_recipe_ingredients',
                        data: {recipe_name: recipe},
                        dataType: 'json',

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
                }
            });
        });

        //Add the ingredient to the list
        $("#add_ingredient_btn").on('click', function(e){
            add_ingredient(nutrient_ids);
        });
        

        ingredients_container.on('update', function(){
            update_totals();
        });

        $("#submit_btn").on('click', function(e){
            let recipe_name = recipe_name_input.val(); 
            //TODO replace this with a more elegant error message box
            if(recipe_name == ""){
                alert("You must provide a name!");
                return;
            }

            let ingredient_rows = ingredients_container.find("tr");
            //There's always a header row we have to ignore
            //TODO replace this with a more elegant error message box
            if(ingredient_rows.length <= 1){
                alert("You need to have at least one ingredient!");
                return;
            }
            let ingredients_list = {}
            for(let idx = 1; idx < ingredient_rows.length; idx++){
                let ingredient = ingredient_rows.get(idx);
                let amount = $(ingredient).find("#amount").val();
                if(parseFloat(amount) > 0){
                    ingredients_list[idx] = {
                        "name" : $(ingredient).find("#ing_name").text(),
                        "ratio" : $(ingredient).find("#hid_ratio").val(),
                    }
                }
            }
            
            if(Object.keys(ingredients_list).length > 0){
                $.ajax({
                    type: 'post',
                    url: '/add_recipe',
                    data: {recipe_name: recipe_name, ingredients: ingredients_list},
                    dataType: 'json'
                })
                .done(function(maybeError){
                    if(maybeError.err != null){
                        let warning_container = $("#warning_container");
                        warning_container.text(maybeError.err);
                        warning_container.show();
                    }
                    else{
                        $("#warning_container").hide();
                    }
                });
            }
            else{
                alert("One non-zero amount of an ingredient is required.");
            }
        });
    }

    //Initialize the page
    template_picker.trigger("change");
});


