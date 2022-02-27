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
    answer: '',
    guess: '',
    message: '',
    currentRowIndex: 0,
    board: null,
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
        answer: '',
        guess: '',
        message: '',
        currentRowIndex: 0,

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

    getWord: assign((context) => {       // get word of the day
      console.log('* getWord')
      return {
        answer: 'world',
      }
    }),

    fillCell: assign((context, event) => {
      console.log('* fillCell')
      let currentRow = context.board[context.currentRowIndex]
      for (const cell of currentRow) {
        if (!cell.letter) {
          cell.letter = event.letter
          break
        }
      }

      return {
        guess: getString(currentRow)
      }
    }),

    clearCell: assign((context) => {
      console.log('* clearCell')

      let currentRow = context.board[context.currentRowIndex]
      for (const cell of [...currentRow].reverse()) {
        if (cell.letter) {
          cell.letter = ''
          break;
        }
      }

      return {
        guess: getString(currentRow)
      }
    }),

    completeRow: assign((context) => {
      console.log('* completeRow')
      return {
        currentRowIndex: context.currentRowIndex + 1,
        guess: '',
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
      const ret = answers.includes(getString(context.board[context.currentRowIndex]))
      console.log('isValid', ret)
      return ret
    },

    isWin: (context) => {
      const guess = getString(context.board[context.currentRowIndex - 1])
      const ret = context.answer === guess
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



/*
wordleService.send({ type: 'RESET' })

wordleService.send({ type: 'PLAY' })
wordleService.send({ type: 'LETTER', letter: 'hello!' })
wordleService.send({ type: 'BACKSPACE' })
wordleService.send({ type: 'LETTER', letter: 'x' })

wordleService.send({ type: 'BACKSPACE' })
*/

/*
wordleService.send({ type: 'PLAY' })
wordleService.send({ type: 'LETTER', letter: 'hello' })
wordleService.send({ type: 'ENTER' })
wordleService.send({ type: 'LETTER', letter: 'hello' })
wordleService.send({ type: 'ENTER' })
wordleService.send({ type: 'LETTER', letter: 'hello' })
wordleService.send({ type: 'ENTER' })
wordleService.send({ type: 'LETTER', letter: 'hello' })
wordleService.send({ type: 'ENTER' })
wordleService.send({ type: 'LETTER', letter: 'hello' })
wordleService.send({ type: 'ENTER' })
wordleService.send({ type: 'LETTER', letter: 'hello' })
wordleService.send({ type: 'ENTER' })
*/