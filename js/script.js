(function() {
	'use strict';

	// установки обработчиков событий ведения морского боя
	let NavalCombatController = false;
	// блокировка действия игрока во время выстрела компьютера
	let shotComputer = false;
	// переменная для сохранение кто бует ходит первым
	let Choice = 0;
	// получаем объект элемента по его ID
	const getElement = id => document.getElementById(id);
	// Запускаем игру
	const newGameStart = getElement('newGameStart');
	// появления поле для имени
	const namePlayer = getElement('namePlayer');
	// получение поля для имени
	const getName = getElement('getName');
	const Name = getElement('Name');
	// появление выбора кто будет ходит первым
	const name_player = getElement('name_player');
	// появление выбора кто будет ходит первым
	const type_placement = getElement('type_placement');
	const Start = getElement('Start');
	const Players = getElement('Players');



})();