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
	// вычисляем координаты всех сторон элемента относительно окна браузера
	const getCoordinates = el => {
		const coords = el.getBoundingClientRect();
		return {
			left: coords.left + window.pageXOffset,
			right: coords.right + window.pageXOffset,
			top: coords.top + window.pageYOffset,
			bottom: coords.bottom + window.pageYOffset
		};
	};
	// новая игра
	newGameStart.addEventListener('click', function() {
		this.hidden = true;
		namePlayer.hidden = false;
	});

	getName.addEventListener('click', function() {
		const NamePl = Name.value; //получили имя игрока
		name_player.innerHTML = NamePl;
		namePlayer.hidden = true;
		type_placement.hidden = false;
	});

	// выбор кто ходит
	Start.addEventListener('click', function() {
		type_placement.hidden = true;
		Players.hidden = false;
	});

	class Field {
		// размер стороны игрового поля в px
		static FIELD_SIZE = 330;
		// размер палубы корабля в px
		static SHIP_SIZE = 33;
		// объект с кораблями
		static SHIP_DATA = {
			fourdeck: [1, 4], // ключ тип корабля, первый элемент - количество кораблей, второй элемент - сколько палуб
			tripledeck: [2, 3],
			doubledeck: [3, 2],
			singledeck: [4, 1]
		};

		constructor(field) {
			// объект игрового поля, полученный в качестве аргумента
			this.field = field;
			// двумерный массив, в который заносятся координаты кораблей
			this.matrix = [];
			// пустой объект, туда будем заносить данные по каждому созданному кораблю
			this.navy = {};
			// координаты игрового поля
			let { left, right, top, bottom } = getCoordinates(this.field);
			this.field_Left = left;
			this.field_Right = right;
			this.field_Top = top;
			this.field_Bottom = bottom;
		}

		static createMatrix() {
			return [...Array(10)].map(() => Array(10).fill(0));
		}

		cleanField() {
			while (this.field.firstChild) {
				this.field.removeChild(this.field.firstChild);
			}
			this.navy = {};
			this.matrix = Field.createMatrix();
		}

		randomShips() { // получем рандомной расположение кораблей
			for (let type in Field.SHIP_DATA) {

				let count = Field.SHIP_DATA[type][0];

				let decks = Field.SHIP_DATA[type][1];

				for (let i = 0; i < count; i++) {

					let options = this.getCoordsShip(decks);

					options.decks = decks;

					options.shipName = type + String(i + 1);

					const ship = new Ships(this, options);

					ship.createShip();
				}
			}
		}

		static getRandom = n => Math.floor(Math.random() * (n + 1));

		getCoordsShip(decks) {// получаем коэффициенты определяющие направление расположения корабля

			let kx = Field.getRandom(1), ky = (kx === 0) ? 1 : 0, x, y;

			if (kx === 0) {
				x = Field.getRandom(9); y = Field.getRandom(10 - decks);
			} else {
				x = Field.getRandom(10 - decks); y = Field.getRandom(9);
			}

			const obj = {x, y, kx, ky}
			// проверяем валидность координат всех палуб корабля, если координаты невалидны, снова запускаем функцию
			const resultShip = this.checkShip(obj, decks);
			if (!resultShip) return this.getCoordsShip(decks);
			return obj;
		}

		checkShip(obj, decks) { // формируем индексы, ограничивающие двумерный массив по оси X (строки)
			let { x, y, kx, ky, fromX, toX, fromY, toY } = obj;

			// если x равна 0, то палуба расположены в самой верхней строке
			fromX = (x == 0) ? x : x - 1;
			// если истинно, то корабль расположен вертикально и его последняя палуба примыкает к нижней границе игрового поля
			if (x + kx * decks == 10 && kx == 1) toX = x + kx * decks;
			// корабль расположен вертикально и между ним и нижней границей игрового поля
			else if (x + kx * decks < 10 && kx == 1) toX = x + kx * decks + 1;
			// корабль расположен горизонтально вдоль нижней границы игрового поля
			else if (x == 9 && kx == 0) toX = x + 1;
			// корабль расположен горизонтально где-то по середине игрового поля
			else if (x < 9 && kx == 0) toX = x + 2;

			fromY = (y == 0) ? y : y - 1;
			if (y + ky * decks == 10 && ky == 1) toY = y + ky * decks;
			else if (y + ky * decks < 10 && ky == 1) toY = y + ky * decks + 1;
			else if (y == 9 && ky == 0) toY = y + 1;
			else if (y < 9 && ky == 0) toY = y + 2;

			if (toX === undefined || toY === undefined) return false;

			// фильтруем ячейки массива, содержащие 1, если есть - возвращаем false
			if (this.matrix.slice(fromX, toX).filter(arr => arr.slice(fromY, toY).includes(1)).length > 0) return false;
			return true;
		}
	}



})();