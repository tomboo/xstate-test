import { createMachine, interpret, assign } from 'xstate';
// import { assign } from 'xstate/lib/actionTypes';

const ROWS = 6
const COLS = 5

// Enum: LetterState
const INITIAL = 'initial'   // initial state (white)
const ABSENT  = 'absent'    // not in the word, in any spot (grey)
const PRESENT = 'present'   // in the word, but in the wrong spot (yellow)
const CORRECT = 'correct'   // in the word, and in the correct spot (green)

// returns index of a given letterState string 
function getLetterStateIndex(letterState) {
  const states = [INITIAL, ABSENT, PRESENT, CORRECT]
  return (letterState)
    ? states.indexOf(letterState)
    : -1
}

function maxLetterState(ls0, ls1) {
  return (getLetterStateIndex(ls0) > getLetterStateIndex(ls1)) 
    ? ls0
    : ls1
}

// returns an array of letterStates for a given (guess, answer)
function getLetterStates(guess, answer) {
  // assert guess.length === answer.length
  let row = []
  for (let i = 0; i < guess.length; i++) {
    const c = guess.charAt(i)
    const d = answer.charAt(i)

    let s = INITIAL
    if (answer.indexOf(c) < 0) {
      s = ABSENT    // not in the word, in any spot
    }
    else if (c === d) {
      s = CORRECT   // in the word, and in the correct spot
    }
    else {
      s = PRESENT   // in the word, but in the wrong spot
    }
    row.push(s)
  }
  return row  
}

// Returns a string for a given board row
function getString(row) {
  return row.map((cell) => cell.letter).join('')
}

const answers = [
  'hello',
  'world',
]

export const wordleMachine = createMachine({
  id: 'wordle',
  initial: "idle",
  context: {
    message: '',
    answer: '',
    guess: '',
    currentRowIndex: 0,
    board: [],
    letterStates: {},
  },
  // states
  states: {
    idle: {
      entry: 'initContext',
      on: {
        PLAY: { 
          actions: 'getWord',
          target: 'playing',
        },
      },
    },
    playing: {
      on: {
        RESET: {
          target: 'idle'
        },
        LETTER: {
          cond: (context) => context.guess.length < COLS,
          actions: 'fillCell',
          target: 'playing',
        },
        BACKSPACE: {
          cond: (context) => context.guess.length > 0,
          actions: 'clearCell',
          target: 'playing',
        },
        ENTER: {
          cond: (context) => context.guess.length === COLS,
          target: 'validate'
        },
      },
    },
    validate: {   // validate guess
      always: [
        { cond: 'isValid', target: 'guess', actions: 'completeRow' },
        { target: 'playing', actions: 'invalid' },
      ],
    },
    guess: {      // process valid guess
      // Transitions are tested one at a time.
      // The first valid transition will be taken.
      always: [
        { cond: 'isWin', target: 'gameOver', actions: 'win' },
        { cond: 'isLose', target: 'gameOver', actions: 'lose' },
        { target: 'playing', actions: 'continue' },
      ],
    },
    gameOver: {
      on: {
        RESET: {
          target: 'idle'
        }
      }
    },
  },
}).withConfig({
  // Actions
  actions: {

    initContext: assign((context) => {
      console.log('* initContext')

      return {
        message: '',
        answer: '',
        guess: '',
        currentRowIndex: 0,
        letterStates: {},

        // board[i][j]: { letter: 'a', letterState: INITIAL }
        board:
          Array.from({ length: ROWS }, () =>
            Array.from({ length: COLS }, () => ({
              letter: '',
              letterState: INITIAL
            }))
          )
      }
    }),

    // get word of the day
    getWord: assign((context) => {
      console.log('* getWord')
      return {
        answer: 'world',
      }
    }),

    fillCell: assign((context, event) => {
      console.log('* fillCell')
      const boardCopy = JSON.parse(JSON.stringify(context.board))

      let currentRow = boardCopy[context.currentRowIndex]
      for (const cell of currentRow) {
        if (!cell.letter) {
          cell.letter = event.letter
          break
        }
      }

      return {
        guess: getString(currentRow),
        board: boardCopy
      }
    }),

    clearCell: assign((context) => {
      console.log('* clearCell')
      const boardCopy = JSON.parse(JSON.stringify(context.board))

      let currentRow = boardCopy[context.currentRowIndex]
      for (const cell of [...currentRow].reverse()) {
        if (cell.letter) {
          cell.letter = ''
          break;
        }
      }

      return {
        guess: getString(currentRow),
        board: boardCopy
      }
    }),

    completeRow: assign((context) => {
      console.log('* completeRow')
      const boardCopy = JSON.parse(JSON.stringify(context.board))
      const statesCopy = JSON.parse(JSON.stringify(context.letterStates))

      // set letterStates
      const states = getLetterStates(context.guess, context.answer)
      const i = context.currentRowIndex
      for (let j = 0; j < states.length; j++) {
        const c = context.guess.charAt(j)

        // set board letterState
        boardCopy[i][j].letterState = states[j]

        // set keyboard letterState
        statesCopy[c] = maxLetterState(
          states[j],
          statesCopy[c]
        )
      }

      return {
        guess: '',
        currentRowIndex: context.currentRowIndex + 1,
        board: boardCopy,
        letterStates: statesCopy,
      }
    }),

    invalid: assign({
      message: 'INVALID',
    }),

    win: assign({
      message: 'WIN',
    }),

    lose: assign({
      message: 'LOSE'
    }),

    continue: assign({
      message: 'CONTINUE'
    }),
  },

  // Guards
  guards: {

    isValid: (context) => {
      // pre completeRow
      const guess = getString(context.board[context.currentRowIndex])
      const ret = answers.includes(guess)
      console.log('isValid', ret)
      return ret
    },

    isWin: (context) => {
      // post completeRow
      const guess = getString(context.board[context.currentRowIndex - 1])
      const ret = guess === context.answer
      console.log('isWin', ret, guess)
      return ret
    },

    isLose: (context) => {
      const ret = context.currentRowIndex >= ROWS
      console.log('isLose', ret)
      return ret
    }  
  }
})

// Run machine in Node/Vanilla JS
const wordleService =
  interpret(wordleMachine)
    .onTransition((state) => {
      console.log('---')
      console.log(
        'event: ', state.event
      )
      console.log(
        'state: ', state.value
      )
      console.log(
        'context: ', state.context
      )
      state.context.board.forEach((row, i) => {
        row.forEach((cell, j) => {
          console.log(`[${i}][${j}] '${cell.letter}' '${cell.letterState}'`)
        })
      })
    })
    .start()  // Start the service
 
wordleService.send({ type: 'PLAY' })
wordleService.send({ type: 'LETTER', letter: 'h' })
wordleService.send({ type: 'LETTER', letter: 'e' })
wordleService.send({ type: 'LETTER', letter: 'l' })
wordleService.send({ type: 'LETTER', letter: 'l' })
wordleService.send({ type: 'LETTER', letter: 'o' })
wordleService.send({ type: 'ENTER' })
wordleService.send({ type: 'LETTER', letter: 'w' })
wordleService.send({ type: 'LETTER', letter: 'o' })
wordleService.send({ type: 'LETTER', letter: 'r' })
wordleService.send({ type: 'LETTER', letter: 'l' })
wordleService.send({ type: 'LETTER', letter: 'd' })
wordleService.send({ type: 'ENTER' })
wordleService.send({ type: 'RESET' })
