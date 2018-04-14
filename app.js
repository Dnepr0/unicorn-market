/**
 * Инициализирует скрипт после загрузки страницы
 * (вешает обработчики событий, инициирует вечный цикл)
 */
function OnPageLoad() {
    updateButton.onclick = OnUpdateButtonClickHandler;
    resultTable.onclick = OnTableClickHandler;

    autoMode();
}

/**
 * Обрабатывает клик на кнопку обновления магазина
 */
function OnUpdateButtonClickHandler() {
    Table.update();
    autoModeCheck.checked = false;
}

/**
 * Обрабатываем клик на таблицу
 * @param {*} e параметры события
 */
function OnTableClickHandler(e) {
    if (e.target.tagName == 'TH' ) {
        Table.sort(e.target.cellIndex);
    }
}

function autoMode() {
    if (autoModeCheck.checked) {
        Table.update();
        console.log("Last table update: " + new Date().toLocaleString());
        
        setTimeout(Table.analize, 5000);
    }

    setTimeout(autoMode, 300000);
}

/**
 * Отправляет уведомление в телеграм
 */
function TelegramNotify(msg) {
    $.get("http://pushmebot.ru/send?key=7471f5cc0bcc3c11187ca5996b4163f4&message=" + msg);
}




/**
 * Управление результирующей таблицей
 */
class Table {
    /**
     * Обновляем все данные в таблиице
     * (отправляем запросы и получаем новые данные)
     */
    static update() {
        Request.sendAll();
        Table.clear();
    }

    /**
     * Стираем информацию из таблицы
     */
    static clear() {
        resultTable.children[1].innerHTML = null;
    }

    /**
     * Сортирует слоблец чисел
     * @param {*} colNum номер столбца
     */
    static sort(colNum) {
        var tbody = resultTable.children[1];

        // Составляем массив из TR
        var rowsArray = [].slice.call(tbody.rows);

        rowsArray.sort(function(rowA, rowB) {
            if (rowA.cells[colNum].innerHTML == "") return 1;
            if (rowB.cells[colNum].innerHTML == "") return -1;
            else return rowA.cells[colNum].innerHTML - rowB.cells[colNum].innerHTML;
        });

        // Убрать tbody из большого DOM документа для лучшей производительности
        resultTable.removeChild(tbody);

        // добавить результат в нужном порядке в TBODY
        // они автоматически будут убраны со старых мест и вставлены в правильном порядке
        for (var i = 0; i < rowsArray.length; i++) {
            tbody.appendChild(rowsArray[i]);
        }

        resultTable.appendChild(tbody);
    }

    /**
     * Анализирует таблицу
     */
    static analize() {
        Table.sort(7);
        if (resultTable.children[1].firstChild.lastChild.innerHTML == "0.001") {
            TelegramNotify("!!!FIND UNICORN!!!");
        }
    }

    /**
     * Добавляет строку в таблицу
     * @param {*} item добавляемый объект
     */
    static addRow(item) {
        var newRow = resultTable.children[1].insertRow();
            
        newRow.insertCell().innerHTML = newRow.rowIndex;
        newRow.insertCell().innerHTML = "<a href='https://play.unicorngo.io/unicorn/" + item.unicorn_blockchain_id + "'>" + item.unicorn_blockchain_id + "</a>";
        newRow.insertCell().innerHTML = item.owner_id;
        newRow.insertCell().innerHTML = item.generation;
        newRow.insertCell().innerHTML = item.reproduction;
        newRow.insertCell().innerHTML = item.candy_breed_cost;
        newRow.insertCell().innerHTML = item.candy_cost;
        newRow.insertCell().innerHTML = item.cost;
    }
}

/**
 * Заведует ajax запросами на сервер
 * (отправкой и обработкой ответа)
 */
class Request {
    /**
     * Отправляет запрос на сервер
     * @param {*} num номер запрашиваемой страницы
     * @param {*} handler обработчик ответа
     */
    static send(num, handler) {
        var req = window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
        if (req) {
            // Вешаем обработчик ответа от сервера
            req.onload = handler;
            // Вешаем обработчик ошибки запроса
            req.onerror = function() { console.error("Request error") };
            // Инициализируем соеденение
            req.open("post", "https://core.unicorngo.io/v1/unicorn/get", true);
            // Устанавливаем заголовок с типом отправляемых данных json
            req.setRequestHeader("Content-Type","application/json; charset=utf-8");
            // Отправляем запрос на сервер
            req.send(JSON.stringify({
                'page': num,
                'sort': $('input[name=sortRadio]:checked').val(),
                'target': $('input[name=targetRadio]:checked').val(),
                'filters': {
                    'charisma': [1, 10],
                    'intelligence': [1, 10],
                    'speed': [1, 10],
                    'strength': [1, 10]
                }
            }));
        }
        else console.error("Can't create XMLHttpRequest");
    }
    
    /**
     * Отправляет все запросы на сервер
     * (для получения всех запрашиваемых страниц)
     */
    static sendAll() {
        // Получение количества страниц и вызов цикла запросов на нужное количество страниц
        Request.send(1, function() {
            var response = JSON.parse(this.response);
            var count = Math.ceil(response.total / 12);
            // Если установлен limit
            var limit = limitInput.value;
            if (isNaN(limit) || limit < 1 || limit > count) {                
                limit = 0;
            }
            else limit = count - limit;

            while (count > limit) {
                Request.send(count--, Request.outTableResponseHandler);
            }
        });
    }

    /**
     * Обрабатывает ответ от сервера - с выводом результата в таблицу
     */
    static outTableResponseHandler() {
        var response = JSON.parse(this.response);
        // Добавление элементов в таблицу
        response.items.forEach(item => {
            Table.addRow(item);
        });
    }
}


window.onload = OnPageLoad;