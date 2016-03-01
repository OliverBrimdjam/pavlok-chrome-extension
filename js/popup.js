/* To-do

*/
var pomoFocusP = {};
var pomoFocusO;
var pomoFocusB;

var todayDivTest;
var focusCompleteMsg = "Keep the zone going, you rock star!";
var focusStopMsg = ''; 
var defInt = '';			// Use default intensity for stimuli
var defAT = '';				// Use default Access Token for stimuli

function presentName(){
	if ( !localStorage.userName ) 	{ userInfo(localStorage.accessToken); }
	if ( localStorage.userName ) 	{ updateNameAndEmail(localStorage.userName, localStorage.userEmail); }
}

function enableTestButtons(){
	$("#beepTest").click(function(){ 
		stimuli('beep', '255', defAT, "You'll get a Beep and a notification on your phone", 'false'); 
	});
	$("#vibrateTest").click(function(){ 
		stimuli('vibration', defInt, defAT, "You'll get a Vibration and a notification on your phone", 'false'); 
	});
	$("#zapTest").click(function(){
		stimuli('shock', defInt, defAT, "You'll get a Zap and a notification on your phone", 'false'); 
	});
}

function showOptions(accessToken){
	if (isValid(localStorage.accessToken)){
		$(".onlyLogged").css('visibility', 'visible'); 
		$(".onlyUnlogged").css('display', 'none'); 
	}
	else { 
		$(".onlyLogged").css('visibility', 'hidden'); 
		$(".onlyUnlogged").css('display', 'block'); 
	}
}

$( document ).ready(function() {
	enableTooltips();
	presentName();
	enableTestButtons();
	enableToDo();
	syncToDo('options');
	showOptions(localStorage.accessToken);
	restoreDailyList('.dailyContainer');
		
	$("#signOut").click(function(){
		signOut();
	});
	
	$("#instaZap").change(function(){
		lsSet('instaZap', $(this).prop( "checked" ));
	});
});