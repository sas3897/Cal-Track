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
                break;
            case "Recipe":
                template_container.html(load_recipe_template());
                break;
            default:
                console.error("Option chosen does not have an associated template!");
        }
    });

    function load_ing_template(){
        return '<div class="ing_form" id="ing_form">' +
            '<div class="lone-input" id="existing_container">' +
                '<span style="margin-right:16px;" >Ingredient</span>' +
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

            '<input class="lone-input" id="submit_btn" type="button" value="Add Ingredient">' +
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
                let submit_btn = $("#submit_btn");

                $("div[id='servings_container']").html("<span>Servings</span>");
                if(ing == "none"){
                    name_container.show();
                    
                    $("input[id^='ing']").val("");
                    add_serving_pair();

                    submit_btn.val("Add Ingredient");
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

                        submit_btn.val("Update Ingredient");
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

    function load_meal_template(){
        return "";
    }

    function load_recipe_template(){
        return "";
    }

    //Initialize the page
    template_picker.trigger("change");
});


