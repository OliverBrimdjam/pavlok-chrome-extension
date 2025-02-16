/* To-do

	- Prioritize Dailies?
	- Prioritize tagged as today?
	- Create different rest intervals according to sequence of pomodoros
	- 

*/

/*--------------------------------------------------------------------------*/
/*--------------------------------------------------------------------------*/
/*--------															--------*/
/*--------						1.Coaching assist					--------*/
/*--------															--------*/
/*--------------------------------------------------------------------------*/
/*--------------------------------------------------------------------------*/

var coach = {
	// Variables
	status: false,
	timeout: 0,
	timeouts: [],
	todayPomos: function(pomo){
		var x = lsGet('todayPomos', 'parse');
		if (x == undefined) { x = []; };

		if (!pomo){
			return x
		}
		
		x.push(pomo);
		lsSet('todayPomos', x, 'object');
	},
	
	helpers: {
		lastTimeout: function(){
			var timeouts = coach.timeouts || [];
			var last;
			
			if (timeouts.length > 0){
				last = timeouts[timeout.length - 1];
			}
			else { last = undefined };
			return last;
		},
		
		clearTimeouts: function(){
			if (coach.timeouts){
				for (t = 0; t < coach.timeouts.length; t++){
					clearTimeout(coach.timeouts[t]);
				}
			}
			coach.timeouts = [];
		}
	},
	
	frontend: {},
	
	backend: {},
	
	// Methods
	timeSincePomo: function(pomo){
		if (!pomo) { pomo = { active: false, endTime: new Date().getTime() } }
		var time;
		if (pomo.active == true){ time = 0; }
		else{ 
			var now = new Date().getTime();
			var lastPomoEnd = pomo.endTime;
			time = now - lastPomoEnd;
			if (time < 0) { time = 0 }
		}
		
		return time
		
	},

	getTasks: function(number){
		var allTasks = testTodo.backend.read();
		if (allTasks == null) { return false }
		
		// Filter tasks which are done
		var regular = _.where(allTasks, {done: false});
		var daily = _.where(allTasks, {daily: true});
		var missingDaily = _.filter(daily, function(daily){ return daily.donePomos < daily.pomos; });
		
		var possibleTasks = [];
		for (r = 0; r < regular.length; r++){
			possibleTasks.push(regular[r]);
		}
		for (d = 0; d < missingDaily.length; d++){
			possibleTasks.push(missingDaily[d]);
		}
		
		var nTasks = possibleTasks.length
		if (number >= nTasks){
			log("There are only " + nTasks + " tasks. Returning all of them")
			return possibleTasks
		}
		
		randomTasks = [];
		
		for (t = 0; t < number; t++){
			nTasks = possibleTasks.length;
			index = Math.floor(Math.random() * nTasks);
			randomTasks.push(possibleTasks[index]);
			possibleTasks.splice(index, 1);
		}
		
		return randomTasks;
	},
	
	notifyTasks: function(tasks){
		if (tasks.length > 2){
			log("only two buttons avaible. Using the first 2 tasks");
			tasks = [tasks[0], tasks[1]];
		}
		else if (tasks.length == 0){ return; }
		
		buttons = [];
		for (t = 0; t < tasks.length; t++){
			var task = tasks[t];
			button = { title: task.task };
			buttons.push(button);
			
		}
			
		var not = {};
		not.type = "basic";
		not.title = "Let's rock!";
		not.message = "What are we gonna focus on right now?";
		not.iconUrl = "icon.png";
		not.buttons = buttons;
		not.isClickable = true;
		// not.requireInteracion = true; // waiting for support from the API
		
		var notID = "coachingCall";
		
		lsSet('coachedTasks', tasks, 'object');
		
		chrome.notifications.create(notID, not, function(notID) {
			if (chrome.runtime.lastError){
				console.error(chrome.runtime.lastError);
			}
		});
	},

	listenCoachingClicks: function(){
		chrome.notifications.onButtonClicked.addListener(coach.sayClicked);
	},

	sayClicked: function(notID, iBtn){
		var tasks = lsGet('coachedTasks', 'parse');
		var curTask = tasks[iBtn];
		
		chrome.notifications.clear("coachingCall");
		coach.startPomoFocus(curTask);
	},

	startPomoFocus: function(task){
		var pomo = pavPomo.backend.create({id: task.id});
		
		pavPomo.frontend.updateCountdown(
			pavPomo.helpers.lastPomo(), 
			"background"
		);
		
		pavPomo.helpers.toInterfaces({
			action: "updatePomo", 
			pomo: pavPomo.helpers.lastPomo()
		});
		
		log("Starting pomo for " + task.task);
	},

	isItTime: function(){
		var pavlokActive = isActive();
		var coachActive = coach.status;
		
		// Clear all timeouts if coach is not active
		if (!coachActive){ coach.helpers.clearTimeouts(); }
		
		// Coach must meet two conditions:
		// -1- time for next call
		// -2- time since last pomo
		var now = new Date().getTime();
		
		// Part 1
		var waitNextCall = now < coach.nextCall;
		if (waitNextCall) { 
			log("Next call at " + dateFromTime(coach.nextCall));
			coach.helpers.clearTimeouts();
			var timeout = setTimeout(function(){coach.isItTime();}, 10 * 1000);
			coach.timeouts.push(timeout);
			return coach.timeouts
		}
		
		coach.lastCall = now;
		
		// Part 2
		var pomo = pavPomo.helpers.lastPomo();
		
		var timeLimit = 5 * 60 * 1000;
		var elapsedTime = coach.timeSincePomo(pomo);
		
		var itsTime = elapsed > timeLimit;
		
		if ( itsTime && coachActive && pavlokActive) {
			coach.notifyTasks(coach.getTasks(2));
		}
		
		// Schedule next call for 5 minutes in the future (to account for ending pomo early) and sets next call
		coach.nextCall = deltaTime(timeLimit / 1000).getTime();
		coach.timeout = setTimeout(function(){coach.isItTime();}, 10 * 1000);
		coach.timeouts.push(coach.timeout);
		return coach.timeouts;
	},

	registerPomos: function(pomosArray){
		var totalPomos = lsGet('totalPomos', 'parse') || [];
		totalPomos.push(pomosArray);
		lsSet("totalPomos", JSON.stringify(totalPomos));
	},
	
	resetPomos: function(){},
	
};

if (lsGet('coachStatus') == 'on'){
	coach.status = true;
}