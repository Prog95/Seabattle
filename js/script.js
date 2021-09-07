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
	const nameComputer = getElement('nameComputer');
	const fieldComputer_all = getElement('field-computer_all');
	let positionNumber = document.getElementsByClassName('positionNumber');
	let positionLetters = document.getElementsByClassName('positionLetters');
	let letters = "АБВГДЕЖЗИК";

	for (let m = 0; m < 2; m++){
		for (let pN = 1; pN <= 10; pN++){
			let posNumber  = document.createElement('div');
			let posLetters  = document.createElement('div');
			posNumber.innerHTML = pN;
			posLetters.innerHTML = letters[pN-1];
			setTimeout( () => positionNumber[m].append(posNumber), 500 * pN);
			setTimeout( () => positionLetters[m].append(posLetters), 500 * pN);

		}
	}

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

	// игровое поле игрока
	const player_field = getElement('field_player');
	// игровое поле компьютера
	const computer_field = getElement('field_computer');


	// родительский контейнер с информацией
	const instruction = getElement('instruction');
	// контейнер с заголовком
	const main_text = getElement('main_text');

	// экземпляр игрового поля только регистрируем
	let computer = {};

	let control = null;


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

	class Ships {
		constructor(self, { x, y, kx, ky, decks, shipName }) {
			// с каким игроком работаем
			this.player = (self === person) ? person : computer;
			// координата X палубы
			this.x = x;
			// координата Y палубы
			this.y = y;
			// направлении расположения палуб
			this.kx = kx;
			this.ky = ky;
			// имя корабля
			this.shipName = shipName;
			// на каком поле создаётся данный корабль
			this.field = self.field;
			// количество палуб
			this.decks = decks;
			// счётчик попаданий
			this.hits = 0;
			// массив с координатами палуб корабля
			this.arrayDeck = [];
		}

		static showShip(self, shipName, x, y, kx) {

			const ShowSh = document.createElement('div');
			const classname = shipName.slice(0, -1);

			// получаем имя класса в зависимости от направления расположения корабля
			const dir = (kx == 1) ? ' vertical' : '';

			// устанавливаем уникальный идентификатор для корабля
			ShowSh.setAttribute('id', shipName);
			// собираем в одну строку все классы
			ShowSh.className = `ship ${classname}${dir}`;
			// задаём позиционнирование корабля
			ShowSh.style.cssText = `left:${y * Field.SHIP_SIZE}px; top:${x * Field.SHIP_SIZE}px;`;
			self.field.appendChild(ShowSh);
		}

		createShip() {
			let { player, field, shipName, decks, x, y, kx, ky, hits, arrayDeck, k = 0 } = this;

			while (k < decks) {
				// координаты корабля в двумерного массива игрового поля
				let i = x + k * kx, j = y + k * ky;
				// 1 значит присутсвует палубы корабля
				player.matrix[i][j] = 1;
				// записываем координаты палубы
				arrayDeck.push([i, j]);
				k++;
			}

			// заносим информацию о созданном корабле в объект эскадры
			player.navy[shipName] = {arrayDeck, hits, x, y, kx, ky};
			// если корабль создан для игрока, выводим его на экран
			if (player === person) {
				Ships.showShip(person, shipName, x, y, kx);
			}
		}
	}
	getElement('type_placement').addEventListener('click', function(e) {
		// используем делегирование основанное на всплытии событий
		if (e.target.tagName != 'SPAN') return;
		// очищаем игровое поле игрока перед повторной расстановкой кораблей
		person.cleanField();
		// очищаем клон объекта с набором кораблей
		let initialShipsClone = '';
		// способ расстановки кораблей на игровом поле
		const type = e.target.dataset.target;
		// запускаем рандом кораблей
		const Generation = {
			random() {person.randomShips(); Start.hidden=false;}
		};
		// вызов функции объекта в зависимости от способа расстановки кораблей
		Generation[type]();
	});

	getElement('Players').addEventListener('click', function(e) {
		const type = e.target.dataset.target;
		const typeSelection = { // выбор кто будет ходит первым
			player() {Choice = 0;},
			computer() {Choice = 1;}
		};
		typeSelection[type]();
		instruction.hidden = true;
		// показываем игровое поле компьютера
		computer_field.parentElement.hidden = false;
		nameComputer.hidden = false;
		fieldComputer_all.hidden = false;

		main_text.innerHTML = 'Морской бой. Пусть победит сильнейший';

		// создаём экземпляр игрового поля компьютера
		computer = new Field(computer_field);
		// очищаем поле от ранее установленных кораблей
		computer.cleanField();
		computer.randomShips();

		// создаём экземпляр контроллера, управляющего игрой
		if (!control) control = new Controller();
		// запускаем игру
		control.init();
		this.hidden = true;
	});

	class Controller {
		// подсказки во время игры
		static SERVICE_TEXT = getElement('service_text');
		// вывод информации во время игры
		static showServiceText = text => {
			Controller.SERVICE_TEXT.innerHTML = text;
		}
		constructor() {
			this.player = '';
			this.opponent = '';
			this.text = '';
			// массив с координатами выстрелов
			this.randomHit = [];
			// массив с координатами вокруг клетки с попаданием
			this.validCoords = [];
			// временный объект корабля, куда будем заносить координаты
			// попаданий, расположение корабля, количество попаданий
			this.resetPaceShip();
		}



		// преобразование абсолютных координат иконок в координаты матрицы
		static getCoordsIcon = el => {
			const x = el.style.top.slice(0, -2) / Field.SHIP_SIZE;
			const y = el.style.left.slice(0, -2) / Field.SHIP_SIZE;
			return [x, y];
		}

		// удаление ненужных координат из массива
		static removeElementArray = (arr, [x, y]) => {
			return arr.filter(item => item[0] != x || item[1] != y);
		}

		init() {
			// Если выбрали игрока (0) то первый начинает игрок, если компьютера (1), то начинает он
			this.player = (Choice == 0) ? person : computer;
			this.opponent = (this.player === person) ? computer : person;

			// генерируем координаты выстрелов компьютера и заносим их
			this.setCoordsShot();

			// обработчики события для игрока
			if (!NavalCombatController) {
				computer_field.addEventListener('click', this.shot.bind(this));
				computer_field.addEventListener('contextmenu', this.setUselessCell.bind(this));
				NavalCombatController = true;
			}

			if (this.player === person) {
				shotComputer = false;
				this.text = name_player.innerHTML + ' стреляет первым';
			} else {
				shotComputer = true;
				this.text = 'Первым стреляет компьютер';
				setTimeout(() => this.shot(), 1500);
			}
			Controller.showServiceText(this.text);
		}

		setCoordsShot() {// получаем рандомный выстрел компьютера
			for (let i = 0; i < 10; i++) {
				for(let j = 0; j < 10; j++) {
					this.randomHit.push([i, j]);
				}
			}
			this.randomHit.sort((a, b) => Math.random() - 0.5);
		}

		setCoordsAroundHit(x, y, coords) {
			let {firstHit, kx, ky} = this.tempShip;
			// массив пустой, значит это первое попадание в данный корабль
			if (firstHit.length == 0) {
				this.tempShip.firstHit = [x, y];
			} else if (kx == 0 && ky == 0) {
				// если компьютер попал 2 раза, можно вычислить направление расположение корабля
				this.tempShip.kx = (Math.abs(firstHit[0] - x) == 1) ? 1 : 0;
				this.tempShip.ky = (Math.abs(firstHit[1] - y) == 1) ? 1 : 0;
			}

			// проверяем корректность полученных координат обстрела
			for (let correctСoordinates of coords) {
				x = correctСoordinates[0]; y = correctСoordinates[1];
				// координаты за пределами игрового поля
				if (x < 0 || x > 9 || y < 0 || y > 9) continue;
				// по данным координатам установлен промах или маркер пустой клетки
				if (person.matrix[x][y] != 0 && person.matrix[x][y] != 1) continue;
				// добаляем в массив
				this.validCoords.push([x, y]);
			}
		}

		isShipSunk() {
			// максимальное количество палуб у оставшихся кораблей
			let obj = Object.values(person.navy).reduce((a, b) => a.arrayDeck.length > b.arrayDeck.length ? a : b);
			if (this.tempShip.hits >= obj.arrayDeck.length || this.validCoords.length == 0) {
				// корабль убит запускам функцию, заштриховываем вокруг корабля
				this.shadingAroundShip();
				// очищаем массив и обстреливаем следующий корабль
				this.validCoords = [];
				this.resetPaceShip();
			}
		}

		setUselessCell(e) { // проверка заштрихованного места, для установки маркера компьютерем
			e.preventDefault();
			if (e.which != 3 || shotComputer) return;
			const coords = this.transformCoordsMatrix(e, computer);
			const check = this.checkUselessCell(coords);
			if (check) {
				this.showIcons(this.opponent, coords, 'shaded-cell');
			}
		}

		checkUselessCell(coords) {
			// проверка заштрихованного места, для установки маркера игроком
			if (computer.matrix[coords[0]][coords[1]] > 1) return false;

			// получаем коллекцию маркеров на игровом поле противника
			const icons = this.opponent.field.querySelectorAll('.shaded-cell');
			if (icons.length == 0) return true;

			for (let icon of icons) {
				const [x, y] = Controller.getCoordsIcon(icon);
				if (coords[0] == x && coords[1] == y) {
					// если координаты иконки и координаты полученные в аргументе совпали,
					// проверяем, какая функция вызвала функцию checkUselessCell
					const f = (new Error()).stack.split('\n')[2].trim().split(' ')[1];
					// удаляем маркер пустой клетки
					if (f == 'Controller.setUselessCell') icon.remove();
					return false;
				}
			}
			return true;
		}

		// устанавливаем маркеры вокруг корабля при попадании
		markUselessCell(coords) {
			let n = 1, x, y;

			for (let correctСoordinates of coords) {
				x = correctСoordinates[0]; y = correctСoordinates[1];

				if (x < 0 || x > 9 || y < 0 || y > 9) continue; // координаты за пределами игрового поля
				if (person.matrix[x][y] == 2 || person.matrix[x][y] == 3) continue; // по координатам уже записан промах или маркер пустой клетки
				person.matrix[x][y] = 2; // прописываем значение, соответствующее маркеру пустой клетки
				// выводим маркеры пустых клеток по полученным координатам
				setTimeout(() => this.showIcons(person, correctСoordinates, 'shaded-cell'), 350 * n);
				// удаляем полученные координаты из всех массивов
				this.removeCoordsFromArrays(correctСoordinates);
				n++;
			}
		}

		transformCoordsMatrix(e, self) {
			const x = Math.trunc((e.pageY - self.field_Top) / Field.SHIP_SIZE);
			const y = Math.trunc((e.pageX - self.field_Left) / Field.SHIP_SIZE);
			return [x, y];
		}

		removeCoordsFromArrays(coords) {
			if (this.validCoords.length > 0) {
				this.validCoords = Controller.removeElementArray(this.validCoords, coords);
			}
			this.randomHit = Controller.removeElementArray(this.randomHit, coords);
		}

		// устанавливаем штрихи после уничтожения корабля
		shadingAroundShip(){
			// присваиваем переменным соответствующие значения из объекта tempShip
			const {hits, kx, ky, x0, y0} = this.tempShip;
			let coords;

			// считаем координаты пустых клеток
			if (this.tempShip.hits == 1) { // однопалубный корабль
				coords = [
					[x0 - 1, y0],
					[x0 + 1, y0],
					[x0, y0 - 1],
					[x0, y0 + 1]
				];
			} else { // многопалубный корабль
				coords = [
					[x0 - kx, y0 - ky],
					[x0 + kx * hits, y0 + ky * hits]
				];
			}
			this.markUselessCell(coords);
		}

		showIcons(opponent, [x, y], classIcons) {
			// место игрового поля на котором будет размещена или крестик, или точка
			const field = opponent.field;
			if (classIcons === 'point' || classIcons === 'red-cross') {
				setTimeout(() => fn(), 350);
			} else {
				fn();
			}
			function fn() {
				// создание элемента и добавление ему класса и стилей
				const iconElement = document.createElement('span');
				iconElement.className = `icon-field ${classIcons}`;
				iconElement.style.cssText = `left:${y * Field.SHIP_SIZE}px; top:${x * Field.SHIP_SIZE}px;`;
				// размещаем иконку на игровом поле
				field.appendChild(iconElement);
			}
		}

		showExplosion(x, y) {
			// анимация выстрела
			this.showIcons(this.opponent, [x, y], 'explosion');
			const explosion = this.opponent.field.querySelector('.explosion');
			explosion.classList.add('active');
			setTimeout(() => explosion.remove(), 430);
		}

		getCoordsForShot() {
			// компьютер определяет куда он выстрелил, если он выстрелил в корабль, то он продолжает его добивать, а если нет стреляет рандомно
			const coords = (this.validCoords.length > 0) ? this.validCoords.pop() : this.randomHit.pop();
			this.removeCoordsFromArrays(coords);
			return coords;
		}

		resetPaceShip() {
			this.tempShip = {
				hits: 0,
				firstHit: [],
				kx: 0,
				ky: 0
			};
		}

		shot(e) {
			let x, y;
			// если событие существует, значит выстрел сделан игроком
			if (e !== undefined) {
				if (e.which != 1 || shotComputer) return;
				// координаты выстрела в системе координат матрицы
				([x, y] = this.transformCoordsMatrix(e, this.opponent));

				// проверяем наличие иконки штриха по полученым координатам
				const check = this.checkUselessCell([x, y]);
				if (!check) return;
			} else {
				// получаем координаты для выстрела компьютера
				([x, y] = this.getCoordsForShot());

			}
			// показываем и удаляем иконку выстрела
			this.showExplosion(x, y);

			const v	= this.opponent.matrix[x][y];
			switch(v) {
				case 0: // промах
					this.miss(x, y);
					break;
				case 1: // попадание
					this.hit(x, y);
					break;
			}
		}

		miss(x, y) {
			let text = '';
			// устанавливаем иконку промаха и записываем промах в матрицу
			this.showIcons(this.opponent, [x, y], 'point');
			this.opponent.matrix[x][y] = 3;

			// определяем статус игроков
			if (this.player === person) {
				text = name_player.innerHTML + ' <span class="active">промахнулся</span>. Стреляет компьютер.';
				this.player = computer;
				this.opponent = person;
				shotComputer = true;
				setTimeout(() => this.shot(), 1500);
			} else {
				text = 'Компьютер <span class="active">промахнулся</span>. Ваш выстрел.';
				// обстреляны все возможные клетки для данного корабля
				if (this.validCoords.length == 0 && this.tempShip.hits > 0) {
					this.shadingAroundShip();
					this.resetPaceShip();
				}
				this.player = person;
				this.opponent = computer;
				shotComputer = false;
			}
			setTimeout(() => Controller.showServiceText(text), 400);
		}

		hit(x, y) {
			let text = '';
			// устанавливаем иконку попадания и записываем попадание в матрицу
			this.showIcons(this.opponent, [x, y], 'red-cross');
			this.opponent.matrix[x][y] = 4;
			setTimeout(() => Controller.showServiceText(text), 400);

			// перебираем корабли противника
			outerloop:
				for (let name in this.opponent.navy) {
					const dataShip = this.opponent.navy[name];

					for (let value of dataShip.arrayDeck) {

						// перебираем координаты палуб и сравниваем с координатами попадания
						if (value[0] != x || value[1] != y) continue;
						dataShip.hits++;

						if (dataShip.hits < dataShip.arrayDeck.length) {
							text = (this.player === person) ? 'Поздравляем! ' + name_player.innerHTML + ' <span class="active">ранил</span> корабль. Ваш выстрел.' : 'Компьютер <span class="active">ранил</span> ваш корабль. Выстрел компьютера';
							break outerloop
						} else {
							text = (this.player === person) ? 'Поздравляем! ' + name_player.innerHTML + ' <span class="active">убил</span> корабль. Ваш выстрел.' : 'Компьютер <span class="active">убил</span> ваш корабль. Выстрел компьютера';
						};
						// код для выстрела компьютера: сохраняем координаты первой палубы
						if (this.opponent === person) {
							this.tempShip.x0 = dataShip.x;
							this.tempShip.y0 = dataShip.y;
						}
						// если количество палуб корабля равно количество попаданий то удаляем данный корабль
						delete this.opponent.navy[name];
						break outerloop;
					}
				}

			// все корабли на поле уничтожены
			if (Object.keys(this.opponent.navy).length == 0) {
				if (this.opponent === person) {
					text = name_player.innerHTML + ' проиграл.';
					// показываем оставшиеся корабли компьютера
					for (let name in computer.navy) {
						const dataShip = computer.navy[name];
						Ships.showShip(computer, name, dataShip.x, dataShip.y, dataShip.kx );
					}
				} else {
					text = 'Поздравляем! ' + name_player.innerHTML + ' выиграл!';
				}
				Controller.showServiceText(text);
				// показываем кнопку продолжения игры
				newProceed.hidden = false;
				// бой продолжается
			} else if (this.opponent === person) {
				let coords;
				this.tempShip.hits++;

				// отмечаем клетки по диагонали, где точно не может стоять корабль
				coords = [
					[x - 1, y - 1],
					[x - 1, y + 1],
					[x + 1, y - 1],
					[x + 1, y + 1]
				];
				this.markUselessCell(coords);

				// формируем координаты обстрела вокруг попадания
				coords = [
					[x - 1, y],
					[x + 1, y],
					[x, y - 1],
					[x, y + 1]
				];
				this.setCoordsAroundHit(x, y, coords);

				// проверяем, потоплен ли корабль, в который было попадание
				this.isShipSunk();

				// после небольшой задержки, компьютер делает новый выстрел
				setTimeout(() => this.shot(), 2000);
			}
		}
	}

	newProceed.addEventListener('click', function() {
		computer_field.parentElement.hidden = true;
		this.hidden = true;
		instruction.hidden = false;
		fieldComputer_all.hidden = true;
		newGameStart.hidden = false;
		Start.hidden = true;
		// очищаем поле игрока
		person.cleanField();

		Controller.SERVICE_TEXT.innerHTML = '';

		// обнуляем массивы с координатами выстрела
		control.randomHit = [];
		// control.coordsFixedHit = [];
		control.validCoords = [];
		// сбрасываем значения объекта tempShip
		control.resetPaceShip();
	});

	// получаем игровое поля игрока
	const person = new Field(player_field);

	function printMatrix() { // чистим матрицу
		let print = '';
		for (let x = 0; x < 10; x++) {
			for (let y = 0; y < 10; y++) {
				print += person.matrix[x][y];
			}
			print += '<br>';
		}
		getElement('matrix').innerHTML = print;
	}
})();
