﻿/* To-do 
*/

var notTimeout;
var focusCompleteMsg = "Keep the zone going, you rock star!";
var focusStopMsg = '';
var defInt = '';			// Use default intensity for stimuli
var defAT = '';				// Use default Access Token for stimuli
var PFpromptForce = false;
var RTProdInterval;
var checkInterval;
var toDoChecker;

/* sandbox */

/* end of sandbox */

/* ***************************************************************** */
/* ***************                                   *************** */
/* ***************           TO-DO SECTION           *************** */
/* ***************                                   *************** */
/* ***************************************************************** */

function visibleDaily(targetRow, detailRow) {
	if ($(targetRow).hasClass("activeDailyTR")) {
		$(targetRow).removeClass("activeDailyTR");
		$(".taskDetailTR").hide(100,
			function () { $(".taskDetailTR").remove() });
	}
	else {
		// Restore actual active to regular before opening the new one
		$(".dailyListTR").removeClass("activeDailyTR");

		$(targetRow).addClass("activeDailyTR");

		// Manage presentation of new task details
		$(detailRow).show(400);
		$(detailRow).effect("highlight", { color: 'white' }, 400);
	}
}

function createDetailTR(targetRow) {
	var clickedId = parseInt(targetRow.attr("id"));

	// Removes any detail row before
	$(".taskDetailTR").hide(200).remove();

	// Insert a new TR for details of clicked task
	var newDetailTR = document.createElement("tr");
	newDetailTR.className = "taskDetailTR noDisplay";

	var newTD = document.createElement("td");
	newDetailTR.appendChild(newTD);
	newTD.colSpan = 3;

	$(targetRow).after(newDetailTR);

	// Fill details of the clicked task
	newTD.appendChild(testTodo.frontend.dailyDetail(clickedId));

	var task = testTodo.backend.read(clickedId);

	var blContent = task.blackList || '';
	var blackListDiv = $("#blackListTD").children()[0];
	$(blackListDiv).tagsInput({
		'defaultText': 'Add site... ie: facebook.com',
		'removeWithBackspace': true
	})
		.importTags(blContent);
	removeInlineStyle("#blackListDaily_tagsinput");

	var wlContent = task.whiteList || '';
	var whiteListDiv = $("#whiteListTD").children()[0];
	$(whiteListDiv).tagsInput({
		'defaultText': 'Add site... ie: facebook.com/groups/772212156222588/',
		'removeWithBackspace': true
	})
		.importTags(wlContent);
	removeInlineStyle("#whiteListDaily_tagsinput");

	// Show detail row and reformat clicked rows
	var detailRow = $(".taskDetailTR");

	visibleDaily(targetRow, detailRow);
}

function fillDailyList() {
	$('.dailyListTR').remove()
	var allTasks = lsGet('allTasks', 'parse');
	var dailyList = _.where(allTasks, { daily: true });
	dailyList = dailyList.reverse();

	for (d = 0; d < dailyList.length; d++) {
		var daily = dailyList[d];
		var speciaList;
		if (daily.specialList == true) { specialList = 'Using'; }
		else { specialList = 'Not Using'; }

		var newLine = '' +
			'<tr id="' + daily.id + '" class="dailyListTR">' +
			'<td>' + daily.task + '</td>' +
			'<td>' + daily.pomos + " x " + daily.duration + " min" + '</td>' +
			'<td>' + specialList + '</td>' +
			'</tr>' +
			'<tr id="' + daily.id + 'details" class="dailyDetailTR">' +

			'</tr>'
			;

		$('#dailyListTable > tbody').append(newLine);
	}
}

function listenDailyListClick() {
	$("#dailyListTable tbody ").on('click', '.dailyListTR', function () {
		var clickedTR = $(this);
		var clickedId = parseInt($(this).attr('id'));

		createDetailTR(clickedTR);
	});

	$("#createNewDailyTaskButton").click(function () {
		var newTaskName = $("#newDailyTaskInput").val()
		if (newTaskName.length > 0 && newTaskName != " ") {
			$('#newDailyTaskInput').val('');

			var newDaily = {
				task: newTaskName,
				daily: true,
				pomos: 1,
			};

			newDaily = testTodo.backend.create(newDaily);

			testTodo.frontend.restoreTasks("options");

			fillDailyList();
			createDetailTR($("#" + newDaily.id));
			msgInterfaces({ action: "updateDaily" });

		} else {
			return
		}
	});

	$("#testBinaural").click(function () {
		sampleBinaural();
	});

	$("#dailyListTable").on('click', '#specialListsInput', function (event) {
		var checked = $('#specialListsInput').prop('checked');
		if (checked == true) {
			$("#blackListDaily").tagsInput();
			$("#whiteListDaily").tagsInput();
			$('.specialListDisplay').show(300);
		}
		else {
			$('.specialListDisplay').hide(300);
		}
	});

	$("#dailyListTable").on('click', '#saveDaily', function (event) {
		event.preventDefault();

		var updates = testTodo.helpers.gatherDaily();
		var task = testTodo.backend.update(updates.id, updates);
		log(task);

		$(".taskDetailTR").hide(300, function () { $(".taskDetailTR").remove() });

		fillDailyList();
		visibleDaily($(".activeDailyTR"));
	});

	$("#dailyListTable").on('click', '#deleteDaily', function (event) {
		event.preventDefault();

		var id = parseInt($('#dailyTaskIdInput').val());
		testTodo.backend.delete(id);
		visibleDaily($(".activeDailyTR"));
		fillDailyList();
	});
}

function enableBlackDaily() {
	$('#blackListDaily').tagsInput({
		'defaultText': 'Add site... ie: facebook.com',
		'removeWithBackspace': true
	});
	$('#blackListDaily_tagsinput').attr('style', '');


	$('#whiteListDaily').tagsInput({
		'defaultText': 'facebook.com/groups/772212156222588/',
		'removeWithBackspace': true
	});
	$('#whiteListDaily_tagsinput').attr('style', '');
}

function enableDaily() {
	fillDailyList();
	listenDailyListClick();
}

/* ***************************************************************** */
/* ***************                                   *************** */
/* ***************        RESCUETIME SECTION         *************** */
/* ***************                                   *************** */
/* ***************************************************************** */

// Helpers
function changeRTVisibility() {
	APIKey = lsGet("RTAPIKey");
	if (APIKey == undefined || APIKey == 'null' || APIKey == false) {
		$("#RTCodeOnly").addClass("noDisplay");
		$("#NoRTCodeOnly").removeClass("noDisplay");
		$("#RTAPIKeySpan").text('');

	} else {
		$("#RTCodeOnly").removeClass("noDisplay");
		$("#NoRTCodeOnly").addClass("noDisplay");
		$("#RTAPIKeySpan").text(lsGet("RTAPIKey"));
	}
}

function regressRTHour(deltaMinutes) {

	var original = lsGet("Comment");
	var originalDate = [original.split(" ")[8], original.split(" ")[9]];

	var year = originalDate[0].split("-")[0];
	var month = originalDate[0].split("-")[1];
	var day = originalDate[0].split("-")[2];

	var hours = originalDate[1].split(":")[0];
	var minutes = originalDate[1].split(":")[1];
	var seconds = originalDate[1].split(":")[2];
	var milliseconds = 0;

	var d = new Date(year, month, day, hours, minutes, seconds, milliseconds);

	var d2 = new Date(d);
	d2.setMinutes(d.getMinutes() + deltaMinutes);

	return d2
}

function updateProductivity() {
	RTProdInterval = setInterval(function () {
		if (lsGet("RTOnOffSelect") == "On") {
			if (!lsGet("Comment")) { return }
			var beginCycle = regressRTHour(-30);
			var beginHours = beginCycle.getHours() + ":" + beginCycle.getMinutes() + ":" + beginCycle.getSeconds();
			if (parseInt(lsGet("RTPulse")) > 0) {
				$("#RTResultsHolder").html("Your Productivity pulse was <b>" + lsGet("RTPulse") + "</b>.");
				$("#RTResultsHolder").attr('title', 'Measured from ' + beginHours + " to " + lsGet("RTHour"));
			}
			else {
				$("#RTResultsHolder").html("Too little time evaluated from <b>" + lsGet("RTHour") + "</b>. Check back in 15 minutes or so.");
				$("#RTResultsHolder").attr('title', 'Measured from ' + beginHours + " to " + lsGet("RTHour"));
			}
		}
	}, 3 * 1000);
}

function updateRTLimits() {
	var PosLimitMax = 100;
	// var PosLimitMin = parseInt(lsGet("RTWarnLimit"));
	var PosLimitMin = $("#RTWarnLimit").spinner("value");
	var PosValue = $("#RTPosLimit").spinner("value");

	var WarnLimitMax = $("#RTPosLimit").spinner("value");
	var WarnLimitMin = $("#RTNegLimit").spinner("value");
	var WarnValue = $("#RTWarnLimit").spinner("value");

	var NegLimitMax = $("#RTWarnLimit").spinner("value");
	var NegLimitMin = 0;
	var NegValue = $("#RTNegLimit").spinner("value");

	// There should be no cross over
	if (NegLimitMax > WarnLimitMax) {
		WarnValue = WarnLimitMax;
	}

	var PosLimit = $("#RTPosLimit").spinner({
		max: PosLimitMax,
		min: PosLimitMin
	});
	var WarnLimit = $("#RTWarnLimit").spinner({
		max: WarnLimitMax,
		min: WarnLimitMin
	});
	var NegLimit = $("#RTNegLimit").spinner({
		max: NegLimitMax,
		min: NegLimitMin
	});

	lsSet("RTPosLimit", PosValue);
	lsSet("RTWarnLimit", WarnValue);
	lsSet("RTNegLimit", NegValue);
	confirmUpdate(notifyUpdate);
	return
}

// Enabler
function enableRescueTime() {
	$("#fireRTIntegration").click(function () {
		var APIKey = $("#rescueTimeAPIKey").val();
		lsSet("RTAPIKey", APIKey);
		changeRTVisibility();
	});

	if (lsGet("RTPulse") && lsGet("RTOnOffSelect")) { changeRTVisibility(); }
	if (lsGet("RTOnOffSelect") == "On") { updateProductivity(); }

	$("#RTOnOffSelect").change(function () {
		var RTOnOffSelect = $(this).val();
		confirmUpdate(notifyUpdate);
		lsSet("RTOnOffSelect", RTOnOffSelect);
		if (RTOnOffSelect == "On") {
			updateProductivity();
			$("#RTResultsHolder").css('visibility', 'visible');
		} else {
			$("#RTResultsHolder").css('visibility', 'hidden');
		}
	});

	var RTFreq = lsGet('RTFrequency') || 3;
	$("#RTFrequencySelect").val(RTFreq);

	$("#RTFrequencySelect").change(function () {
		lsSet("RTFrequency", $(this).val());
		confirmUpdate(notifyUpdate);
	});

	$("#removeRTAPIKey").click(function () {
		var msg = "Have you been noticing that you receive beeps when you are being unproductive, and vibrations when you are being very productive?<br/><br/>Keeping this integration will help you become a productive, healthy individual. Are you sure you want to disconnect Pavlok from RescueTime?";

		var options = {

		};
		$.prompt(msg, {
			title: "Your Pavlok will disconnect from RescueTime. But are you sure you want to do that?",
			html: msg,
			defaultButton: 1,
			buttons: { "No, I want to be productive": false, "Yes, disconnect from RescueTime": true },
			submit: function (e, v, m, f) {
				log("result was " + v);
				var result = v;
				if (result == true) {
					lsDel("RTAPIKey");
					$("#rescueTimeAPIKey").val('');
					$("#RTOnOffSelect").val('Off');
					lsSet('RTOnOffSelect', 'Off');
					changeRTVisibility();
					confirmUpdate(notifyUpdate);
				}
			}
		});
	});

	// Enable spinners
	var PosLimit = $("#RTPosLimit").spinner({
		min: parseInt(lsGet("RTWarnLimit")),
		max: 100,
		page: 10,
		step: 5,
		change: function (event, ui) {
			updateRTLimits();
		}
	});

	var WarnLimit = $("#RTWarnLimit").spinner({
		min: parseInt(lsGet("RTNegLimit")),
		max: parseInt(lsGet("RTPosLimit")),
		page: 10,
		step: 5,
		change: function (event, ui) { updateRTLimits() }
	});

	var NegLimit = $("#RTNegLimit").spinner({
		min: 0,
		max: parseInt(lsGet("RTWarnLimit")),
		page: 10,
		step: 5,
		change: function (event, ui) { updateRTLimits() }
	});

	$(".RTThreshold").change(function () {

		var PosLimitMax = 100;
		var PosLimitMin = parseInt(lsGet("RTPosLimit"));
		var PosValue = $("#RTPosLimit").spinner("value");

		var WarnLimitMax = parseInt(lsGet("RTWarnLimit"));
		var WarnLimitMin = parseInt(lsGet("RTNegLimit"));
		var WarnValue = $("#RTWarnLimit").spinner("value");

		var NegLimitMax = parseInt(lsGet("RTNegLimit"));
		var NegLimitMin = 0;
		var NegValue = $("#RTNegLimit").spinner("value");

		// There should be no cross over
		if (NegLimitMax > WarnLimitMax) {
			WarnValue = WarnLimitMax;
		}

		lsSet("RTPosLimit", PosValue);
		lsSet("RTWarnLimit", WarnValue);
		lsSet("RTNegLimit", NegValue);
		confirmUpdate(notifyUpdate);
	});

	// Restore values
	$("#RTPosLimit").val(parseInt(lsGet("RTPosLimit")));
	$("#RTWarnLimit").val(parseInt(lsGet("RTWarnLimit")));
	$("#RTNegLimit").val(parseInt(lsGet("RTNegLimit")));

	$("#RTPosSti").val(lsGet("RTPosSti"));
	$("#RTWarnSti").val(lsGet("RTWarnSti"));
	$("#RTNegSti").val(lsGet("RTNegSti"));

	// Save Values:
	$("#RTPosLimit").change(function () { lsSet("RTPosLimit", $(this).val()); });
	$("#RTWarnLimit").change(function () { lsSet("RTWarnLimit", $(this).val()); });
	$("#RTNegLimit").change(function () { lsSet("RTNegLimit", $(this).val()); });

	$("#RTPosSti").change(function () { lsSet("RTPosSti", $(this).val()); });
	$("#RTWarnSti").change(function () { lsSet("RTWarnSti", $(this).val()); });
	$("#RTNegSti").change(function () { lsSet("RTNegSti", $(this).val()); });

	changeRTVisibility();
}


/* ***************************************************************** */
/* ***************                                   *************** */
/* ***************        AUTOZAPPER SECTION         *************** */
/* ***************                                   *************** */
/* ***************************************************************** */

// Helpers
function enableTimers() {
	$.widget("ui.timespinner", $.ui.spinner, {
		options: {
			// seconds
			step: 15 * 60 * 1000,
			// hours
			page: 60
		},

		_parse: function (value) {
			if (typeof value === "string") {
				// already a timestamp
				if (Number(value) == value) {
					return Number(value);
				}
				return Globalize.parseDate(value);
			}
			return value;
		},

		_format: function (value) {
			return Globalize.format(new Date(value), "t");
		}
	});

	$(function () {
		$("#generalActiveTimeStart").timespinner({
			change: function (event, ui) {
				lsSet("generalActiveTimeStart", $(this).val());
				countTabs(lsGet("tabCountAll"), UpdateTabCount);
				confirmUpdate(notifyUpdate);
			},
		});
		$("#generalActiveTimeEnd").timespinner({
			change: function (event, ui) {
				lsSet("generalActiveTimeEnd", $(this).val());
				countTabs(lsGet("tabCountAll"), UpdateTabCount);
				confirmUpdate(notifyUpdate);
			}
		});

		$("#timeFormat").change(function () {
			lsSet('timeFormat', $(this).val());
			countTabs(lsGet("tabCountAll"), UpdateTabCount);

			var currentStart = $("#generalActiveTimeStart").timespinner("value");
			var currentEnd = $("#generalActiveTimeEnd").timespinner("value");

			var selectedOption = $(this).val();
			if (selectedOption == "24") { culture = "de-DE" }
			else if (selectedOption == "12") { culture = "en-EN" };

			Globalize.culture(culture);
			$("#generalActiveTimeStart").timespinner("value", currentStart);
			$("#generalActiveTimeEnd").timespinner("value", currentEnd);
		});
	});
}

function toggleAutoZapperConf(toState) {
	if (toState == "configure") {
		$(".autoZapperConf").removeClass("noDisplay");
		$(".autoZapperActive").addClass("noDisplay");

	}
	else if (toState == "train") {
		$(".autoZapperActive").removeClass("noDisplay");
		$(".autoZapperConf").addClass("noDisplay");
	}
}

function enableAutoZapper() {
	// var date = new Date(new Date().valueOf() + parseInt(lsGet("trainingSessionZD")));
	$('#countDownTraining').countdown(new Date(), function (event) {
		$(this).html(event.strftime('%M:%S'));
	})
		.on('finish.countdown', function (event) {
			$.prompt("Session Finished! Congratulations!");
			clearInterval(lsGet("trainingSession"));
			lsSet("trainingSession", 'false');
			lsSet("trainingSessionZI", '');
			lsSet("trainingSessionZD", '');
			lsSet("trainingSessionZF", '');

			toggleAutoZapperConf("configure");

		});


	var intensity = $("#autoZapperIntensity").spinner({
		min: 10,
		max: 100,
		page: 10,
		step: 10,
		change: confirmUpdate
	});
	intensity.val(60);

	var duration = $("#autoZapperDuration").spinner({
		min: 1,
		max: 60,
		page: 1,
		step: 1,
		change: confirmUpdate
	});
	duration.val(5);

	var frequency = $("#autoZapperFrequency").spinner({
		min: 2,
		max: 30,
		page: 1,
		step: 1,
		change: confirmUpdate
	});
	frequency.val(5);

	$("#autoZapperStart").click(function (event) {
		event.preventDefault();
		$.prompt("Starting <b>zaps on " + intensity.val() + "%</b>...<br />" +
			"for <b>" + duration.val() + " minutes</b><br />" +
			"zapping <b>every " + frequency.val() + " seconds</b>.", {
			title: "Are you Ready?",
			buttons: { "Yes, I'm Ready": true, "No, let me change this": false },
			submit: function (e, v, m, f) {
				log("result was " + v);
				var result = v;
				if (result == true) {
					var zapInt = percentToRaw(parseInt($("#autoZapperIntensity").val()), 'zap');
					var zapFreq = parseInt($("#autoZapperFrequency").val()) * 1000;
					var zapDur = parseInt($("#autoZapperDuration").val()) * 60 * 1000;

					lsSet("trainingSessionZI", zapInt);
					lsSet("trainingSessionZF", zapFreq);
					lsSet("trainingSessionZD", zapDur);

					// Update interface
					toggleAutoZapperConf("train");
					// Start Count Down Timer
					var date = new Date(new Date().valueOf() + parseInt(lsGet("trainingSessionZD")));
					$('#countDownTraining').countdown(date, function (event) {
						$(this).html(event.strftime('%M:%S'));
					})
						.on('finish.countdown', function (event) {
							// // // $.prompt("Session Finished! Congratulations!");
							clearInterval(lsGet("trainingSession"));
							lsSet("trainingSession", 'false');
							lsSet("trainingSessionZI", '');
							lsSet("trainingSessionZD", '');
							lsSet("trainingSessionZF", '');

							toggleAutoZapperConf("configure");

						});

					var trainingSession = setInterval(function () {
						log("Occured at ");
						stimuli("shock", lsGet("trainingSessionZI"), defAT, "Training Session. Keep going!", "false");
					}, parseInt(lsGet("trainingSessionZF")));
					lsSet("trainingSession", trainingSession);

					// var endTraining = setTimeout(function(){ 
					// clearInterval(trainingSession);
					// $.prompt("Congratulations! Session is over!");
					// lsSet("trainingSession", 'false');
					// lsSet("trainingSessionZI", '');
					// lsSet("trainingSessionZD", '');
					// lsSet("trainingSessionZF", '');

					// }, parseInt(lsGet("trainingSessionZD")));
					// lsSet("endTraining", endTraining);
				}
			}
		});
	});

	$("#autoZapperStop").click(function (event) {
		event.preventDefault();
		clearInterval(parseInt(lsGet("trainingSession")));
		$.prompt("Traning session canceled", "Your training session is now over");

		toggleAutoZapperConf("configure");
	});
}

function enableSelecatbles() {
	$("#selectable").selectable({
		filter: ".tdSelectable",
		stop: function () {
			var result = $("#select-result").empty();
			$(".ui-selected", this).each(function () {
				var index = $("#selectable td").index(this);
				result.append(" #" + (index + 1));
			});
		}
	});
}

function restoreCheckBox(checkboxID, condition) {
	if (condition == 'true') { $("#" + checkboxID).prop('checked', true); }
	else { $("#" + checkboxID).prop('checked', false); }
}



/* ***************************************************************** */
/* ***************                                   *************** */
/* ***************        ALL AROUND SECTION         *************** */
/* ***************                                   *************** */
/* ***************************************************************** */

function enableCoach() {
	chrome.runtime.sendMessage(
		// Warns background about new page being loaded
		{
			target: "background",
			action: "coachChange",
			change: "sync"
		},

		function (response) {
			if (response) {
				log(response);
				$("#coachPower").prop("checked", (response.status || false));
			}
		}
	);

	$("#coachPower").change(function () {
		var status = $(this).prop("checked");
		msgBackground({
			action: "coachChange",
			change: "status",
			status: status
		});
	});
}

function enableTodoist() {
	$("#todoistLogin").click(function (event) {
		event.preventDefault();

		log("clicked on todoist");
		msgBackground({
			action: "todoistChange",
			change: "oauth"
		});
	});

	todoist.frontend.toggle();

	$("#importTodoist").click(function (event) {
		event.preventDefault();

		msgBackground({
			action: "todoistChange",
			change: "import"
		});
	});

	$("#signOutTodoist").click(function (event) {
		event.preventDefault();

		log("unlogging from todoist");
		msgBackground({
			action: "todoistChange",
			change: "signOut"
		});
	});
}

function enableSignInOut() {
	$("#signOutX").click(function () {
		msgBackground({ action: "signOut" });
	});
}

function adjustSliders(curPos, fixedHeader) {
	var sliders = [$("#sliderBeep"), $("#sliderVibration"), $("#sliderZap")];

	for (s = 0; s < sliders.length; s++) {
		var curSlider = sliders[s];
		var curContainer = $(curSlider).parent();
		var curH = curSlider.offset().top;

		if (curPos > curH - fixedHeader) {
			$(curContainer).css("visibility", "hidden");
		}
		else {
			$(curContainer).css("visibility", "visible")
		}
	}

}

function adjustSpinners(curPos, fixedHeaderSize) {
	var spinners = [$("#autoZapperStartLine"), $("#RTPosTR"), $("#RTWarnTR"), $("#RTNegTR"), $("#generalActiveHours")];

	var visiblePos = curPos + fixedHeaderSize;

	for (s = 0; s < spinners.length; s++) {
		var curSpinner = spinners[s];
		var curH = curSpinner.offset().top;
		// var curH = curH - fixedHeaderSize;

		if (curPos > curH - fixedHeaderSize) {
			// if (curPos >= curH){
			$(curSpinner).css("visibility", "hidden");
		}
		else {
			$(curSpinner).css("visibility", "visible")
		}
	}
}

function highlightActiveSection(curPos, fixedHeaderSize) {
	var tops = [
		$("#blackListContainerDiv").offset().top,
		$("#tabNumbersContainerDiv").offset().top,
		$("#stimuliContainerDiv").offset().top,
		$("#toDoContainerDiv").offset().top,
		$("#appIntegrationsContainerDiv").offset().top,
		$("#advancedOptionsContainerDiv").offset().top,
	];

	var sections = [
		"blackList",
		"tabNumbers",
		"stimuli",
		"toDo",
		"appIntegrations",
		"advancedOptions",
	]
	var visiblePos = curPos + fixedHeaderSize;

	var difs = [];
	// Checks which one have already been passed by
	for (n = 0; n < tops.length; n++) {
		difs.push(tops[n] - visiblePos);
	}

	var passed = _.countBy(difs, function (num) {
		return num <= 0 ? 'reached' : 'ahead';
	});

	if (passed.ahead == sections.length) { passed.reached = 1; }

	var active = passed.reached - 1;
	$("#indexDiv").children().removeClass("activeSection");
	$($("#indexDiv").children()[active]).addClass("activeSection")

}

function enableSelects() {
	$("#blackListTimeWindow").change(function () {
		lsSet("timeWindow", $(this).val());
	});
}

function enableButtons() {
	$("#testPairingX").click(function () {
		stimuli("vibration", 230, defAT, "Incoming Vibration. You should receive a notification on your phone, followed by a vibration");
	});

	$("#testBeepInt").click(function () {
		stimuli("beep", defInt, defAT, "Incoming Beep. You should receive a notification on your phone, followed by a beep");
	});

	$("#testZapInt").click(function () {
		stimuli("shock", defInt, defAT, "Incoming Zap. You should receive a notification on your phone, followed by a zap");
	});

	$("#testVibrationInt").click(function () {
		stimuli("vibration", defInt, defAT, "Incoming Vibration. You should receive a notification on your phone, followed by a vibration");
	});

	$("#signIn").click(function () {
		oauth();
	});

	$("#signOut").click(function () {
		signOut();
	});

	$("#rescueTimeOAuth").click(function () {
		rescueTimeOAuth();
	});
}

function enableSpiners() {
	$("#autoZapperIntensity").spiner();
}

function enableTables() { // TO-do update or remove
	// $('#sundayActiveTimeStart').timepicker({
	// // // // $('.timeSelectors').timepicker({
	// // // // showPeriod: true,
	// // // // showLeadingZero: true
	// // // // });

}

function enableSliders() {
	$(function () {
		defZap = parseInt(lsGet('zapPosition'));
		defVib = parseInt(lsGet('vibrationPosition'));
		defBeep = parseInt(lsGet('beepPosition'));

		$("#sliderBeep").slider({
			value: defBeep,
			min: 10,
			max: 100,
			step: 10,
			slide: function (event, ui) {
				var beepPos = ui.value;
				log(beepPos);
				lsSet('beepPosition', beepPos);
				lsSet('beepIntensity', percentToRaw(beepPos, 'beep'));
				$("#beepIntensity").html(beepPos + "%");
				confirmUpdate(notifyUpdate);
				msgInterfaces({ action: "updateStimuli" });
			}
		});
		$("#beepIntensity").html(defBeep + "%");

		$("#sliderZap").slider({
			value: defZap,
			min: 10,
			max: 100,
			step: 10,
			slide: function (event, ui) {
				var zapPos = ui.value;
				lsSet('zapPosition', zapPos);
				lsSet('zapIntensity', percentToRaw(zapPos, 'zap'));
				$("#zapIntensity").html(zapPos + "%");
				confirmUpdate(notifyUpdate);
				msgInterfaces({ action: "updateStimuli" });
			}
		});
		$("#zapIntensity").html(defZap + "%");

		$("#sliderVibration").slider({
			value: defVib,
			min: 10,
			max: 100,
			step: 10,
			slide: function (event, ui) {
				var vibPos = ui.value;
				lsSet('vibrationPosition', vibPos);
				lsSet('vibrationIntensity', percentToRaw(vibPos, 'vibrate'));
				$("#vibrationIntensity").html(vibPos + "%");
				confirmUpdate(notifyUpdate);
				msgInterfaces({ action: "updateStimuli" });
			}

		});
		$("#vibrationIntensity").html(defVib + "%");


	});

	$("#resetIntensity").click(function (event) {
		event.preventDefault();

		var defVib = 60;
		var defZap = 60;
		var defBeep = 100;

		lsSet('vibrationPosition', defVib);
		lsSet('vibrationIntensity', percentToRaw(defVib, 'vibrate'));
		$("#vibrationIntensity").html(defVib + "%");
		$("#sliderVibration").slider({ value: defVib });

		lsSet('zapPosition', defZap);
		lsSet('zapIntensity', percentToRaw(defZap, 'zap'));
		$("#zapIntensity").html(defZap + "%");
		$("#sliderZap").slider({ value: defZap });

		lsSet('beepPosition', defBeep);
		lsSet('beepIntensity', percentToRaw(defBeep, 'beep'));
		$("#beepIntensity").html(defBeep + "%");
		$("#sliderBeep").slider({ value: defBeep });
	});

}

function enableCheckboxes() {
	// Active days
	$(".activeDay").change(function () {
		countTabs(lsGet("tabCountAll"), UpdateTabCount);
	});

	$("#sundayActive").change(function () {
		lsSet('sundayActive', $(this).prop("checked"));
	});
	$("#mondayActive").change(function () {
		lsSet('mondayActive', $(this).prop("checked"));
	});
	$("#tuesdayActive").change(function () {
		lsSet('tuesdayActive', $(this).prop("checked"));
	});
	$("#wednesdayActive").change(function () {
		lsSet('wednesdayActive', $(this).prop("checked"));
	});
	$("#thursdayActive").change(function () {
		lsSet('thursdayActive', $(this).prop("checked"));
	});
	$("#fridayActive").change(function () {
		lsSet('fridayActive', $(this).prop("checked"));
	});
	$("#saturdayActive").change(function () {
		lsSet('saturdayActive', $(this).prop("checked"));
	});
	$("#eachDay").change(function () {
		var advanced = $(this).prop("checked");
		alert("each Day is " + advanced);
		if (advanced == true) {
			$("#singleDayTimeTR").css("display", "block");
		} else {
			$("#singleDayTimeTR").css("display", "none");
		}
	});

}

function enableInputs() {
	// Advanced day to day
	$("#sundayActiveTimeStart").change(function () {
		lsSet('sundayActiveTimeStart', $(this).val());
	});

	$("#sundayActiveTimeEnd").change(function () {
		lsSet('sundayActiveTimeEnd', $(this).val());
	});

	$("#mondayActiveTimeStart").change(function () {
		lsSet('mondayActiveTimeStart', $(this).val());
	});

	$("#mondayActiveTimeEnd").change(function () {
		lsSet('mondayActiveTimeEnd', $(this).val());
	});

	$("#tuesdayActiveTimeStart").change(function () {
		lsSet('tuesdayActiveTimeStart', $(this).val());
	});

	$("#tuesdayActiveTimeEnd").change(function () {
		lsSet('tuesdayActiveTimeEnd', $(this).val());
	});

	$("#wednesdayActiveTimeStart").change(function () {
		lsSet('wednesdayActiveTimeStart', $(this).val());
	});

	$("#wednesdayActiveTimeEnd").change(function () {
		lsSet('wednesdayActiveTimeEnd', $(this).val());
	});

	$("#thursdayActiveTimeStart").change(function () {
		lsSet('thursdayActiveTimeStart', $(this).val());
	});

	$("#thursdayActiveTimeEnd").change(function () {
		lsSet('thursdayActiveTimeEnd', $(this).val());
	});

	$("#fridayActiveTimeStart").change(function () {
		lsSet('fridayActiveTimeStart', $(this).val());
	});

	$("#fridayActiveTimeEnd").change(function () {
		lsSet('fridayActiveTimeEnd', $(this).val());
	});

	$("#saturdayActiveTimeStart").change(function () {
		lsSet('fridayActiveTimeStart', $(this).val());
	});

	$("#saturdayActiveTimeEnd").change(function () {
		lsSet('fridayActiveTimeEnd', $(this).val());
	});

}

function saveOptions() {

	var blackList = $("#blackList")[0].value;
	lsSet('blackList', blackList);

	var whiteList = $("#whiteList")[0].value;
	lsSet('whiteList', whiteList);

	var maxTabs = $("#maxTabsSelect").val();
	lsSet('maxTabs', maxTabs);

	var zapOnClose = $("#zapOnClose").prop('checked');
	lsSet('zapOnClose', zapOnClose);

	var beepPosition = $("#sliderBeep").slider("option", "value");
	beepIntensity = percentToRaw(beepPosition, 'beep'); // convert to 1-255 interval
	lsSet('beepIntensity', beepIntensity);

	var zapPosition = $("#sliderZap").slider("option", "value");
	zapIntensity = percentToRaw(zapPosition, 'zap'); // convert to 1-255 interval
	lsSet('zapIntensity', zapIntensity);

	var vibrationPosition = $("#sliderVibration").slider("option", "value");
	vibrationIntensity = percentToRaw(vibrationPosition, 'vibrate');
	lsSet('vibrationIntensity', vibrationIntensity);

	confirmUpdate(notifyUpdate);
}

function restoreOptions() {

	// User name and email
	updateNameAndEmail(lsGet("userName"), lsGet("userEmail"));

	// Black and white lists
	var blackList = lsGet("blackList");
	// log(blackList);
	if (blackList == undefined) { blackList = ' '; }
	// $("#blackList").val(blackList);
	$("#blackList").importTags(blackList);

	var whiteList = lsGet("whiteList");
	if (whiteList == undefined) { whiteList = ' '; }
	$("#whiteList").val(whiteList);

	// Scheduler
	var timeFormat = lsGet("timeFormat");
	$("#timeFormat").val(timeFormat);

	var startHour = lsGet("generalActiveTimeStart");
	$("#generalActiveTimeStart").val(startHour);
	var endHour = lsGet("generalActiveTimeEnd");
	$("#generalActiveTimeEnd").val(endHour);

	$("#blackListTimeWindow").val(lsGet("timeWindow"))

	// Checkboxes
	restoreCheckBox('zapOnClose', lsGet("zapOnClose"));
	restoreCheckBox('notifyZap', lsGet("notifyZap"));
	restoreCheckBox('notifyVibration', lsGet("notifyVibration"));
	restoreCheckBox('notifyBeep', lsGet("notifyBeep"));

	restoreCheckBox('sundayActive', lsGet("sundayActive"));
	restoreCheckBox('mondayActive', lsGet("mondayActive"));
	restoreCheckBox('tuesdayActive', lsGet("tuesdayActive"));
	restoreCheckBox('wednesdayActive', lsGet("wednesdayActive"));
	restoreCheckBox('thursdayActive', lsGet("thursdayActive"));
	restoreCheckBox('fridayActive', lsGet("fridayActive"));
	restoreCheckBox('saturdayActive', lsGet("saturdayActive"));

	restoreCheckBox('tabNumbersActiveCheckbox', lsGet("tabNumbersActive"));
	$("#tabNumbersActiveCheckbox").change(function () {
		lsSet("tabNumbersActive", $(this).prop('checked'));
	});

	$("#allTabsCountSelect").val(lsGet("tabCountAll"));
	$("#allTabsCountSelect").change(function () {
		lsSet("tabCountAll", $(this).val());
		confirmUpdate(notifyUpdate);
	});

	// $("#maxTabsSelect").val(lsGet("maxTabs"));

	$("#timeFormat").val(lsGet("timeFormat"));

	// Stimuli Intensity
	if (parseInt(lsGet("beepPosition")) > 0) {
		var beepSlider = lsGet("beepPosition");
	} else { var beepSlider = 60; }
	$("#sliderBeep").slider({ "value": beepSlider });
	$("#beepIntensity").html(beepSlider + "%");

	if (parseInt(lsGet("vibrationPosition")) > 0) {
		var vibSlider = lsGet("vibrationPosition");
	} else { var vibSlider = 60; }
	$("#sliderVibration").slider({ "value": vibSlider });
	$("#vibrationIntensity").html(vibSlider + "%");

	if (parseInt(lsGet("zapIntensity")) > 0) {
		var zapSlider = Math.round(parseInt(lsGet("zapIntensity")) * 100 / 2550) * 10;
	} else { var zapSlider = 60; }
	$("#sliderZap").slider({ "value": zapSlider });
	$("#zapIntensity").html(zapSlider + "%");

	// Rescue Time
	$("#RTOnOffSelect").val(lsGet("RTOnOffSelect"));
	if ($("#RTOnOffSelect").val() == "Off") { $("#RTResultsHolder").css('visibility', 'hidden'); }
	changeRTVisibility();

}

function enableScrollNavigation() {
	$("#indexDiv").on('click', '.scrollableLink', function (event) {
		moveToLink($(this));
	});
}

function moveToLink(clickedLink) {
	var target = $(clickedLink).prop('id').split("@")[1];
	target = $("#" + target);

	var topHeight = parseInt($(".fixedHeader").height());
	// var topMargin = parseInt($("#fixedHeader").margin());
	// var topPadding= parseInt($("#fixedHeader").css('padding').split("p")[0]);
	// var topSize = topHeight + topPadding;
	var topSize = topHeight;

	var position = $(target).offset().top;
	var positionUpdated = position - topSize;

	// log(positionUpdated);
	// window.scrollTo(0, positionUpdated);
	$('html, body').animate({
		scrollTop: positionUpdated
	}, 1000);

}

function toggleOverlay(toState) {
	var curtain = $("#bigOverlay");
	var stage = $(curtain).css('display');

	if (toState == "showOptions") {
		if (stage == "none") { return }

		$("#bigOverlay").fadeTo(300, 0, function () {
			$("#bigOverlay").hide()
		});

	}
	else if (toState == "hideOptions") {
		if ($("#bigOverlay").length == 0) {
			var overlayDiv = [
				'<div id="bigOverlay">',
				'<div id="bigOverlay" class="noDisplay">',
				'<div id="bigOverlayContents">',
				'<p>',
				'Ooops! You are not signed in!',
				'</p>',
				'<p>',
				'<a id="overlaySignIn" href="#">Click here to solve it!</a>',
				'</p>',
				'</div>',
				'</div>',
			];

			overlayDiv = overlayDiv.join(',')
			$("body").append(overlayDiv);
		}

		var stage = $(curtain).css('display');

		if (stage != 'none') { return }

		$("#bigOverlay").show(function () {
			$("#bigOverlay").fadeTo(300, 0.8);
		});

	}
}

function enableLogin() {
	$("#pavSubmitLogin").click(function (event) {
		event.preventDefault();

		var userInfo = {
			userName: $("#pavUserNameLogin").val(),
			password: $("#pavPasswordLogin").val(),
		};

		if (validateUserInfo(userInfo)) {
			var msg = {
				action: "oauth",
				user: userInfo
			};

			msgBackground(msg);
		}
		else {
		};
	});
}
// Create the vertical tabs
function initialize() {
	var timeFormat = lsGet('timeFormat');
	if (timeFormat == "24") { culture = "de-DE"; }
	else if (timeFormat == "12") { culture = "en-EN" }
	else {
		culture = "de-DE";
		lsSet("timeFormat", "24");
		$("#timeFormat").val("24");
		log("timeFormat is broken: " + timeFormat);
	};
	Globalize.culture(culture);

	enableLogin();
	enableSignInOut()
	enableScrollNavigation();
	// Black and WhiteLists
	var wl = document.getElementById("blackList");
	if (wl) {
		$('#whiteList')[0].value = lsGet("whiteList");
		$('#whiteList').tagsInput({
			'onChange': saveWhiteList,
			'defaultText': 'Add site... ie: facebook.com/groups/772212156222588/',
			'removeWithBackspace': true
		});
	}




	// Add listeners for Auto save when options change
	$("#zapOnClose").change(function () {
		lsSet("zapOnClose", $(this).prop("checked"));
	});

	// Notifications before stimuli
	$("#notifyZap").change(function () {
		lsSet("notifyZap", $(this).prop("checked"));
	});

	$("#notifyVibration").change(function () {
		lsSet("notifyVibration", $(this).prop("checked"));
	});

	$("#notifyBeep").change(function () {
		lsSet("notifyBeep", $(this).prop("checked"));
	});

	// Max Tabs
	maxTabsPack.create("options", lsGet("maxTabs"));


	// Enablers
	enableSelects();
	enableSelecatbles();
	enableTimers();
	enableAutoZapper();
	enableTooltips();
	enableButtons();
	enableSliders();
	enableTables();
	enableCheckboxes();
	enableInputs();
	enableRescueTime();
	enableToDo();

	// syncToDo('options');
	pavPomo.helpers.initialSync();

	enableDaily();

	$(".allCaps").text().toUpperCase();

	// var serverKind = lsGet("baseAddress");
	// serverKind = serverKind.split("-")[1].split(".")[0];
	// $("#server").text(serverKind);

}

initialize();
$(document).ready(function () {
	enter_on_sign_in();
	showOptions(lsGet("accessToken"));
	if (lsGet("logged") == 'true') {
		toggleOverlay("options");
		$(".onlyLogged").css('visibility', 'visible');
		$(".onlyUnlogged").css('display', 'none');
		$("#signOutX").attr('title', 'Sign Out');
		$("#testPairingX").show();
	}
	else {
		// toggleOverlay("hide");
		$(".onlyLogged").css('visibility', 'hidden');
		$("#signOutX").attr('title', 'Sign In');
		$("#testPairingX").hide();

	}

	// Fill user Data
	if (!lsGet("userName")) {
		userInfo(lsGet("accessToken"))
	}
	if (lsGet("userName") == undefined) { lsSet("userName", ' '); }
	else {
		$('#userEmailSettings').html(lsGet("userEmail"));
		$('#userName').html(" " + lsGet("userName"));
	}
	//restoreOptions(); //removed temporary when working in advancedOptinos
	if ($('#blackListDaily_tagsinput').length > 0) { return }
	enableBlackDaily();
	enableCoach();
	enableTodoist();

	removeInlineStyle("#blackList_tagsinput");
	removeInlineStyle("#whiteList_tagsinput");
	removeInlineStyle("#blackListDaily_tagsinput");
	removeInlineStyle("#whiteListDaily_tagsinput");

	$(window).scroll(function () {
		var curPos = $(this).scrollTop();

		var fixedHeaderHeight = $(".fixedHeader").height();
		var fixedHeaderSize = fixedHeaderHeight;

		highlightActiveSection(curPos, fixedHeaderSize);
		adjustSliders(curPos, fixedHeaderSize);
		adjustSpinners(curPos, fixedHeaderSize);
	});

	$("body").on('change', '.pavSetting', function () {
		confirmUpdate(notifyUpdate);
	});

	blackListTable.create(lsGet('blackList', 'parse'), 'blackList');
	blackListTable.listenClicks();

	interfaceListeners("options");
});