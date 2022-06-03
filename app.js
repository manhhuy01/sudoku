const initBoard = () => {
    let table = $('#board')
    for (let i = 0; i < 9; i++) {
        let tr = ''
        for (let j = 0; j < 9; j++) {
            let borderRight = (j + 1) % 3 == 0 ? 'border-right' : '';
            let borderBottom = (i + 1) % 3 == 0 ? 'border-bottom' : '';
            let className = `cell ${borderRight} ${borderBottom} `.trim();
            tr += `<td class="${className} ${i + 1}${j + 1}"></td>`
        }
        table.append(`<tr data-row=${i}>${tr}</tr>`)
    }

}

function clickOnCell(e) {
    let curVal = $(this).text();
    let nextValue = (+curVal || 0) + 1
    if (nextValue == 10) nextValue = '';
    $(this).text(nextValue)
}

const initEvent = () => {
    let cells = $('#board td');
    $.each(cells, function () {
        $(this).click(clickOnCell)
    });
    $('#solve').click(solve)
    $('#ex1').click(example1)
    $('#ex2').click(example2)
}

const convertDatStringToArr = (str) => {
    const arr = str.trim().replace(/\n/g, '').split('').filter(x => x != ' ');
    return arr;
}

const render1Cell = (x, y, value) => {
    $(`.${x}${y}`).text(value);
}

const convertIndexToXY = (index) => {
    return {
        x: Math.floor(index / 9) + 1,
        y: Math.floor(index % 9) + 1
    }
}

const example1 = () => {
    let str = `
        015804000
        000005600
        390200080
        000002053
        540000206
        003900000
        000019400
        052037968
        974028015
    `
    let dataArr = convertDatStringToArr(str);
    dataArr.forEach((val, i) => {
        const { x, y } = convertIndexToXY(i);
        if (+val) {
            render1Cell(x, y, val);
        } else {
            render1Cell(x, y, '');
        }
    });
}

const example2 = () => {
    let str = `
        904005600
        000490000
        000208040
        032904000
        705000000
        100000280
        561700008
        000800700
        000009015
    `
    let dataArr = convertDatStringToArr(str);
    dataArr.forEach((val, i) => {
        const { x, y } = convertIndexToXY(i);
        if (+val) {
            render1Cell(x, y, val);
        } else {
            render1Cell(x, y, '');
        }
    });
}

const collectDataOnBoard = () => {
    let arr = [];
    $('#board td').map((index, e) => {
        const { x, y } = convertIndexToXY(index);
        if (!arr[x - 1]) {
            arr[x - 1] = []
        }
        let numb = +$(e).text() || 0;
        arr[x - 1][y - 1] = numb;
    })
    return arr;
}

const solve = () => {
    const data = collectDataOnBoard();
    console.log(data)
    const notifier = (x, y, val) => {
        render1Cell(x + 1, y + 1, val)
    }
    algorithmSudoku(data, notifier);
}

const sleep = async (ms) => new Promise((rs, rj) => {
    setTimeout(() => {
        rs()
    }, ms)
})


const collectNumberOnRow = (data, x) => {
    let rs = []
    for (let i = 0; i < 9; i++) {
        rs.push(data[x][i])
    }
    return rs;
}

const collectNumberOnCol = (data, y) => {
    let rs = []
    for (let i = 0; i < 9; i++) {
        rs.push(data[i][y])
    }
    return rs;
}

const collectNumberOnSquare = (data, x, y) => {
    let rs = []
    let topLeft = {
        x: Math.floor(x / 3) * 3,
        y: Math.floor(y / 3) * 3,
    }
    for (let i = topLeft.x; i <= topLeft.x + 2; i++) {
        for (let j = topLeft.y; j <= topLeft.y + 2; j++) {
            rs.push(data[i][j]);
        }
    }
    return rs;
}

const numberCanPlace = (data, x, y) => {
    let fullNumber = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    let rs = [];
    const numOnRow = collectNumberOnRow(data, x);
    const numOnCol = collectNumberOnCol(data, y);
    const numOnSquare = collectNumberOnSquare(data, x, y);
    const existedNumbers = $.unique(numOnRow.concat(numOnCol).concat(numOnSquare));
    rs = $(fullNumber).not(existedNumbers).get();
    return rs;
}

const arrOfTheChoice = (data) => {
    let rs = []
    data.forEach((row, i) => {
        row.forEach((cell, j) => {
            if (!cell) {
                rs.push({
                    x: i,
                    y: j,
                    choices: numberCanPlace(data, i, j),
                })
            }
        })
    })
    return rs.sort((a, b) => a.choices.length - b.choices.length);
}


const algorithmSudoku = async (data, notifier) => {
    const step = [];
    let arrChoices;
    do {
        arrChoices = arrOfTheChoice(data);
        if (arrChoices.length && arrChoices[0].choices.length) {
            // nếu có sự lựa chọn thì lấy sự lựa chọn ít nhất đặt thử vào board
            let lastStep = step.pop();
            if (lastStep) {
                step.push(lastStep);
            }
            if (lastStep && lastStep.x === arrChoices[0].x && lastStep.y === arrChoices[0].y) {
                // bước nay đã bí trước đó thì tìm anotherchoices
                let anotherChoice = undefined;
                while(!anotherChoice || !step.length) {
                    let lastStep = step.pop();
                    const { x, y } = lastStep;
                    let anotherChoices = $(lastStep.choices).not(lastStep.chosen).get();
                    if(anotherChoices.length){
                        anotherChoice = anotherChoices[0];
                        lastStep.chosen.push(anotherChoice);
                        step.push(lastStep)
                        data[x][y] = anotherChoice;
                        notifier(x, y, anotherChoice)
                    } else {
                        data[x][y] = 0;
                        notifier(x, y, '')
                    }
                }
              
            } else {
                // đi tiếp
                const { x, y, choices } = arrChoices[0];
                step.push({
                    x,
                    y,
                    chosen: [choices[0]],
                    choices: choices,
                })
                data[x][y] = choices[0];
                notifier(x, y, choices[0])
            }

        } else if (step.length && arrChoices.length) {
            // không thì quay ngược bước trước.
            let lastStep = step.pop();
            step.push(lastStep);
            const { x, y } = lastStep;
            data[x][y] = 0;
            notifier(x, y, '')
        }
        await sleep(500);
    } while (step.length && arrChoices.length)

    if(arrChoices.length){
        alert('thua');
    } else {
        alert('done');
    }
    
}



window.onload = () => {
    initBoard();
    initEvent();
}