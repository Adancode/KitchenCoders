
// ============================================================
// DEPENDENCIES
// Node Package Modules
// ============================================================

// import Node File System module express - a fast, unopinionated, minimalist web framework
var express = require('express');
// import Node File System module body-parser - body parsing middleware.  It parses incoming request bodies in a middleware before your handlers
var bodyParser = require('body-parser');

var models = require('./models');


// PREPARE OUR TABLES in MySQL)
/// extract our sequelize connection from the models object, to avoid confusion
var seqConnection = models.sequelize;

// Include the unirest npm package
var unirest = require('unirest');
var fs = require('fs');

// PREPARE OUR TABLES
// =======================================================================

var recipeSearchResults = [];
var oneRecipeData = {};
var recipeID ="";
var searchTerm = "";
var recipeIngredients = [];

function enterRecipe(newRecipe){
    // We run this query so that we can drop our tables even though they have foreign keys
    seqConnection.query('SET FOREIGN_KEY_CHECKS = 0')

    // reach into our models object, and create each table based on the associated model.
    // note: force:true drops the table if it already exists
    .then(function(){
        return seqConnection.sync()
    })
    // enter new ingredients
    .then(function(){

        var extendedIngredients = newRecipe.extendedIngredients;
        var newIngredients = [];
        recipeIngredients =[];

        for (var i=0; i<extendedIngredients.length; i++) {
            var newIngredient = {
                name: extendedIngredients[i].name,
                spoonID: extendedIngredients[i].id,
                category: extendedIngredients[i].aisle
            };
            var recipeIngredient = {
                name: extendedIngredients[i].name,
                amount: extendedIngredients[i].amount,
                unit: extendedIngredients[i].unit
            };
        	recipeIngredients.push(recipeIngredient);
        	newIngredients.push(newIngredient);
        	models.Ingredient.findOrCreate({where: {spoonID: extendedIngredients[i].id}, defaults: {name: extendedIngredients[i].name, category: extendedIngredients[i].aisle}})
        }
       })
    //    console.log("newIngredients here:", newIngredients);
    //    console.log("recipeIngredients here:", recipeIngredients);
    //    return models.Ingredient.bulkCreate(newIngredients, {ignoreDuplicates: true})

    // then enter new recipe
	    .then(function(){
	     return models.Recipe.create(
	        {title: newRecipe.title,
	        image: newRecipe.image,
	        vegetarian: newRecipe.vegetarian,
	        vegan: newRecipe.vegan,
	        glutenFree: newRecipe.glutenFree,
	        servings: newRecipe.servings,
	        preparationMinutes: newRecipe.preparationMinutes,
	        cookingMinutes: newRecipe.cookingMinutes,
	        sourceUrl: newRecipe.sourceUrl
	    	})
	 	})
		//        .then(function(recipe){
		//            return models.Ingredient.findAll({where: {name: [recipeIngredients]}})
		//            .then(function(ingredients){recipe.addIngredients(ingredients);
		//            })
		//        })



}




// SEARCH FOR 10 RECIPES - RIGHT NOW THEY ARE FOR BURGER RECIPES
unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/search?diet=vegetarian&excludeIngredients=coconut&intolerances=egg%2C+gluten&limitLicense=false&number=10&offset=0&query=burger&type=main+course")
.header("X-Mashape-Key", "1pb1awVrWQmsh5cGX7uf2JqubVkIp1ibFl8jsnOPSRyTSkfXtR")
.end(function (result) {

// STORE RESULTS IN recipeResults array
    recipeSearchResults = result.body.results;

// FOR EACH RECIPE IN recipeResults array, you need to do two searches
    for (var i=0; i<recipeSearchResults.length; i++) {
        recipeID = recipeSearchResults[i].id;


    //first you need to search by recipeID and find the recipe information
        unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/" + recipeID + "/information?includeNutrition=false")
        .header("X-Mashape-Key", "1pb1awVrWQmsh5cGX7uf2JqubVkIp1ibFl8jsnOPSRyTSkfXtR")
        .end(function (result) {

            oneRecipeData = {
                title: result.body.title,
                image: result.body.image,
                vegetarian: result.body.vegetarian,
                vegan: result.body.vegan,
                glutenFree: result.body.glutenFree,
                servings: result.body.servings,
                preparationMinutes: result.body.preparationMinutes,
                cookingMinutes: result.body.cookingMinutes,
                sourceUrl: result.body.sourceUrl,
                extendedIngredients: result.body.extendedIngredients

            };
            enterRecipe(oneRecipeData);
        });
    }

})






// unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/262682/information?includeNutrition=false")
// .header("X-Mashape-Key", "1pb1awVrWQmsh5cGX7uf2JqubVkIp1ibFl8jsnOPSRyTSkfXtR")
// .end(function (result) {

//         fs.writeFile("recipes_detailed.txt", JSON.stringify(result.body), function(err) {
//             if(err) {
//                 return console.log(err);
//             }
//             // Otherwise, it will print: "movies.txt was updated!"
//             console.log("recipes_detailed.txt was updated!");
//         });


// console.log(result.status, result.headers, result.body);
// });



// }
