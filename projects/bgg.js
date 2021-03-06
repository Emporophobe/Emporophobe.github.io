// JSON wrapper for BGG API, also doesn't have CORS restrictions
const apiRoot = "https://cors.io?https://bgg-json.azurewebsites.net/"
// cache the api response after the first call
var cachedResponse = null;
	
var submitButton;
var moreButton;
var resultDiv;

window.onload = function() {
	console.log("Made by Michael Wong https://michaelwong.io. Source on GitHub: https://github.com/Emporophobe/Emporophobe.github.io");
	
	submitButton = document.getElementById("submit");
	moreButton = document.getElementById("more");
	resultDiv = document.getElementById("result");
	
	submitButton.onclick = submitClickHandler;
	moreButton.onclick = toggleHidables;
	
	document.addEventListener("input", inputEventListener, false);
}

function submitClickHandler(event) {
	if (document.getElementById("bgg-settings").reportValidity()) {
		bggSearch();
	}
}

function inputEventListener(event) {
	if (event.target.id == "bgg-username") {
		cachedResponse = null;
	}
}

function bggSearch() {
	const url = apiRoot + "collection/" + document.getElementById("bgg-username").value + "?grouped=false";
	document.getElementById("result").innerHTML = "🤔"
	if (cachedResponse) {
		updatePage(selectGame(cachedResponse));
	} else {
		resultDiv.classList.add("loading");
		fetch(url)
		.then(function(response) {
			return response.json();
		})
		.then(function(responseJson) {
			resultDiv.classList.remove("loading");
			cachedResponse = responseJson;
			updatePage(selectGame(responseJson));
		})
		.catch(function(error) {
			// don't cache bad response
			resultDiv.classList.remove("loading");
			cachedResponse = null;
			updatePage("There was an error processing your request 😢");
		})
	}
}

function selectGame(gameJson) {
	if (gameJson.length === 0) {
		return "No games found for given username.";
	}
	
	const numPlayers = document.getElementById("num-players").value;
	const minDuration = document.getElementById("min-duration").value;
	const maxDuration = document.getElementById("max-duration").value;
	const weighting = document.querySelector('input[name="weight"]:checked').value;
	const showAll = document.getElementById("show-all").checked;
	const validGames = gameJson.filter(game => 
		game.owned
		&& !game.isExpansion
		&& game.minPlayers <= numPlayers
		&& game.maxPlayers >= numPlayers
		&& (!minDuration || game.playingTime >= minDuration)
		&& (!maxDuration || game.playingTime <= maxDuration)
	);
	
	if (showAll) {
		return listAllGames(validGames);
	}
	
	if (weighting === "none") {
		const selected = validGames[Math.floor(Math.random()*validGames.length)];
		return formatGameChoice(selected, validGames);		
	} else if (weighting === "bgg") {
		return 	formatGameChoice(weightedChoice(validGames, validGames.map(game => game.averageRating)),
			validGames.filter(game => game.averageRating >= 0));
	} else if (weighting === "user") {
		return 	formatGameChoice(weightedChoice(validGames, validGames.map(game => game.rating)),
			validGames.filter(game => game.rating >= 0));		
	}
}

function listAllGames(validGames) {
	var list = document.createElement("ul");
	validGames.map(game => {
		var item = document.createElement("li");
		item.appendChild(document.createTextNode(game.name));
		list.appendChild(item);
	})
	return list.innerHTML;
}

function formatGameChoice(game, validGames) {
	switch (validGames.length) {
		case 0:
			return "No games fit your criteria."
		case 1:
			return "<b>" + game.name + "</b> is your only choice."
		default:
			return "How about a nice game of <b>" + game.name + "</b>?"
	}
}

function weightedChoice(options, weights) {
	// unrated games have a weight of -1
	const weightedOptions = options.filter((option, i) => weights[i] >= 0); 
	const filteredWeights = weights.filter(weight => weight >= 0)
	const totalWeight = filteredWeights.reduce((sum, weight) => sum + weight);
	const selectedWeight = Math.random() * totalWeight;
	return selectByWeight(weightedOptions, filteredWeights, selectedWeight, 0);
}

// A gratuitously tail-recursive function.
function selectByWeight(options, weights, targetWeight, totalWeight) {
	if (options.length === 0) {
		return null;
	}else if (options.length === 1) {
		return options[0];
	} else if (totalWeight + weights[0] >= targetWeight) {
		return options[0];
	} else {
		return selectByWeight(options.slice(1), weights.slice(1), targetWeight, totalWeight + weights[0]);
	}	
}

function updatePage(message) {
	resultDiv.innerHTML = message;
}

function toggleHidables() {
	document.querySelectorAll(".hidable").forEach(element => element.classList.toggle("hidden"));
	moreButton.innerText = (moreButton.innerText.toLowerCase() === "more" ? "Less" : "More");
}
