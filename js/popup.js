function showName(){
	// Tries the code against API
	$.get('https://pavlok-stage.herokuapp.com/api/v1/me?access_token=' + accessToken)
	.done(function () {
		console.log("GOOD token. Works on API.");
		return true
	})
	.fail(function(){
		console.log("BAD token. Fails on API.");
		return false
	});
}

function showOptions(accessToken){
	if (isValid(localStorage.accessToken)){
	// if (accessToken){
		$(".onlyLogged").css('visibility', 'visible'); 
		$(".onlyUnlogged").css('display', 'none'); 
	}
	else { 
		$(".onlyLogged").css('visibility', 'hidden'); 
		$(".onlyUnlogged").css('display', 'block'); 
	}
}

function adjustOverInteractions(token, userName) {
	if (isValid(token)) {
		hideSignIn();
		showSignOut();
		showOptions();
		showName(userName);
	}
	else {
		hideOptions();
		hideName();
	}
	return
}


$( document ).ready(function() {
	$("#sign_in").click(function(){
		oauth();
	});
	
	$("#sign_out").click(function(){
		signOut();
	});
	
	// Restore Max Tabs
	if (localStorage.maxtabs == undefined) { localStorage.maxtabs = 6; }
	$("#maxtab").val(localStorage.maxtabs);
	$("#maxtab").change(function(){
		localStorage.maxtabs = $(this).val();
	});
	
	// Restore values for Black and White Lists along with enabling tags
	$('#blackList')[0].value = localStorage["blackList"];
	$('#blackList').tagsInput({
		'onChange' : saveBlackList,
		'defaultText':'Add site',
		'removeWithBackspace' : true
	});
	
	$('#whiteList')[0].value = localStorage["whiteList"];
	$('#whiteList').tagsInput({
		'onChange' : saveWhiteList,
		'defaultText':'Add site',
		'removeWithBackspace' : true
	});
	
	// Help boxes
	$('#whiteListHelp').hover(
	function(){
		$( '#whiteListHelpBox' ).fadeIn();
	},
	function(){
		$( '#whiteListHelpBox').fadeOut();
		}
	);
	
	 $('#blackListHelp').hover(
	function(){
		$( '#blackListHelpBox' ).fadeIn();
	},
	function(){
		$( '#blackListHelpBox').fadeOut();
		}
	);	

	$("#test_pairing").click(function(){
		stimuli("vibration", 230, localStorage.accessToken, "Incoming Vibration. You should receive a notification on your phone, followed by a vibration");
		
	});
	if (localStorage.logged == 'true') {
		// Toggle visibility for options
		$(".onlyLogged").css('visibility', 'visible');
		$(".onlyUnlogged").css('display', 'none');
		
	}
	
});