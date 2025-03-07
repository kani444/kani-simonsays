const soundeffects_enabled = true;
const soundeffects = {
	beep: 'sounds/beep.mp3',
	error: 'sounds/error.mp3',
};

// Sound effects

function playSound(soundFile) {
	if (soundeffects_enabled) {
		return $(`<audio class="sound-player" autoplay="autoplay" style="display:none;">
            <source src="${soundFile}" />
            <embed src="${soundFile}" hidden="true" autostart="true" loop="false"/>
            </audio>`).appendTo('body');
	}
}

// Progressbar

let proggresbar;

function ProgressBar(time, variant, onComplete) {
	let progress = document.querySelector('.proggres');
	let precent = 100;

	if (variant == 'default') {
		$('.proggres').removeClass('proggres-completed');
		$('.proggres').removeClass('proggres-failed');
	} else if (variant == 'completed') {
		$('.proggres').addClass('proggres-completed');
	} else if (variant == 'failed') {
		$('.proggres').addClass('proggres-failed');
	}
	proggresbar = setInterval(function () {
		if (precent <= 0) {
			clearInterval(proggresbar);
			if (typeof onComplete === 'function') {
				onComplete();
			}
		} else {
			precent -= (10 / time) * 100;
			progress.style.width = Math.max(precent, 0) + '%';
		}
	}, 10);
}

function stopProgressBar() {
	clearInterval(proggresbar);
}

// Minigame

let done_status = {
	done: 0,
	todo: 4,
};

let fields = [];

function startScreen(cb) {
	$('.minigame-content').css('display', 'none');
	$('.result-content').css('display', 'flex');
	$('.header').html('');
	$('.result-content').html('PRZYGOTUJ SIĘ');
	$('.wrapper').fadeIn(300);
	ProgressBar(4000, 'default', function () {
		cb();
	});
}

function completedScreen() {
	$('.minigame-content').css('display', 'none');
	$('.result-content').css('display', 'flex');
	$('.header').html('');
	$('.result-content').html('UKOŃCZONO');
	ProgressBar(4000, 'completed', function () {
		$('.done-content').empty();
		fields = [];
		$('.wrapper').fadeOut();
		$.post(
			`https://kani-simonsays/finishedMinigame`,
			JSON.stringify({ result: true }),
			null
		);
	});
}

function failedScreen() {
	$('.minigame-content').css('display', 'none');
	$('.result-content').css('display', 'flex');
	$('.header').html('');
	$('.result-content').html('PORAŻKA');
	ProgressBar(4000, 'failed', function () {
		$('.done-content').empty();
		fields = [];
		$('.wrapper').fadeOut();
		$.post(
			`https://kani-simonsays/finishedMinigame`,
			JSON.stringify({ result: false }),
			null
		);
	});
}

function DoneContent(type) {
	if (type == 'set') {
		$('.done-content').empty();
		for (let i = 1; i <= done_status.todo; i++) {
			$('.done-content').append(`<div class="done" id="done-${i}"></div>`);
		}
		$('#done-1').addClass('done-doing');
	} else if (type == 'completed') {
		$('.done-doing').addClass('done-completed');
		$('.done-doing').removeClass('done-doing');
		done_status.done = done_status.done + 1;
		if (done_status.todo == done_status.done) {
			stopProgressBar();
			completedScreen();
		} else {
			stopProgressBar();
			$('.field').css('cursor', 'default');
			startGame();
			$('#done-' + (done_status.done + 1)).addClass('done-doing');
		}
	} else if (type == 'failed') {
		stopProgressBar();
		$('.field').css('cursor', 'default');
		$('.done-doing').addClass('done-failed');
		$('.done-doing').removeClass('done-doing');
		failedScreen();
	}
}

function getRandomField() {
	return Math.floor(Math.random() * 16) + 1;
}

let clickedFields = 0;
let enableClickFields = false;
function startGame() {
	clickedFields = 0;
	enableClickFields = false;
	$('.header').html('ZAPAMIĘTAJ');
	$('.field').css('cursor', 'default');
	const fieldid = getRandomField();
	fields.push(fieldid);
	setTimeout(() => {
		fields.forEach((field, index) => {
			setTimeout(() => {
				$(`[data-fieldid="${field}"]`).addClass('color-' + field);
				playSound(soundeffects.beep);

				setTimeout(() => {
					$(`[data-fieldid="${field}"]`).removeClass('color-' + field);
				}, 250);
			}, index * 500);
		});
		ProgressBar(fields.length * 500, 'default', function () {
			$('.header').html('POWTÓRZ RUCHY');
			$('.field').css('cursor', 'pointer');
			enableClickFields = true;
			ProgressBar(fields.length * 3000, 'default', function () {
				if (fields.length !== clickedFields) {
					DoneContent('failed');
				}
			});
		});
	}, 250);
}
$('.field').click(function (e) {
	if (enableClickFields) {
		let fieldId = $(this).data('fieldid');
		if (fields[clickedFields] == fieldId) {
			clickedFields = clickedFields + 1;
			if (fields.length == clickedFields) {
				$(this).addClass('color-' + fieldId);
				playSound(soundeffects.beep);
				setTimeout(() => {
					$(this).removeClass('color-' + fieldId);
					enableClickFields = false;
					DoneContent('completed');
				}, 250);
			} else {
				$(this).addClass('color-' + fieldId);
				playSound(soundeffects.beep);
				setTimeout(() => {
					$(this).removeClass('color-' + fieldId);
				}, 250);
			}
		} else {
			playSound(soundeffects.error);
			enableClickFields = false;
			DoneContent('failed');
		}
	}
});

function startSimonSays(todo) {
	done_status.done = 0;
	done_status.todo = todo;

	startScreen(function () {
		DoneContent('set');
		$('.result-content').css('display', 'none');
		$('.minigame-content').css('display', 'flex');
		startGame();
	});
}

window.addEventListener('message', (event) => {
	switch (event.data.action) {
		case 'startSimonSays':
			startSimonSays(event.data.stages);
			break;
	}
});

$('.wrapper').fadeOut(0);
