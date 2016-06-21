var socket;
var spyMasterMode = false;
var activeSpy = false;
var playerName;
var COLOR_GREEN = "#009000";
var COLOR_WHITE = "#ffffff";
var COLOR_PALE_GREY = "#b3b3b3";
var COLOR_EVEN_PALER_GREY = "#f0f0f0";
var TILE_GREY = "#F6F6F6";
var COLOR_GREY = "#b3b3b3";
var activeGo = false;
var room = "";
var goes = 0;
var num = 0;
var testing=true;
var totaltime = 60 * 2.5;
var teamColour;
var activeTeamColour;
var DARKEN = -0.1;
var LIGHTEN = 0.2;
var activeTeam = false;
var currentGuesser = false;
var numSelector = "<select class=\"selector\" id=\"num\"><option value=\"0\">..</option><option value=\"1\">1</option><option value=\"2\">2</option><option value=\"3\">3</option><option value=\"4\">4</option><option value=\"5\">5</option><option value=\"6\">6</option><option value=\"7\">7</option><option value=\"8\">8</option><option value=\"9\">9</option></select>" ;
var optionsSelector = "<label class=\"label paleGrey\" for=\"pnum\">Players</label><select class=\"selector paleGrey\" id=\"pnum\"><option value=\"0\">..</option><option value=\"4\">4</option><option value=\"6\">6</option><option value=\"8\">8</option><option value=\"9\">9</option></option><option value=\"12\">12</option><option value=\"16\">16</option></select>";

// this block executes when page DOM is ready
$( document ).ready(function() {
	var correctModal = document.getElementById("correctModal");
	var closeSpan = document.getElementsByClassName("close")[0];
	
	window.onclick = function(event) {
		if(event.target==correctModal) {
			correctModal.style.display = "none";
		} else if(event.target==incorrectModal) {
			incorrectModal.style.display = "none";
		} else if(event.target==confirmModal) {
			confirmModal.style.display = "none";
		}
	}
	
	connect();
	$('#btmShadow').hide();
	$('#endBanner').hide();
	//$('#resetContainer').html("<div><input type=\'button\' class=\'btn btn-primary btn-sm\' id=\'reset\' value=\'Reset\'></input></div>");
	socket.emit('getStatus', function (data) {
		if(data) {
			console.log("Options Available");
			$('#options').html(optionsSelector);					
		} else {
			console.log("Options not available, getting teams");
			$('#options').remove();
			socket.emit('getTeams');
		}
	});
	
	// Listener for click on Enter Game button
	$('#joinBtn').click(function(e){
		e.preventDefault();
		playerName = $('#pname').val();
		if (playerName == "" ) {
			console.log("Name was empty");
		} else {
			console.log("Registering Player: " + playerName);
			if($('#pnum').val() != "") {
				playerNum = $('#pnum').val();
				console.log("Number of players " + playerNum);
			}
			socket.emit('registerPlayer', playerName, playerNum, function (data) {
				if (data) {
					$('#playerentry').hide();
					console.log("Player " + playerName + " registered");
				} else {
					console.log("Name " + playerName + " already taken");
					$("#errMsg").html("Sorry! Name is already taken, please try again");
				}
			});
			$('#waitMsg').html = "Please wait...";
		}
	});
	
	/*$('#reconnect').click(function(e) {
		e.preventDefault();
		reconnect();
	});*/
});

$(document.body).on('click', '#newGame' ,function(e){
	e.preventDefault();
	console.log("New Game Clicked");
	socket.emit('reset');
});
	
$(document.body).on('click', '#endGo' ,function(e){
	e.preventDefault();
	goes = 0;
	$("#endGo").hide();
	socket.emit('switch');
});

$(document.body).on('click', '#reset' ,function(e){
	e.preventDefault();
	console.log("Sending reset");
	//$("#reset").hide();
	socket.emit('reset');
});

// Function to create a HTML table for the player names
function createTeamTable(teams, NUM_TEAMS, TEAM_SIZE) {

	var cols = "<colgroup>";
	var teamNameRow = "<tr>";
	for (z=0; z<NUM_TEAMS; z++){
		cols += "<col span=\"1\" style=\"background-color:"+teams[z].colour+"\">";
		teamName = toTitleCase(teams[z].name);
		newColour = lighten(teams[z].colour, LIGHTEN);
		teamNameRow += "<td style=\"width:200px; font-size:12pt; padding:5px; color:"+newColour+"\">"+ teamName + "</td>";
	}
	cols += "<colgroup>";
	teamNameRow += "</tr>";
	var table = "<table id=\"ttable\" style=\"display:inline-block; padding-top:20px; border-spacing: 12px 0px\">" + cols + teamNameRow;
	for(a=0; a<TEAM_SIZE; a++) {
		table += "<tr>";
		for(b=0; b<NUM_TEAMS; b++) {
			if(teams[b].players[a] != null) {
				table += "<td style=\"width:200px; text-align:left; font-size:10pt; padding:5px; padding-left:10px;\">"+ teams[b].players[a].name + "</td>";
			} else {
				newColour = lighten(teams[b].colour, DARKEN-0.05);
				table += "<td style=\"color: "+newColour+"; width:254px; text-align:left; font-size:10pt; padding:5px; padding-left:10px;\">Waiting for player</td>";
			}
		}
		table += "</tr>";
	}
	table += "</table>";
	return table;
}

// Function to create a HTML table for the player names
function createEndTable(teams, NUM_TEAMS, TEAM_SIZE) {

	var cols = "<colgroup>";
	var teamNameRow = "<tr>";
	var scores = "<tr style=\"\">";
	
	for (z=0; z<NUM_TEAMS; z++){
		cols += "<col span=\"1\" style=\"background-color:"+teams[z].colour+"\">";
		teamName = toTitleCase(teams[z].name);
		newColour = lighten(teams[z].colour, LIGHTEN);
		teamNameRow += "<td style=\"width:200px; font-size:12pt; padding:5px; color:"+newColour+"\">"+ teamName + "</td>";
		scores = scores + "<td style=\"width:200px; padding:5px;\"><span class=\"scoreNum\">" + teams[z].score + "</span><span class=\"scoreTarget\" style=\"color:"+newColour+"\">/" + teams[z].target + "</td>";
	}
	scores += "</tr>";
	cols += "<colgroup>";
	teamNameRow += "</tr>";
	var table = "<table id=\"ttable\" style=\"display:inline-block; padding-top:20px; border-spacing: 12px 0px\">" + cols + teamNameRow + scores;
	for(a=0; a<TEAM_SIZE; a++) {
		table += "<tr>";
		for(b=0; b<NUM_TEAMS; b++) {
			if(teams[b].players[a] != null) {
				table += "<td style=\"width:200px; text-align:left; font-size:10pt; padding:5px; padding-left:10px;\">"+ teams[b].players[a].name + "</td>";
			} else {
				table += "<td style=\"width:200px; text-align:left; font-size:10pt; padding:5px; padding-left:10px;\">Waiting for player</td>";
			}
		}
		table += "</tr>";
	}
	table += "</table>";
	return table;
}

function createScoreTable(teams) {
	var output = "<table class=\"table score\">";
	//var header = "<thead><tr>";
	var scores = "<tbody><tr style=\"vertical-align:top; height:70px;\">";
	for (x=0; x<teams.length; x++) {
		teamName = toTitleCase(teams[x].name);
		console.log(teams[x].name + " status: " + teams[x].active);
		if(teams[x].active) {
			newColour = lighten(teams[x].colour, DARKEN);
			scores = scores + "<td style=\"padding-top:8px; background-color:" + teams[x].colour +"; color:white; border-radius:5px; width:56px; box-shadow: inset 0 -5px 1px"+newColour+";\"><span id=\"star\"></span><span class=\"scoreNum\">" + teams[x].score + "</span><span class=\"scoreTarget\" style=\"color:"+newColour+"\">/" + teams[x].target + "</span><br/><span id=\"yourTurn\" style=\"font-size:8pt\"></span></td>";
			//Add in another indicator for this team
		} else {
			scores = scores + "<td style=\"padding-top:8px; width:56px; color:" + teams[x].colour +"\"><span class=\"scoreNum\">" + teams[x].score + "</span><span class=\"scoreTarget\">/" + teams[x].target + "</span></td>";		
		}
	}
	//header += "</tr></thead>";
	scores += "</tr></tbody>";
	//output = output + header + scores + "</table>";
	output = output + scores + "</table>";
	return output;
}

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

// Connect event for web sockets
function connect() {
  
	var connString = config.protocol + config.domain + ':' + config.clientport;
	console.log("Websocket connection string:", connString, config.wsclientopts);
	socket = io.connect(connString, config.wsclientopts);

	// Handle error event
	socket.on('error', function (err) {  
	console.log("Websocket 'error' event:", err);
	});

	// Handle connection event
	socket.on('connect', function () { 
	console.log("Websocket 'connected' event with params:", socket);
	});

	// Handle disconnect event
	socket.on('disconnect', function () {
		console.log("Websocket client 'disconnect' event");
	});
	
	// Handle reload event
	socket.on('reload', function () {
		console.log("Reloading page");
		location.reload(true);
	});

	// Handle incoming room allocation event
	socket.on('roomAllocated', function(data) {
	   //console.log('Welcome to team', roomId);
		room = data.roomId;
		teamColour = data.colour;
		loc = "images/avatar_"+room+"_small.png"
		$('#avatar').attr("src",loc);
		teamName = toTitleCase(room).slice(0,-1);
		$('#avatarName').html(teamName+" team");
		$('#avatarName').css('color', teamColour);
	});

	// Handle teamSize event
	socket.on('teamSize', function(data) {
	   //console.log('Team Size:', data);
	   //$('#numPlayers').html("Players: "+ data.teamSize);
	   //document.getElementById('numPlayers').innerHTML = "Players =  "+ data.teamSize;
		if (data.left >0 ) {
			$('#numPlayers').html("Waiting for "+ data.left + " more players");
			$('#numPlayers').css({'font-size':'24pt', 'padding-top':'20px' });
			$('#numPlayers').css('color', COLOR_PALE_GREY);
		} 
		$('#role').css({'font-size':'16pt', 'padding-top':'10px' });
		$('#role').css('color', COLOR_PALE_GREY);
		if(spyMasterMode) {
			$('#role').html("You are in team <span style=\"color:"+teamColour+"\"><strong>"+ room + "</strong></span> as a <span style=\"color:"+teamColour+"\"><strong>Brand Master</strong></span>");
		} else {
			$('#role').html("You are in team <span style=\"color:"+teamColour+"\"><strong>"+ room + "</strong></span> as a <span style=\"color:"+teamColour+"\"><strong>Marketeer</strong></span>");
		}
	});

	// Handle game full event
	socket.on('gameFull', function(teams) {
		console.log("Game full");
		var output = createTeamTable(teams);
		$('#teams').html(output + "<br/> Sorry! Game full");
	});
	
	
	// Handle getReady event
	socket.on('getReady', function(seconds) {
		console.log("Ready Countdown: " + seconds);
		$('#numPlayers').html("<span id=\"readyTimer\">"+seconds+"</span><br/>Ready to start!");
		$('#numPlayers').css({'font-size':'24pt', 'padding-top':'20px' });
		$('#numPlayers').css('color', COLOR_PALE_GREY);
		$('#readyTimer').css('color', '#27aae0');
	});
	
	// Handle showClue event
	socket.on('showClue', function(data) {
		//the html for displaying the clue
		//$('#clue').html("<div>" + data.clue.toUpperCase() + " " + data.num + "</div>");
		//$('#clueBox').placeholder = data.clue.toUpperCase() + " " + data.num ;
		if(!spyMasterMode) {
			$('#clueBox').css('color', COLOR_PALE_GREY);
			$('#clueBox').css('border', '1px solid ' + COLOR_PALE_GREY);
			$('#clueBox').val(data.clue.toUpperCase() + " " + data.num);
		}
		
		$('#history').prepend("<span style=\"font-weight:bold; color:"+activeTeamColour+"\">" + toTitleCase(turn) + "</span> team set clue <span style=\"font-weight:bold; color:"+activeTeamColour+"\">" + data.clue.toUpperCase() + "</span> (" + data.num + ")<br />");
		$('#btmShadow').show(); //Is there a way to only do this once?
		// Activate players
		if(room == data.whoseGo && !spyMasterMode) {
			console.log("Activating players in active team except the spymaster");
			goes = data.num; // Set the number of goes players can have
			goes++;
			activeGo = true; // Set player status active
			
			$('#clueBox').css('color', teamColour);
			$('#clueBox').css('border', '1px solid ' + teamColour);
			
			$('#numInput').html(goes + " guesses left");
			$('#numInput').css('color', teamColour);
			$('#numInput').css('font-size', '12pt');
			
			$('#endGo').attr("disabled", false);
			//var index = data.teams.map(function(e) { return e.name; }).indexOf(data.whoseGo);
			//$('#endGo').css('background-color', data.teams[index].colour);
			$('#endGo').css('background-color', teamColour);
			newColour = lighten(teamColour, DARKEN);
			$('#endGo').css('boxShadow', "inset 0 -5px 1px " + newColour);	
			$('#giveClue').hide();
		}
	});
	
	// Handle display board event
	socket.on('board', function(data) {
		$('#numPlayers').html('');
		$('#rules').remove();
		$('#role').remove();
		$('#teamTable').css('display','none');
		
		//console.log("Generating player board");
		var board = "";
		var actions = "<div class=\"center\" id=\"top\"><div id=\"topWrap\"><div id=\"topInWrap\"><div id=\"pie\" class=\"pie degree middle\"><span class=\"block\"></span><span id=\"time\"></span></div><div class=\"middle\" id=\"clueWrap\"><div id=\"clue\"></div><div class=\"middle\" id=\"goes\"></div></div><div class=\"middle\" id=\"end\"></div><div id=\"errors\"></div></div></div></div>";
		//board += '<table class="board" id="board"><tbody>';
		for (var i = 0; i < data.trs.length; i++){
			board += data.trs[i];
		}
		$("#board").append(board);

		//console.log("Generating spymaster board");
		for(var j = 0; j < data.colours.length; j++){
			if(spyMasterMode) {
				document.getElementById(j).style.backgroundColor = data.colours[j];
				newColour = lighten(data.colours[j], DARKEN);
				document.getElementById(j).style.boxShadow = "inset 0 -5px 1px " + newColour;				
	
			} else {
				document.getElementById(j).style.backgroundColor = TILE_GREY;
				newColour = lighten(TILE_GREY, DARKEN);
				document.getElementById(j).style.boxShadow = "inset 0 -5px 1px " + newColour;	
				document.getElementById(j).style.color = "#545454";
			}
		}
		$('#actions').html(actions);
	});
	
	// Handle the changing of tile colour event
	socket.on('changeColour',function(data) {
		//console.log("Received colours & value from server",  data);
		var theColours = data.colours;
		var theValue = data.value;
		if(spyMasterMode)
		{
			//Set tile white & clear it's contents
			document.getElementById(theValue).style.backgroundColor = COLOR_EVEN_PALER_GREY ;
			document.getElementById(theValue).style.color = COLOR_PALE_GREY;
			document.getElementById(theValue).style.boxShadow = "inset 0 -5px 1px " + COLOR_EVEN_PALER_GREY;
		} 
		// not spy master
		else {
			document.getElementById(theValue).style.backgroundColor = theColours[theValue];
			document.getElementById(theValue).style.color = 'white';
			document.getElementById(theValue).style.boxShadow = "";	
			
			/*setTimeout(function() {
				document.getElementById(theValue).style.backgroundColor = COLOR_EVEN_PALER_GREY;
				document.getElementById(theValue).style.color = COLOR_PALE_GREY;
				document.getElementById(theValue).style.boxShadow = "inset 0 -5px 1px " + COLOR_EVEN_PALER_GREY;	
			}, 500); 
			
			setTimeout(function() {
				document.getElementById(theValue).style.backgroundColor = theColours[theValue];
				document.getElementById(theValue).style.color = 'white';
				document.getElementById(theValue).style.boxShadow = "";		
			}, 500);*/
			
			var col;
			var newColour;
			for (i=0; i<data.teams.length; i++) {
				if (data.teams[i].colour === theColours[theValue]) {
					col = data.teams[i].name;
				}
			}
			if(activeGo) {
				if(col && currentGuesser) {
					socket.emit('score', col);
				}
				if (col == room ) {
					console.log("Correct keep guessing");
					goes--;
					correctModal.style.display = "block";
					if(goes>0) {
						$('#modalMsg').html(goes + " guesses left...");
						$('#numInput').html(goes + " guesses left");
						console.log("Goes left: ", goes);
					} else {
						$('#modalMsg').html("Your turn is over!");
						console.log("end of goes, switching");
						if(currentGuesser) {
							socket.emit('switch'); 
						}
					}
					$('.modal-content').css('background-color', '#2ec306');
					$('.modal-content').css('color', COLOR_WHITE);
					newColour = lighten('#2ec306', DARKEN);
					$('.modal-content').css('box-shadow', 'inset 0 -5px 1px' + newColour);
					setTimeout(function () {
						correctModal.style.display = "none";
					},2000);
				} else {
					incorrectModal.style.display = "block";
					$('.modal-content').css('background-color', '#ff035c');
					$('.modal-content').css('color', COLOR_WHITE);
					newColour = lighten('#ff035c', DARKEN);
					$('.modal-content').css('box-shadow', 'inset 0 -5px 1px' + newColour);
					setTimeout(function () {
						incorrectModal.style.display = "none";
					},2000);
					console.log("Incorrect stop guessing & switching");
					goes = 0;
					if(currentGuesser) {
						socket.emit('switch');
					}
				}
				console.log("No longer the current guesser");
				currentGuesser = false;
			}
		}
	});
	
	
	socket.on('endGame', function(data) {
		//alert("Game Over");
		$('#teamsWrap').hide();
		$('#board').hide();
		$('#actions').hide();
		var endTable = createEndTable(data.teams, data.NUM_TEAMS, data.TEAM_SIZE);
		$('#teamTable').html(endTable);
		$('#teamTable').css('display','block');
		teamName = toTitleCase(data.teamName);
		$('#endBanner').append("<div id=\"winnerName\" style=\"font-size: 26px; margin-bottom:20px\">" + teamName + " win!</div>");
		$('#endBanner').append("<input type=\"button\" class=\"btn-primary\" id=\"newGame\" value=\"New Game\" style=\"text-align:center\"></input>");
		$('#endBanner').css('display', 'block');
		
		$('#winnerName').css('color', data.colour);
		//console.log("Game Over, resetting");
		//socket.emit('reset');
	});
	
	//Handle display team event
	socket.on('displayTeam', function (data) {
		//$('#temp').remove();
		$('#waitMsg').remove();
		console.log("Display team event, teams length: " + data.teams.length);
		for (i=0; i<data.teams.length; i++)
		{
			if (data.teams[i].players.length > 0) {
				if(data.teams[i].players[0].name === playerName) {
					spyMasterMode = true;
					console.log("You are a code master");
				}
			}
		}
		//if (data.teams.length > 0 ) {
			var teamTable = createTeamTable(data.teams, data.NUM_TEAMS, data.TEAM_SIZE);
			$('#teamTable').html(teamTable);
		//}
	});
	
	//Handle display score event
	socket.on('displayScore', function (teams) {
		var scoreTable = createScoreTable(teams);
		$('#scoreTable').html(scoreTable);				
		if(activeTeam) {
			$('#yourTurn').html("Your turn");
			$('#star').html("<img id=\"starImg\" class=\"img\" src=\"images/my_team_star_small.png\" alt=\"star\"></img>");
		}
		else {
			$('#yourTurn').html("Turn");
		}
	});
	
	// Handle the timer event
	socket.on('timer', function (data) {  
		//$('#counter').html(data.minutes + ":" + data.seconds);
		$('#time').html(data.minutes + ":" + data.seconds);
		update(totaltime-data.duration);
	});
	
	// Handle the disable event
	socket.on('disable', function (turn) {  
		activeGo = false;
	});
	
	// Handle the turn event
	socket.on('turn', function (data) { 
		$("#endGo").hide();
		turn = data.whoseGo;
		activeTeamColour = data.activeTeamColour;
		console.log("Active colour " + activeTeamColour);
		console.log("It's " + turn + " turn");
		$('#clue').html('');
		if (turn == room) {
			activeTeam = true;
			$('.pie').css('background-color', teamColour);
			if(spyMasterMode) {
				console.log ("Spymaster active");
				$("#clue").html("<input class=\"dynamic\" id=\"clueBox\" type=\"text\" placeholder=\"Enter Brand...\"></input><div id=\"numInput\">"+numSelector+"</div><div id=\"numTxt\">products linked</div><input type=\"button\" id=\"giveClue\" value=\"Send\" onclick=\"giveClue()\"></input>");
				try {
					addCSSRule(document.styleSheets[0], ".dynamic::-webkit-input-placeholder", "color:"+teamColour + "!important", 0);
					addCSSRule(document.styleSheets[0], ".dynamic:-moz-placeholder", "color:"+teamColour + "!important", 0);
					addCSSRule(document.styleSheets[0], ".dynamic::-moz-placeholder", "color:"+teamColour + "!important", 0);
					addCSSRule(document.styleSheets[0], ".dynamic:-ms-input-placeholder", "color:"+teamColour + "!important", 0);
				} catch (e) {
					console.log("Error dynamically adding placeholder style", e);
				}
				//var index = data.teams.indexOf(turn);
				//var index = data.teams.map(function(e) { return e.name; }).indexOf(turn);
				$('#giveClue').css('background-color', teamColour);
				$('#clueBox').css('color', teamColour);
				$('#clueBox').css('border', '1px solid ' + teamColour);
				$('#num').css('border', '1px solid ' + teamColour);
				$('#num').css('color', teamColour);
				newColour = lighten(teamColour, DARKEN);
				$('#giveClue').css('boxShadow', "inset 0 -5px 1px " + newColour);	
				activeSpy = true;
			}
			else {
				$("#clue").html("<input class=\"dynamic\" id=\"clueBox\" type=\"text\" placeholder=\"Waiting for Brand...\" readonly></input><div id=\"numInput\"></div><input type=\"button\" id=\"endGo\" value=\"End Go!\"></input>");
				$('#endGo').attr("disabled", true);
				$('#endGo').css('background-color', COLOR_GREY);	
			}
		} else {
			activeTeam = false;
			$("#clue").html("<input class=\"dynamic\" id=\"clueBox\" type=\"text\" placeholder=\"\" readonly></input>");
			$('#clueBox').css('border', '1px solid ' + COLOR_PALE_GREY);
			$('#clueBox').val(turn + " team\'s turn");
			$('#clueBox').css('color', activeTeamColour);
			$('.pie').css('background-color', COLOR_GREY);
		}
		/*if(activeTeam) {
			$('.pie').css('background-color', teamColour);
		} else {
			$('.pie').css('background-color', COLOR_GREY);
		}*/
	});
}

function clicked(value){
	if(!spyMasterMode) {
		if (activeGo && goes > 0) {
			currentGuesser = true;
			console.log("Setting you to the current guesser");
			var word = document.getElementById(value).getElementsByTagName('a')[0].innerHTML;
			
			$('#wordToConfirm').html(word);
			$('.modal-content').css('background-color', 'white');
			$('.modal-content').css('box-shadow', 'inset 0 -5px 1px' + COLOR_GREY);
			$('.modal-content').css('color', COLOR_GREY);
			confirmModal.style.display = "block";
			
			$('#yes').click(function(e) {
				e.preventDefault();
				confirmModal.style.display = "none";
				//only deactivate once reached max goes
				if (goes == 0) {
					console.log("max goes reached, deactivating players");
					//$('#goes').html('');
					$('#numInput').html("");
					activeGo = false;
				}
				//console.log("Sending id of " + value + " to server clicked listener");
				socket.emit('clicked', value);
			});
			
			$('#nope').click(function(e) {
				e.preventDefault();
				confirmModal.style.display = "none";
			});
			
			/*if (window.confirm("Are you sure you want to select '"+word+"'?")) {
				//only deactivate once reached max goes
				if (goes == 0) {
					console.log("max goes reached, deactivating players");
					//$('#goes').html('');
					$('#numInput').html("");
					activeGo = false;
				}
				//console.log("Sending id of " + value + " to server clicked listener");
				socket.emit('clicked', value);
			}*/
		}
		//currentGuesser = false;
	}
}

function wordCount(str) {
	return str.split(" ").length;
}

function giveClue() {
	if(activeSpy) {
		var clue = $('#clueBox').val();
		num = $('#num').val();
		console.log("Clue: " + clue + " Word Count:" + wordCount(clue));
		if (clue == "" || wordCount(clue) != 1 || num < 1) {
			//console.log("clue empty or no number provided");
			$('#errors').html("Please enter a 1 word clue and a number");
		}
		else {
			// check clue word is not contained in any of the table words. Use wordsSelected from server.
			socket.emit('checkClue', clue.toLowerCase(), function (data) {
				if(data) {
					console.log("clue not on board");					
					//$("#clue").html('');
					// Need to grey out the button & the input box
					$('#giveClue').css('background-color', COLOR_GREY);
					$('#giveClue').prop('value', 'Sent');
					//newColour = lighten(COLOR_GREY, DARKEN);
					//$('#giveClue').css('boxShadow', "inset 0 -5px 1px " + newColour);	
					$('#giveClue').css('boxShadow', "");	
					$('#clueBox').css('border', '1px solid ' + COLOR_PALE_GREY);
					$('#clueBox').val($('#clueBox').val()+ " sent!");
					$('#clueBox').css('color', COLOR_PALE_GREY);
					$('#num').css('border', '1px solid ' + COLOR_PALE_GREY);
					$('#clueBox').prop('readonly', true);
					$('#num').prop('disabled', true);
					$('#num').css('color', COLOR_PALE_GREY);
					$('#errors').html('');
					console.log("Sending clue: " + clue + " Num: " + num);
					activeSpy = false;
					console.log("Deactivating spymaster");
					socket.emit('clueGiven', { clue: clue, num: num });
				} else {
					console.log("Sorry! Clue word is contained on the board");
					$('#errors').html("Sorry! Clue word is contained on the board");
				}
			});
		}
	}
}

function update(percent){
	var deg;
	var colour;
	if(activeTeam) {
		colour = teamColour;
	} else {
		colour = COLOR_GREY;
	}
	if (percent<(totaltime/2)) {
		deg = 90 + (360*percent/totaltime);
		$('.pie').css('background-image','linear-gradient('+deg+'deg, transparent 50%, white 50%),linear-gradient(90deg, white 50%, transparent 50%)');
	} else if (percent>=(totaltime/2)) {	
		deg = -90 + (360*percent/totaltime);
        $('.pie').css('background-image','linear-gradient('+deg+'deg, transparent 50%, '+colour+' 50%),linear-gradient(90deg, white 50%, transparent 50%)');
	}
}

function lighten(color, luminosity) {

	// validate hex string
	color = new String(color).replace(/[^0-9a-f]/gi, '');
	if (color.length < 6) {
		color = color[0]+ color[0]+ color[1]+ color[1]+ color[2]+ color[2];
	}
	luminosity = luminosity || 0;

	// convert to decimal and change luminosity
	var newColor = "#", c, i, black = 0, white = 255;
	for (i = 0; i < 3; i++) {
		c = parseInt(color.substr(i*2,2), 16);
		c = Math.round(Math.min(Math.max(black, c + (luminosity * white)), white)).toString(16);
		newColor += ("00"+c).substr(c.length);
	}
	return newColor; 
}

function addCSSRule (sheet, selector, rules, index) {
	if("insertRule" in sheet) {
		sheet.insertRule(selector + "{" + rules + "}", index);
	} else if("addRule" in sheet) {
		sheet.addRule(selector, rules, index);
	}
}