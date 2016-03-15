/* To-do

*/
var pomoFocusP = {};
var pomoFocusO;
var pomoFocusB;

var todayDivTest;
var focusCompleteMsg = "IGAO Keep the zone going, you rock star!";
var focusStopMsg = ''; 
var defInt = '';			// Use default intensity for stimuli
var defAT = '';				// Use default Access Token for stimuli

function presentName(){
	if ( !localStorage.userName ) 	{ userInfo(localStorage.accessToken); }
	if ( localStorage.userName ) 	{ updateNameAndEmail(localStorage.userName, localStorage.userEmail); }
}

function enableTestButtons(){
	$("#beepTest").click(function(){ 
		stimuli("beep", defInt, defAT, "You'll get a Beep and a notification on your phone", "false"); 
	});
	$("#vibrateTest").click(function(){ 
		stimuli("vibration", defInt, defAT, "You'll get a Vibration and a notification on your phone", "false"); 
	});
	$("#zapTest").click(function(){
		stimuli("shock", defInt, defAT, "You'll get a Zap and a notification on your phone", "false"); 
	});
	
	$("#testPairing").click(function(){ 
		stimuli("vibration", defInt, defAT, "Your pairing works", "false");
	});
}

// function showOptions(accessToken){
	// if (isValid(localStorage.accessToken)){
		// $(".onlyLogged").css('visibility', 'visible'); 
		// $(".onlyUnlogged").css('display', 'none'); 
	// }
	// else { 
		// $(".onlyLogged").css('visibility', 'hidden'); 
		// $(".onlyUnlogged").css('display', 'block'); 
	// }
// }
function tabsAsAccordion(){
	// Get tab Elements
	var tabs = $( "tab" ).get();
	
	// Apply classes for it
	for (t = 0; t < tabs.length; t++){
		var curTab = tabs[t];
		var header = $(curTab).children()[0];
		var tabBody = $(curTab).children()[1];
		
		$(curTab).attr('id', ('tabs-'+t));
		$(header).addClass("pv-tab-header");
		$(tabBody).addClass("pv-tab-body");
	}
	
	toggleTabs();
}

function toggleTabs(){
	$(" #actionSection ").on('click', '.pv-tab-header', function(){
		var header = $(this);
		var tab = $(this).parent();
		var body = $(tab).children()[1];
		
		// If clicked on active tab, inactivate it and close all tabs
		if ($(tab).hasClass("pv-active-tab")){
			$(tab).removeClass("pv-active-tab");
			$(header).removeClass("pv-active-tab-header");
			$(body).removeClass("pv-active-tab-body");
		}
		else {
			// If clicked on inactive tab, inactivate others and activate it
			
			
			// Remove active class from all tabs
			var tabs = $( "tab" ).get();
			for (t = 0; t < tabs.length; t++){
				var curTab = tabs[t];
				var curHeader = $(curTab).children()[0];
				var curTabBody = $(curTab).children()[1];
			
				$(curTab).removeClass("pv-active-tab");
				$(curHeader).removeClass("pv-active-tab-header");
				$(curTabBody).removeClass("pv-active-tab-body");
			}
			
			// Add active class to clicked tab
			$(tab).addClass('pv-active-tab');
			$(header).addClass('pv-active-tab-header');
			$(body).addClass('pv-active-tab-body');
		
		}
		
		// Run blind effect on clicked tab body
		$('.pv-tab-body:not(.pv-active-tab-body)').hide(250);
		$('.pv-active-tab-body').toggle('blind', {}, 250);
	});
}

$( document ).ready(function() {
	enableTooltips();
	presentName();
	enableTestButtons();
	enableToDo();
	syncToDo('options');
	showOptions(localStorage.accessToken);
	restoreDailyList('.dailyContainer');
		
	tabsAsAccordion();
	$("#signOut").click(function(){
		if (isValid(localStorage.accessToken)){
			signOut();
		}
		else{
			oauth();
		}
	});
	});
	
	$("#instaZap").change(function(){
		lsSet('instaZap', $(this).prop( "checked" ));
	});
	$("#lockZap").change(function(){
		lsSet('lockZap', $(this).prop( "checked" ));
		
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
			curPAVTab = tabs[0];
			curPAVUrl = tabs[0].url;
			curPAVDomain = new URL(curPAVUrl).hostname.replace("www.", "");
			
			if(curPAVDomain.length == 0){
				console.log("unable to resolve domain for " + curPAVUrl);
				curPAVDomain = curPAVUrl;
			}
			
			lsSet('lockedTo', curPAVDomain);
			
		});
		
	});
});