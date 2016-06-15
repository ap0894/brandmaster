var socket;
var spyMasterMode = false;
var activeSpy = false;
var playerName;
var COLOR_GREEN = "#009000";
//var COLOR_WHITE = "#ffffff";
var COLOR_PALE_GREY = "#cccccc";
var COLOR_GREY = "#b3b3b3";
var activeGo = false;
var room = "";
var goes = 0;
var num = 0;
var testing=true;
var totaltime = 60 * 2.5;
var teamColour;
var DARKEN = -0.1;

// this block executes when page DOM is ready
$( document ).ready(function() {
	connect ();
	socket.emit('getTeams');
	$("#endGo").hide();
	//$("#top").hide();
	$("#labels").hide();
	//$('#resetContainer').html("<div><input type=\'button\' class=\'btn btn-primary btn-sm\' id=\'reset\' value=\'Reset\'></input></div>");
	
	// Listener for click on Enter Game button
	$('#joinBtn').click(function(e){
		e.preventDefault();
		playerName = $('#pname').val();
		if (playerName == "" ) {
			console.log("Name was empty");
		} else {
			console.log("Registering Player: " + playerName);
			socket.emit('registerPlayer', playerName, function (data) {
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
	
	$('#reconnect').click(function(e) {
		e.preventDefault();
		reconnect();
	});
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
function createTeamTable(teams) {
	var output = "<div class=\"table teams\">";
	var columns = "";
	var head =  "<div class=\"table-row\">";
	var body = "";
	for (x=0; x<teams.length; x++) {
		columns += "<div class=\"table-column\" style=\"background-color:"+teams[x].colour+";border-radius: 10px;\"></div>";
		teamName = toTitleCase(teams[x].name);
		head = head + "<div class=\"table-cell\">" + teamName +  "</div>";
	}
	head += "</div>"
	
	//this doesn't work because teams[0] can be less than teams[1]
	for (i=0; i<teams[0].players.length; i++)
	{
		body = body + "<div class=\"table-row\">";
		for (j=0; j<teams.length; j++)
		{
			if (teams[j].players[i] != null) {
				if(teams[j].players[i].name == playerName ) {
					body = body + "<div class=\"table-cell\"><strong>"+ teams[j].players[i].name + "</strong></div>";
				} else {
					//console.log("Adding name " + teams[j].players[i] );
					body = body + "<div class=\"table-cell\">"+ teams[j].players[i].name + "</div>";
				}
			}
		}
		body = body + "</div>";
	}
	output = output + columns + head + body + "</div>";
	return output;
}

function createScoreTable(teams) {
	var output = "<table class=\"table\">";
	//var header = "<thead><tr>";
	var scores = "<tbody><tr>";
	for (x=0; x<teams.length; x++) {
		teamName = toTitleCase(teams[x].name);
		console.log(teams[x].name + " status: " + teams[x].active);
		if(teams[x].active) {
			//header = header + "<th style=\"font-size:1.5em; color:#b2b2b2\">" + "Team " + teamName + "</th>";
			newColour = lighten(teams[x].colour, DARKEN);
			scores = scores + "<td style=\"font-size:2em; background-color:" + teams[x].colour +"; color:white; border-radius:10px; width:90px; line-height:90px; box-shadow: inset 0 -10px 1px"+newColour+";\">" + teams[x].score + "/" + teams[x].target + "</td>";		
			//Add in another indicator for this team
		} else {
			//header = header + "<th style=\"color:#dadada\">" + "Team " + teamName + "</th>";
			scores = scores + "<td style=\"color:" + teams[x].colour +"\">" + teams[x].score + "/" + teams[x].target + "</td>";		
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
function connect () {
  
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
		//var fill;
	});

	// Handle teamSize event
	socket.on('teamSize', function(data) {
	   //console.log('Team Size:', data);
	   //$('#numPlayers').html("Players: "+ data.teamSize);
	   //document.getElementById('numPlayers').innerHTML = "Players =  "+ data.teamSize;
	   if (data.left >0 ) {
		$('#numPlayers').html("Waiting for "+ data.left + " more players");
	   }
	});

	// Handle game full event
	socket.on('gameFull', function(teams) {
		console.log("Game full");
		var output = createTeamTable(teams);
		$('#teams').html(output + "<br/> Sorry! Game full");
	});
	
	// Handle showClue event
	socket.on('showClue', function(data) {
		//the html for displaying the clue
		//$('#clue').html("<div>" + data.clue.toUpperCase() + " " + data.num + "</div>");
		//$('#clueBox').placeholder = data.clue.toUpperCase() + " " + data.num ;
		document.getElementById("clueBox").placeholder = data.clue.toUpperCase() + " " + data.num;
		//$('#history').append(data.clue.toUpperCase() + " " + data.num + "<br />");
		// Activate players
		if(room == data.whoseGo && !spyMasterMode) {
			console.log("Activating players in active team except the spymaster");
			goes = data.num; // Set the number of goes players can have
			goes++;
			activeGo = true; // Set player status active
			
			//$('#goes').html(goes + " guesses left");
			$('#numInput').html(goes + " guesses left");
			$('#numInput').css('color', teamColour);
			$('#numInput').css('font-size', '9pt');
			
			$('#endGo').attr("disabled", false);
			//var index = data.teams.map(function(e) { return e.name; }).indexOf(data.whoseGo);
			//$('#endGo').css('background-color', data.teams[index].colour);
			$('#endGo').css('background-color', teamColour);
			newColour = lighten(teamColour, DARKEN);
			$('#endGo').css('boxShadow', "inset 0 -10px 1px " + newColour);	
			$('#giveClue').hide();
		}
	});
	
	// Handle display board event
	socket.on('board', function(data) {
		$('#numPlayers').html('');
		$('#rules').remove();
		$('#teamTable').remove();
		
		//$('#banner').html('');
		//$('#board').css('display','block');
		//console.log("Generating player board");
		var board = "";
		var actions = "<div class=\"center\" id=\"top\"><div id=\"topWrap\"><div id=\"topInWrap\"><div id=\"pie\" class=\"pie degree middle\"><span class=\"block\"></span><span id=\"time\"></span></div><div class=\"middle\" id=\"clueWrap\"><div id=\"clue\"></div><div class=\"middle\" id=\"goes\"></div></div><div class=\"middle\" id=\"end\"></div></div></div></div>";
		//board += '<table class="board" id="board"><tbody>';
		for (var i = 0; i < data.trs.length; i++){
			//board += '<tr>'+data.trs[i]+'</tr>'
			board += data.trs[i];
		}
		//board += '</tbody></table>';
		//document.getElementById("board").innerHTML = board;
		$("#board").append(board);

		//console.log("Generating spymaster board");
		for(var j = 0; j < data.colours.length; j++){
			if(spyMasterMode) {
				document.getElementById(j).style.backgroundColor = data.colours[j];
				newColour = lighten(data.colours[j], DARKEN);
				document.getElementById(j).style.boxShadow = "inset 0 -10px 1px " + newColour;				
	
			} else {
				document.getElementById(j).style.backgroundColor = COLOR_PALE_GREY;
				newColour = lighten(COLOR_PALE_GREY, DARKEN);
				document.getElementById(j).style.boxShadow = "inset 0 -10px 1px " + newColour;	
				document.getElementById(j).style.color = "#4b4b4b";
			}
		}
		//$("#top").show();
		$('#actions').html(actions);
		$('.pie').css('background-color', teamColour);
	});
	
	// Handle the changing of tile colour event
	socket.on('changeColour',function(data) {
		//console.log("Received colours & value from server",  data);
		var theColours = data.colours;
		var theValue = data.value;
		if(spyMasterMode)
		{
			//Set tile white & clear it's contents
			document.getElementById(theValue).style.backgroundColor = COLOR_PALE_GREY ;
			document.getElementById(theValue).style.boxShadow = "inset 0 -10px 1px " + COLOR_PALE_GREY;
			document.getElementById(theValue).innerHTML = "" ;
		} 
		// not spy master
		else {
			document.getElementById(theValue).style.backgroundColor = theColours[theValue];
			//newColour = lighten(theColours[theValue], DARKEN);
			//"0 10px 1px " + newColour;
			//document.getElementById(theValue).style.boxShadow = "inset 0 -10px 1px " + newColour;	
			document.getElementById(theValue).style.boxShadow = "";	
			//document.getElementById(theValue).style.backgroundColor = theColours[theValue];
			var col;
			for (i=0; i<data.teams.length; i++) {
				if (data.teams[i].colour === theColours[theValue]) {
					col = data.teams[i].name;
				}
			}
			if(activeGo) {
				if(col) {
					socket.emit('score', col);
				}
				if (col == room ) {
					console.log("Correct keep guessing");
					goes--;
					//$('#goes').html(goes + " guesses left");
					$('#numInput').html(goes + " guesses left");
					if(goes > 0) {
						console.log("Goes left: ", goes);
					}
					else { 
						console.log("end of goes, switching");
						socket.emit('switch'); 
					}
				} else {
					console.log("Incorrect stop guessing & switching");
					goes = 0;
					socket.emit('switch');
				}
			}
		}
	});
	
	
	socket.on('endGame', function(teams) {
		alert("Game Over");
		console.log("Game Over, resetting");
		socket.emit('reset');
	});
	
	//Handle display team event
	socket.on('displayTeam', function (teams) {
		//$('#temp').remove();
		$('#waitMsg').remove();
		
		for (i=0; i<teams.length; i++)
		{
			if (teams[i].players.length > 0) {
				if(teams[i].players[0].name === playerName) {
					spyMasterMode = true;
					console.log("You are a code master");
				}
			}
		}
		
		var teamTable = createTeamTable(teams);
		$('#teamTable').html(teamTable);
	});
	
	//Handle display score event
	socket.on('displayScore', function (teams) {
		var scoreTable = createScoreTable(teams);
		$('#scoreTable').html(scoreTable);
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
		console.log("It's " + turn + " turn");
		$('#clue').html('');
		if (turn == room) {
			if(spyMasterMode) {
				console.log ("Spymaster active");
				$("#clue").html("<input id=\"clueBox\" type=\"text\" placeholder=\"Enter Brand...\"></input><div id=\"numInput\"><input id=\"num\" type=\"number\" min=\"1\" max=\"9\"></input></div><input type=\"button\" id=\"giveClue\" value=\"Send\" onclick=\"giveClue()\"></input>");
				//var index = data.teams.indexOf(turn);
				//var index = data.teams.map(function(e) { return e.name; }).indexOf(turn);
				$('#giveClue').css('background-color', teamColour);
				$('#clueBox').css('border', '1px solid ' + teamColour);
				$('#num').css('border', '1px solid ' + teamColour);
				newColour = lighten(teamColour, DARKEN);
				$('#giveClue').css('boxShadow', "inset 0 -10px 1px " + newColour);	
				activeSpy = true;
			}
			else {
				$("#clue").html("<input id=\"clueBox\" type=\"text\" placeholder=\"Waiting for brand...\" readonly></input><div id=\"numInput\"></div><input type=\"button\" id=\"endGo\" value=\"End Go!\"></input>");
				$('#endGo').attr("disabled", true);
				$('#endGo').css('background-color', COLOR_GREY);	
			}
		}
	});
}

function clicked(value){
	if(!spyMasterMode) {
		if (activeGo && goes > 0) {
			var word = document.getElementById(value).getElementsByTagName('a')[0].innerHTML;
			if (window.confirm("Are you sure you want to select '"+word+"'?")) {
				//only deactivate once reached max goes
				if (goes == 0) {
					console.log("max goes reached, deactivating players");
					//$('#goes').html('');
					$('#numInput').html("");
					activeGo = false;
				}
				//console.log("Sending id of " + value + " to server clicked listener");
				socket.emit('clicked', value);
			}
		}
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
			socket.emit('checkClue', clue, function (data) {
				if(data) {
					console.log("clue not on board");					
					//$("#clue").html('');
					// Need to grey out the button & the input box
					$('#giveClue').css('background-color', COLOR_GREY);
					$('#giveClue').prop('value', 'Sent');
					//newColour = lighten(COLOR_GREY, DARKEN);
					//$('#giveClue').css('boxShadow', "inset 0 -10px 1px " + newColour);	
					$('#giveClue').css('boxShadow', "");	
					$('#clueBox').css('border', '1px solid ' + COLOR_PALE_GREY);
					$('#num').css('border', '1px solid ' + COLOR_PALE_GREY);
					$('#clueBox').prop('readonly', true);
					$('#num').prop('readonly', true);
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
	if (percent<(totaltime/2)) {
		deg = 90 + (360*percent/totaltime);
		$('.pie').css('background-image','linear-gradient('+deg+'deg, transparent 50%, white 50%),linear-gradient(90deg, white 50%, transparent 50%)');
	} else if (percent>=(totaltime/2)) {	
		deg = -90 + (360*percent/totaltime);
        $('.pie').css('background-image','linear-gradient('+deg+'deg, transparent 50%, '+teamColour+' 50%),linear-gradient(90deg, white 50%, transparent 50%)');
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